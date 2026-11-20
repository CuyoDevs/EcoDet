"""Datos de ejemplo (HU-19 / DET-27, CU-08, RN-16): `POST /api/inmuebles/demo`."""
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import Alerta, EstadoAlertaEnum, Lectura, Usuario
from ..schemas import InmuebleOut
from ..services.demo import DemoYaExisteError, cargar_inmueble_demo

router = APIRouter(prefix="/api/inmuebles", tags=["demo"])


@router.post("/demo", response_model=InmuebleOut, status_code=status.HTTP_201_CREATED)
def cargar_datos_de_ejemplo(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """Crea el inmueble de demostración del usuario autenticado, con alertas conocidas.

    Solo se puede tener uno (RN-16): si ya existe responde 409 y no duplica nada. Para volver a
    cargarlo hay que eliminar el actual (HU-07).
    """
    try:
        inmueble = cargar_inmueble_demo(db, usuario)
    except DemoYaExisteError:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "errores": {
                    "general": (
                        "Ya cargaste los datos de ejemplo. Elimina el inmueble de demostración "
                        "si quieres volver a cargarlos."
                    )
                }
            },
        )

    pendientes = (
        db.query(func.count(Alerta.id))
        .join(Lectura, Alerta.lectura_id == Lectura.id)
        .filter(Lectura.inmueble_id == inmueble.id, Alerta.estado == EstadoAlertaEnum.PENDIENTE)
        .scalar()
    ) or 0

    return InmuebleOut(
        id=inmueble.id,
        usuario_id=inmueble.usuario_id,
        nombre=inmueble.nombre,
        direccion=inmueble.direccion,
        es_demo=inmueble.es_demo,
        alertas_pendientes=pendientes,
    )
