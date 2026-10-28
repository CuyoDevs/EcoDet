"""Dependencias de FastAPI reutilizables por todos los routers (DET-38).

`get_current_user` es la base de RN-01: cualquier endpoint privado la declara con
`Depends(get_current_user)` y filtra sus consultas por el usuario que devuelve.
La lógica de JWT vive en security.py; acá solo se conecta con FastAPI.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .database import get_db
from .models import Usuario
from .security import JWTError, decodificar_token

# Un único mensaje para todo fallo de sesión (sin token, token inválido, vencido o de una cuenta
# que ya no existe): no se le da pistas a quien intente falsificar un token.
MENSAJE_SESION_INVALIDA = "Tu sesión no es válida o venció. Inicia sesión de nuevo."

# auto_error=False: si falta el header, el 401 lo devolvemos nosotros con el mismo mensaje.
# Además hace que Swagger (/docs) muestre el botón "Authorize" para pegar un token.
_esquema_bearer = HTTPBearer(auto_error=False)


def _no_autorizado() -> HTTPException:
    return HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        MENSAJE_SESION_INVALIDA,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credenciales: HTTPAuthorizationCredentials | None = Depends(_esquema_bearer),
    db: Session = Depends(get_db),
) -> Usuario:
    """Devuelve el usuario dueño del token `Authorization: Bearer <token>`.

    Responde 401 si falta el header, el token está adulterado o vencido, o la cuenta ya no existe.
    """
    if credenciales is None:
        raise _no_autorizado()
    try:
        claims = decodificar_token(credenciales.credentials)
        usuario_id = int(claims["sub"])
    except (JWTError, KeyError, TypeError, ValueError):
        raise _no_autorizado()

    usuario = db.get(Usuario, usuario_id)
    if usuario is None:  # token válido de una cuenta eliminada
        raise _no_autorizado()
    return usuario
