"""Carga del inmueble de demostración (HU-19 / DET-27, CU-08, RN-16).

Crea un inmueble identificado como demostración (`es_demo`) con las lecturas de `datos_demo` y
deja que el detector genere las alertas con la misma lógica que la carga en lote (HU-09, HU-12,
HU-13): primero se guardan todas las lecturas y después se evalúa cada una contra las demás del
servicio. Todo ocurre en una sola transacción: o se crea completo o no se crea nada.
"""
from sqlalchemy.orm import Session

from ..models import Inmueble, Lectura, ServicioEnum, Usuario
from .datos_demo import DIRECCION_DEMO, NOMBRE_DEMO, SERIES_DEMO, periodos_demo
from .detector import alerta_desde_resultado, evaluar_lectura


class DemoYaExisteError(Exception):
    """El usuario ya tiene su inmueble de demostración (RN-16: solo uno por usuario)."""


def usuario_tiene_demo(db: Session, usuario_id: int) -> bool:
    """Se detecta por la marca `es_demo`, no por el nombre, que el usuario puede cambiar."""
    return (
        db.query(Inmueble.id)
        .filter(Inmueble.usuario_id == usuario_id, Inmueble.es_demo.is_(True))
        .first()
        is not None
    )


def _nombre_disponible(db: Session, usuario_id: int) -> str:
    """`(usuario_id, nombre)` es único: si ya tiene un inmueble común con ese nombre, agrega un número."""
    existentes = {
        nombre for (nombre,) in db.query(Inmueble.nombre).filter(Inmueble.usuario_id == usuario_id).all()
    }
    nombre, numero = NOMBRE_DEMO, 1
    while nombre in existentes:
        numero += 1
        nombre = f"{NOMBRE_DEMO} {numero}"
    return nombre


def cargar_inmueble_demo(db: Session, usuario: Usuario) -> Inmueble:
    """Crea el inmueble de demostración del usuario con sus lecturas y alertas.

    Lanza `DemoYaExisteError` si ya lo tiene. Si algo falla a mitad de camino se hace rollback.
    """
    if usuario_tiene_demo(db, usuario.id):
        raise DemoYaExisteError()

    try:
        inmueble = Inmueble(
            usuario_id=usuario.id,
            nombre=_nombre_disponible(db, usuario.id),
            direccion=DIRECCION_DEMO,
            es_demo=True,
        )
        db.add(inmueble)
        db.flush()

        lecturas = []
        for servicio in SERIES_DEMO:
            for inicio, fin, consumo in periodos_demo(servicio):
                lectura = Lectura(
                    inmueble_id=inmueble.id,
                    servicio=ServicioEnum(servicio),
                    fecha_inicio=inicio,
                    fecha_fin=fin,
                    consumo=consumo,
                )
                db.add(lectura)
                lecturas.append(lectura)
        db.flush()

        # Igual que el lote: cada lectura se evalúa contra las demás del servicio (la propia queda afuera).
        for lectura in lecturas:
            alerta = alerta_desde_resultado(lectura, evaluar_lectura(db, lectura))
            if alerta is not None:
                db.add(alerta)

        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(inmueble)
    return inmueble
