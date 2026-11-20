"""Umbral de sensibilidad por inmueble y servicio (HU-18 / DET-26, CU-07, RN-09, RN-17).

El detector ya lee `UmbralServicio` en `services/detector.py::umbral_vigente`: acá solo se
consulta y se guarda esa fila. Sin fila rige el valor inicial de `config.json` (RN-09).
Guardar un umbral NO recalcula alertas ya generadas: aplica a las detecciones siguientes (RN-17).
"""
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from ..config import detector_config
from ..database import get_db
from ..dependencies import get_current_user
from ..models import Inmueble, ServicioEnum, UmbralServicio, Usuario
from ..schemas import UmbralIn, UmbralOut

router = APIRouter(prefix="/api/inmuebles", tags=["umbrales"])


def _inmueble_del_usuario(db: Session, inmueble_id: int, usuario: Usuario) -> Inmueble | None:
    """RN-01: solo se ven y modifican los inmuebles propios."""
    return (
        db.query(Inmueble)
        .filter(Inmueble.id == inmueble_id, Inmueble.usuario_id == usuario.id)
        .first()
    )


def _inmueble_no_encontrado() -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={"errores": {"general": "Inmueble no encontrado."}},
    )


@router.get("/{inmueble_id}/umbrales", response_model=list[UmbralOut])
def listar_umbrales(
    inmueble_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """Umbral vigente de los tres servicios del inmueble (el inicial si el usuario no lo cambió)."""
    if not _inmueble_del_usuario(db, inmueble_id, usuario):
        return _inmueble_no_encontrado()

    guardados = {
        umbral.servicio: umbral.desvios
        for umbral in db.query(UmbralServicio).filter(UmbralServicio.inmueble_id == inmueble_id).all()
    }
    return [
        UmbralOut(
            servicio=servicio,
            desvios=guardados.get(servicio, detector_config.umbral_inicial_en_desvios),
            personalizado=servicio in guardados,
        )
        for servicio in ServicioEnum
    ]


@router.put("/{inmueble_id}/umbrales/{servicio}", response_model=UmbralOut)
def guardar_umbral(
    inmueble_id: int,
    servicio: ServicioEnum,
    umbral_in: UmbralIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """Guarda (crea o actualiza) el umbral del servicio.

    `UmbralIn` rechaza texto, cero, negativos y no finitos con 422 antes de llegar acá, así que
    un valor inválido nunca toca la base y el umbral anterior se conserva.
    """
    if not _inmueble_del_usuario(db, inmueble_id, usuario):
        return _inmueble_no_encontrado()

    umbral = (
        db.query(UmbralServicio)
        .filter(UmbralServicio.inmueble_id == inmueble_id, UmbralServicio.servicio == servicio)
        .first()
    )
    if umbral:
        umbral.desvios = umbral_in.desvios
    else:
        umbral = UmbralServicio(inmueble_id=inmueble_id, servicio=servicio, desvios=umbral_in.desvios)
        db.add(umbral)

    db.commit()
    db.refresh(umbral)
    return UmbralOut(servicio=umbral.servicio, desvios=umbral.desvios, personalizado=True)
