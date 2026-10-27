"""Endpoints de autenticación. DET-30/31: registro. HU-03 agrega /login acá mismo."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Usuario
from ..schemas import RegistroIn, TokenOut, UsuarioOut
from ..security import crear_token_acceso, hashear_contrasena

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

MENSAJE_CORREO_REPETIDO = "Ya existe una cuenta con ese correo. Inicia sesión o usa otro correo."


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def registrar(datos: RegistroIn, db: Session = Depends(get_db)):
    """CU-01 · Registrarse. Crea la cuenta, guarda la contraseña cifrada e inicia la sesión (JWT)."""
    if db.scalar(select(Usuario).where(Usuario.correo == datos.correo)):
        raise HTTPException(status.HTTP_409_CONFLICT, MENSAJE_CORREO_REPETIDO)

    usuario = Usuario(
        nombre=datos.nombre,
        correo=datos.correo,
        contrasena_hash=hashear_contrasena(datos.contrasena),
    )
    db.add(usuario)
    try:
        db.commit()
    except IntegrityError:  # dos registros simultáneos con el mismo correo
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, MENSAJE_CORREO_REPETIDO)
    db.refresh(usuario)

    return TokenOut(
        access_token=crear_token_acceso(usuario.id),
        usuario=UsuarioOut.model_validate(usuario),
    )
