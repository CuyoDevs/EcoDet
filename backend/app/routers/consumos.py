"""Endpoint para la carga y registro de lecturas de consumo (HU-08 / DET-16).
Permite registrar un nuevo consumo asociado a un inmueble validando
las reglas de negocio (RN-02, RN-03, RN-04, RN-05, RN-14).
"""
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Lectura, Inmueble, Usuario
from ..schemas import LecturaIn, LecturaOut
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/consumos", tags=["consumos"])


@router.post("", response_model=LecturaOut, status_code=status.HTTP_201_CREATED)
def crear_lectura(
    lectura_in: LecturaIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    Registra una nueva lectura de consumo para un inmueble del usuario autenticado (DET-16).
    """
    # 1. Verificar que el inmueble exista y pertenezca al usuario autenticado (RN-01)
    inmueble = db.query(Inmueble).filter(
        Inmueble.id == lectura_in.inmueble_id,
        Inmueble.usuario_id == usuario.id
    ).first()

    if not inmueble:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"errores": {"inmueble_id": "El inmueble no existe o no pertenece al usuario."}}
        )

    # 2. Validar superposición de períodos para el mismo servicio en el inmueble (RN-14)
    superposicion = db.query(Lectura).filter(
        Lectura.inmueble_id == lectura_in.inmueble_id,
        Lectura.servicio == lectura_in.servicio,
        Lectura.fecha_inicio <= lectura_in.fecha_fin,
        Lectura.fecha_fin >= lectura_in.fecha_inicio
    ).first()

    if superposicion:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"errores": {"fecha_inicio": "El período ingresado se superpone con otra lectura existente para este servicio."}}
        )

    # 3. Crear y guardar la nueva lectura de consumo
    nueva_lectura = Lectura(
        inmueble_id=lectura_in.inmueble_id,
        servicio=lectura_in.servicio,
        fecha_inicio=lectura_in.fecha_inicio,
        fecha_fin=lectura_in.fecha_fin,
        consumo=lectura_in.consumo
    )

    db.add(nueva_lectura)
    db.commit()
    db.refresh(nueva_lectura)

    return nueva_lectura
