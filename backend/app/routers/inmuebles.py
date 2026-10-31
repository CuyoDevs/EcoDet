from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Inmueble, Usuario
from ..schemas import InmuebleIn, InmuebleOut
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/inmuebles", tags=["inmuebles"])


@router.get("/", response_model=list[InmuebleOut])
def listar_inmuebles(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """Devuelve solo los inmuebles del usuario autenticado (RN-01)."""
    return (
        db.query(Inmueble)
        .filter(Inmueble.usuario_id == usuario.id)
        .order_by(Inmueble.id)
        .all()
    )


@router.post("/", response_model=InmuebleOut, status_code=status.HTTP_201_CREATED)
def crear_inmueble(
    inmueble_in: InmuebleIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    Crea un nuevo inmueble asociado al usuario autenticado.
    """
    existente = db.query(Inmueble).filter(
        Inmueble.usuario_id == usuario.id,
        Inmueble.nombre == inmueble_in.nombre
    ).first()

    if existente:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"errores": {"nombre": "Ya tienes un inmueble con este nombre."}}
        )

    nuevo_inmueble = Inmueble(
        usuario_id=usuario.id,
        nombre=inmueble_in.nombre,
        direccion=inmueble_in.direccion
    )
    
    db.add(nuevo_inmueble)
    db.commit()
    db.refresh(nuevo_inmueble)

    return nuevo_inmueble


@router.put("/{inmueble_id}", response_model=InmuebleOut)
def actualizar_inmueble(
    inmueble_id: int,
    inmueble_in: InmuebleIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    Actualiza los datos de un inmueble existente perteneciente al usuario autenticado.
    """
    inmueble = db.query(Inmueble).filter(
        Inmueble.id == inmueble_id,
        Inmueble.usuario_id == usuario.id
    ).first()

    if not inmueble:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"errores": {"general": "Inmueble no encontrado."}}
        )

    existente = db.query(Inmueble).filter(
        Inmueble.usuario_id == usuario.id,
        Inmueble.nombre == inmueble_in.nombre,
        Inmueble.id != inmueble_id
    ).first()

    if existente:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"errores": {"nombre": "Ya tienes otro inmueble con este nombre."}}
        )

    inmueble.nombre = inmueble_in.nombre
    inmueble.direccion = inmueble_in.direccion

    db.commit()
    db.refresh(inmueble)

    return inmueble