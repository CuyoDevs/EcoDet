"""Motor de evaluación estadística de lecturas (CU-06 / RN-06 a RN-12).

Encapsula el cálculo que comparten la evaluación al cargar una lectura (HU-12 / DET-20)
y la reevaluación al editarla (HU-11 / DET-75).

Reglas implementadas:
- RN-06: consumo por día = consumo / (fecha_fin - fecha_inicio + 1).
- RN-07: mínimo de lecturas por servicio e inmueble; si la referencia queda con menos
  de 3 lecturas (descontando la evaluada y las marcadas "normal"), no se evalúa.
- RN-08: si hay >= 3 lecturas de la misma estación (según el punto medio del período),
  esa es la referencia; si no, se usa el historial general.
- RN-09: umbral vigente del inmueble y servicio, o el inicial de configuración.
- RN-10: alerta ALTA si supera el límite superior; BAJA si queda bajo el inferior.
- RN-11: las lecturas con alerta "normal" no integran la referencia.
- RN-12: promedio simple y desvío muestral (n-1), con piso del 10 % del promedio.
"""
from datetime import date
from statistics import stdev

from sqlalchemy.orm import Session

from ..config import detector_config
from ..models import (
    Alerta,
    EstadoAlertaEnum,
    Lectura,
    TipoAlertaEnum,
    UmbralServicio,
)

MESES_POR_ESTACION = {
    "VERANO": (12, 1, 2),
    "OTOÑO": (3, 4, 5),
    "INVIERNO": (6, 7, 8),
    "PRIMAVERA": (9, 10, 11),
}


def estacion_de(fecha: date) -> str:
    """Estación meteorológica del hemisferio sur a la que pertenece la fecha."""
    for estacion, meses in MESES_POR_ESTACION.items():
        if fecha.month in meses:
            return estacion
    raise ValueError(f"Mes inválido: {fecha.month}")


def punto_medio(fecha_inicio: date, fecha_fin: date) -> date:
    """Día central del período (los días se cuentan de forma inclusiva)."""
    return fecha_inicio + (fecha_fin - fecha_inicio) / 2


def _umbral_vigente(db: Session, lectura: Lectura) -> float:
    """Umbral configurado para el inmueble y servicio, o el inicial del sistema (RN-09)."""
    umbral = (
        db.query(UmbralServicio)
        .filter(
            UmbralServicio.inmueble_id == lectura.inmueble_id,
            UmbralServicio.servicio == lectura.servicio,
        )
        .first()
    )
    return umbral.desvios if umbral else detector_config.umbral_inicial_en_desvios


def _integran_referencia(lectura: Lectura, evaluada: Lectura) -> bool:
    """La lectura evaluada no es su propia referencia y las "normal" quedan afuera (RN-11, RN-12)."""
    if lectura.id == evaluada.id:
        return False
    return lectura.alerta is None or lectura.alerta.estado != EstadoAlertaEnum.NORMAL


def evaluar_lectura(db: Session, lectura: Lectura) -> Alerta | None:
    """Evalúa una lectura contra su historial y devuelve la alerta resultante, si corresponde.

    No persiste nada: el llamador decide si agrega la alerta a la sesión. La lectura debe
    estar guardada (tener `id`) para poder excluirla de su propia referencia.
    """
    lecturas = (
        db.query(Lectura)
        .filter(
            Lectura.inmueble_id == lectura.inmueble_id,
            Lectura.servicio == lectura.servicio,
        )
        .all()
    )

    # RN-07: con menos lecturas el sistema todavía está aprendiendo el patrón.
    if len(lecturas) < detector_config.minimo_de_lecturas:
        return None

    referencia = [otra for otra in lecturas if _integran_referencia(otra, lectura)]

    # RN-07: si tras excluir la evaluada y las "normal" quedan menos de 3, tampoco se evalúa.
    if len(referencia) < 3:
        return None

    # RN-08: referencia estacional si hay al menos 3 lecturas de la misma estación.
    estacion = estacion_de(punto_medio(lectura.fecha_inicio, lectura.fecha_fin))
    de_la_estacion = [
        otra for otra in referencia
        if estacion_de(punto_medio(otra.fecha_inicio, otra.fecha_fin)) == estacion
    ]
    if len(de_la_estacion) >= 3:
        referencia = de_la_estacion

    # RN-12: promedio simple, desvío muestral (n-1) y piso del 10 % del promedio.
    consumos_por_dia = [otra.consumo_por_dia for otra in referencia]
    promedio = sum(consumos_por_dia) / len(consumos_por_dia)
    piso = promedio * detector_config.piso_del_desvio_porcentaje_del_promedio / 100
    desvio_efectivo = max(stdev(consumos_por_dia), piso)

    umbral = _umbral_vigente(db, lectura)
    limite_inferior = promedio - umbral * desvio_efectivo
    limite_superior = promedio + umbral * desvio_efectivo

    # RN-10: alerta ALTA si supera el límite superior; BAJA si queda bajo el inferior.
    consumo = lectura.consumo_por_dia
    if consumo > limite_superior:
        tipo = TipoAlertaEnum.ALTA
    elif consumo < limite_inferior:
        tipo = TipoAlertaEnum.BAJA
    else:
        return None

    desvio_porcentual = ((consumo - promedio) / promedio * 100) if promedio else 0.0

    return Alerta(
        lectura_id=lectura.id,
        tipo=tipo,
        estado=EstadoAlertaEnum.PENDIENTE,
        desvio_porcentual=round(desvio_porcentual, 2),
        consumo_por_dia=round(consumo, 4),
        consumo_habitual_por_dia=round(promedio, 4),
    )


def reemplazar_alerta_de_lectura(db: Session, lectura: Lectura) -> Alerta | None:
    """Reevalúa la lectura editada y reemplaza su alerta anterior por el resultado nuevo (DET-75).

    Solo toca la alerta de esta lectura: las alertas ya generadas para las demás no se
    recalculan (RN-17). Devuelve la alerta nueva o `None` si la lectura quedó dentro de los límites.
    """
    if lectura.alerta is not None:
        db.delete(lectura.alerta)
    # Deja la edición y el borrado de la alerta vieja en la transacción antes de calcular,
    # así la referencia ve el estado real y no choca con la restricción única de `alertas.lectura_id`.
    db.flush()

    alerta = evaluar_lectura(db, lectura)
    if alerta is not None:
        db.add(alerta)
    return alerta
