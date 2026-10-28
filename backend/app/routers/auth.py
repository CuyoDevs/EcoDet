"""Endpoints de autenticación. DET-30/31: registro. DET-37: login (HU-03)."""
from functools import lru_cache

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import Usuario
from ..schemas import CONTRASENA_MAX_BYTES, LoginIn, RegistroIn, TokenOut, UsuarioOut
from ..security import crear_token_acceso, hashear_contrasena, verificar_contrasena

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

MENSAJE_CORREO_REPETIDO = "Ya existe una cuenta con ese correo. Inicia sesión o usa otro correo."
# Un único mensaje para "el correo no existe" y "la contraseña no coincide" (HU-03, criterio 2).
MENSAJE_CREDENCIALES_INCORRECTAS = "Correo o contraseña incorrectos."


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


@lru_cache(maxsize=1)
def _hash_de_relleno() -> str:
    return hashear_contrasena("relleno-para-igualar-tiempos-1")


@router.post("/login", response_model=TokenOut)
def iniciar_sesion(datos: LoginIn, db: Session = Depends(get_db)):
    """CU-02 · Iniciar sesión. Devuelve el mismo TokenOut que el registro (JWT + usuario).

    Cualquier fallo de credenciales (correo inexistente, contraseña incorrecta o mal formada)
    responde 401 con el mismo mensaje, para no revelar qué cuentas existen.
    """
    usuario = db.scalar(select(Usuario).where(Usuario.correo == datos.correo))

    # Se verifica SIEMPRE contra un hash, exista o no la cuenta, para que el tiempo de respuesta
    # no delate qué correos están registrados.
    hash_a_comparar = usuario.contrasena_hash if usuario else _hash_de_relleno()
    contrasena_ok = verificar_contrasena(datos.contrasena, hash_a_comparar)
    # bcrypt solo mira 72 bytes: una contraseña más larga que el máximo del registro nunca es válida.
    contrasena_ok = contrasena_ok and len(datos.contrasena.encode("utf-8")) <= CONTRASENA_MAX_BYTES

    if usuario is None or not contrasena_ok:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            MENSAJE_CREDENCIALES_INCORRECTAS,
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenOut(
        access_token=crear_token_acceso(usuario.id),
        usuario=UsuarioOut.model_validate(usuario),
    )



@router.get(
    "/me",
    response_model=UsuarioOut,
    responses={status.HTTP_401_UNAUTHORIZED: {"description": "Falta el token, es inválido o venció."}},
)
def usuario_actual(usuario: Usuario = Depends(get_current_user)):
    """Devuelve los datos de la cuenta con la sesión activa (id, nombre y correo).
    El frontend lo usa para confirmar que el token guardado sigue siendo válido.
    """
    return usuario