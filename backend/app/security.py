"""Utilidades de seguridad reutilizables: hash de contraseñas y JWT (DET-31).

HU-03 (login) y DET-38 (get_current_user) usan este mismo módulo.

Nota sobre bcrypt: se usa la librería `bcrypt` directamente en lugar de Passlib.
Passlib 1.7.4 ya no se mantiene y falla con bcrypt >= 4.1 / 5.x (el que instala
hoy `pip install -r requirements.txt`). El algoritmo sigue siendo bcrypt (RN-15).
"""
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt  # noqa: F401  (JWTError se re-exporta para quien decodifica)

from .config import SECRET_KEY_DE_DESARROLLO, settings

_CLAVES_INSEGURAS = {
    SECRET_KEY_DE_DESARROLLO,
    "cambiar_esta_clave_secreta_en_produccion_123456789",  # valor de .env.example
}


# ---------- contraseñas ----------
def hashear_contrasena(contrasena: str) -> str:
    """Devuelve el hash bcrypt (con sal propia). Nunca se guarda la contraseña en texto plano."""
    return bcrypt.hashpw(contrasena.encode("utf-8"), bcrypt.gensalt()).decode("ascii")


def verificar_contrasena(contrasena: str, contrasena_hash: str) -> bool:
    try:
        return bcrypt.checkpw(contrasena.encode("utf-8"), contrasena_hash.encode("ascii"))
    except ValueError:  # hash mal formado o contraseña > 72 bytes
        return False


# ---------- JWT ----------
def _clave_secreta() -> str:
    if settings.ENVIRONMENT.lower() != "development" and settings.SECRET_KEY in _CLAVES_INSEGURAS:
        raise RuntimeError(
            "SECRET_KEY insegura: definí una clave propia en el .env antes de usar ENVIRONMENT distinto de 'development'."
        )
    return settings.SECRET_KEY


def crear_token_acceso(usuario_id: int, expira_minutos: int | None = None) -> str:
    """JWT HS256 con sub = id del usuario. Duración: ACCESS_TOKEN_EXPIRE_MINUTES."""
    ahora = datetime.now(timezone.utc)
    minutos = settings.ACCESS_TOKEN_EXPIRE_MINUTES if expira_minutos is None else expira_minutos
    claims = {"sub": str(usuario_id), "iat": ahora, "exp": ahora + timedelta(minutes=minutos)}
    return jwt.encode(claims, _clave_secreta(), algorithm=settings.ALGORITHM)


def decodificar_token(token: str) -> dict:
    """Devuelve los claims o lanza JWTError si el token es inválido o está vencido."""
    return jwt.decode(token, _clave_secreta(), algorithms=[settings.ALGORITHM])
