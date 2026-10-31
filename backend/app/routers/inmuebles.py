 DET-13-crear-inmueble
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Inmueble, Usuario
from ..schemas import InmuebleIn, InmuebleOut
from ..dependencies import get_current_user  # Asumiendo que el archivo de tu compañero se llama dependencies.py

router = APIRouter(prefix="/api/inmuebles", tags=["inmuebles"])

@router.post("/", response_model=InmuebleOut, status_code=status.HTTP_201_CREATED)
def crear_inmueble(
    inmueble_in: InmuebleIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    Crea un nuevo inmueble asociado al usuario autenticado.
    """
    # 1. Verificar que el usuario no tenga ya un inmueble con ese mismo nombre
    existente = db.query(Inmueble).filter(
        Inmueble.usuario_id == usuario.id,
        Inmueble.nombre == inmueble_in.nombre
    ).first()

    if existente:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"errores": {"nombre": "Ya tienes un inmueble con este nombre."}}
        )

    # 2. Crear y guardar el nuevo inmueble
    nuevo_inmueble = Inmueble(
        usuario_id=usuario.id,
        nombre=inmueble_in.nombre,
        direccion=inmueble_in.direccion
    )
    
    db.add(nuevo_inmueble)
    db.commit()
    db.refresh(nuevo_inmueble)

    return nuevo_inmueble


 main
