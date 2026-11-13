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
- RN-10: resultado ALTA si supera el límite superior; BAJA si queda bajo el inferior.
- RN-11: las lecturas con alerta "normal" no integran la referencia.
- RN-12: promedio simple y desvío muestral (n-1), con piso del 10 % del promedio.

La evaluación NO persiste alertas: devuelve un `ResultadoEvaluacion` que HU-13 usa para
armar la alerta. La reevaluación de una edición (DET-75) es la única que sigue creando la
alerta, a través de `reemplazar_alerta_de_lectura`.
"""
import enum
from dataclasses import dataclass
from datetime import date, timedelta
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

# RN-07 / RN-08: la referencia necesita al menos 3 lecturas; con 3 de la misma estación
# ya alcanza para preferir la referencia estacional sobre el historial general.
MINIMO_REFERENCIA = 3


class EstadoEvaluacion(str, enum.Enum):
    """Resultado posible de comparar una lectura contra su referencia."""

    APRENDIENDO = "aprendiendo"
    DENTRO = "dentro"
    ALTA = "alta"
    BAJA = "baja"


@dataclass(frozen=True)
class ResultadoEvaluacion:
    """Datos que HU-13 necesita para generar (o no) la alerta de una lectura."""

    estado: EstadoEvaluacion
    consumo_por_dia: float
    umbral: float
    promedio: float | None = None
    desvio_efectivo: float | None = None
    limite_inferior: float | None = None
    limite_superior: float | None = None
    cantidad_referencia: int = 0
    referencia_estacional: bool = False
    motivo: str | None = None


def consumo_por_dia(consumo: float, fecha_inicio: date, fecha_fin: date) -> float:
    """RN-06: consumo del período dividido por los días, contando el día final.

    El período es inclusivo: del 1 al 31 de enero son 31 días. Un período de un solo
    día divide por 1. Si las fechas vinieran invertidas devuelve 0 para no dividir por
    cero (la carga y la edición ya rechazan ese caso con 422).
    """
    dias = (fecha_fin - fecha_inicio).days + 1
    return consumo / dias if dias > 0 else 0.0


def estacion_de(fecha: date) -> str:
    """Estación meteorológica del hemisferio sur a la que pertenece la fecha."""
    for estacion, meses in MESES_POR_ESTACION.items():
        if fecha.month in meses:
            return estacion
    raise ValueError(f"Mes inválido: {fecha.month}")


def punto_medio(fecha_inicio: date, fecha_fin: date) -> date:
    """Día central del período, contando ambos extremos.

    Con una cantidad par de días se toma el día anterior al centro exacto (división
    entera), que es el criterio con el que se asigna la estación.
    """
    return fecha_inicio + timedelta(days=(fecha_fin - fecha_inicio).days // 2)


def umbral_vigente(db: Session, inmueble_id: int, servicio) -> float:
    """Umbral configurado para el inmueble y servicio, o el inicial del sistema (RN-09).

    Es el punto donde HU-18 guardará el umbral ajustado por el usuario: alcanza con
    insertar/actualizar la fila de `UmbralServicio`, sin tocar el detector.
    """
    umbral = (
        db.query(UmbralServicio)
        .filter(
            UmbralServicio.inmueble_id == inmueble_id,
            UmbralServicio.servicio == servicio,
        )
        .first()
    )
    return umbral.desvios if umbral else detector_config.umbral_inicial_en_desvios


def _es_la_evaluada(lectura: Lectura, evaluada: Lectura) -> bool:
    """La lectura evaluada nunca integra su propia referencia (RN-12)."""
    if lectura is evaluada:
        return True
    return evaluada.id is not None and lectura.id == evaluada.id


def _integran_referencia(lectura: Lectura, evaluada: Lectura) -> bool:
    """La evaluada queda afuera y las marcadas "normal" tampoco cuentan (RN-11, RN-12)."""
    if _es_la_evaluada(lectura, evaluada):
        return False
    return lectura.alerta is None or lectura.alerta.estado != EstadoAlertaEnum.NORMAL


def seleccionar_referencia(
    lecturas: list[Lectura], evaluada: Lectura
) -> tuple[list[Lectura], bool]:
    """Arma la referencia de la lectura evaluada (RN-08, RN-11, RN-12).

    `lecturas` son todas las del mismo inmueble y servicio, incluida la evaluada.
    Devuelve `(referencia, es_estacional)`: si hay al menos 3 lecturas de la misma
    estación que la evaluada, la referencia es esa; si no, es el historial general.
    """
    referencia = [otra for otra in lecturas if _integran_referencia(otra, evaluada)]

    estacion = estacion_de(punto_medio(evaluada.fecha_inicio, evaluada.fecha_fin))
    de_la_estacion = [
        otra
        for otra in referencia
        if estacion_de(punto_medio(otra.fecha_inicio, otra.fecha_fin)) == estacion
    ]
    if len(de_la_estacion) >= MINIMO_REFERENCIA:
        return de_la_estacion, True
    return referencia, False


def calcular_limites(
    consumos_por_dia: list[float], umbral: float
) -> tuple[float, float, float, float]:
    """Calcula promedio, desvío efectivo y límites (RN-12, RN-09, RN-10).

    Desvío efectivo = el mayor entre el desvío estándar muestral (n-1) y el piso del
    10 % del promedio. Límites = promedio ± umbral × desvío efectivo.
    """
    promedio = sum(consumos_por_dia) / len(consumos_por_dia)
    piso = promedio * detector_config.piso_del_desvio_porcentaje_del_promedio / 100
    desvio_efectivo = max(stdev(consumos_por_dia), piso)
    return (
        promedio,
        desvio_efectivo,
        promedio - umbral * desvio_efectivo,
        promedio + umbral * desvio_efectivo,
    )


def clasificar(
    consumo: float, limite_inferior: float, limite_superior: float
) -> EstadoEvaluacion:
    """RN-10: alta si supera el límite superior; baja si queda bajo el inferior.

    Los límites son inclusivos: un consumo exactamente igual a un límite está dentro.
    """
    if consumo > limite_superior:
        return EstadoEvaluacion.ALTA
    if consumo < limite_inferior:
        return EstadoEvaluacion.BAJA
    return EstadoEvaluacion.DENTRO


def _resultado_aprendiendo(
    lectura: Lectura,
    umbral: float,
    motivo: str,
    referencia_estacional: bool = False,
    cantidad_referencia: int = 0,
) -> ResultadoEvaluacion:
    return ResultadoEvaluacion(
        estado=EstadoEvaluacion.APRENDIENDO,
        consumo_por_dia=lectura.consumo_por_dia,
        umbral=umbral,
        cantidad_referencia=cantidad_referencia,
        referencia_estacional=referencia_estacional,
        motivo=motivo,
    )


def evaluar_lectura(db: Session, lectura: Lectura) -> ResultadoEvaluacion:
    """Evalúa una lectura contra su historial y devuelve el resultado estructurado.

    No persiste nada y tampoco crea alertas: eso queda para HU-13. La lectura debe
    estar guardada (tener `id`) para poder excluirla de su propia referencia; si no
    lo está, se agrega a la lista en memoria para no subestimar el mínimo de lecturas.
    """
    lecturas = (
        db.query(Lectura)
        .filter(
            Lectura.inmueble_id == lectura.inmueble_id,
            Lectura.servicio == lectura.servicio,
        )
        .all()
    )
    ids = {otra.id for otra in lecturas}
    if lectura.id is None or lectura.id not in ids:
        lecturas.append(lectura)

    umbral = umbral_vigente(db, lectura.inmueble_id, lectura.servicio)

    # RN-07: con menos lecturas el sistema todavía está aprendiendo el patrón.
    if len(lecturas) < detector_config.minimo_de_lecturas:
        return _resultado_aprendiendo(lectura, umbral, "lecturas_insuficientes")

    referencia, estacional = seleccionar_referencia(lecturas, lectura)

    # RN-07: si tras excluir la evaluada y las "normal" quedan menos de 3, tampoco se evalúa.
    if len(referencia) < MINIMO_REFERENCIA:
        return _resultado_aprendiendo(
            lectura,
            umbral,
            "referencia_insuficiente",
            referencia_estacional=estacional,
            cantidad_referencia=len(referencia),
        )

    consumos = [otra.consumo_por_dia for otra in referencia]
    promedio, desvio_efectivo, limite_inferior, limite_superior = calcular_limites(
        consumos, umbral
    )
    estado = clasificar(lectura.consumo_por_dia, limite_inferior, limite_superior)

    return ResultadoEvaluacion(
        estado=estado,
        consumo_por_dia=lectura.consumo_por_dia,
        umbral=umbral,
        promedio=promedio,
        desvio_efectivo=desvio_efectivo,
        limite_inferior=limite_inferior,
        limite_superior=limite_superior,
        cantidad_referencia=len(referencia),
        referencia_estacional=estacional,
    )


def alerta_desde_resultado(
    lectura: Lectura, resultado: ResultadoEvaluacion
) -> Alerta | None:
    """Traduce un resultado del detector a la alerta que persistirá HU-13 / DET-75."""
    if resultado.estado not in (EstadoEvaluacion.ALTA, EstadoEvaluacion.BAJA):
        return None

    tipo = (
        TipoAlertaEnum.ALTA
        if resultado.estado is EstadoEvaluacion.ALTA
        else TipoAlertaEnum.BAJA
    )
    promedio = resultado.promedio or 0.0
    desvio_porcentual = (
        (resultado.consumo_por_dia - promedio) / promedio * 100 if promedio else 0.0
    )

    return Alerta(
        lectura_id=lectura.id,
        tipo=tipo,
        estado=EstadoAlertaEnum.PENDIENTE,
        desvio_porcentual=round(desvio_porcentual, 2),
        consumo_por_dia=round(resultado.consumo_por_dia, 4),
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

    resultado = evaluar_lectura(db, lectura)
    alerta = alerta_desde_resultado(lectura, resultado)
    if alerta is not None:
        db.add(alerta)
    return alerta