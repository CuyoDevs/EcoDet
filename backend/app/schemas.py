"""Esquemas Pydantic V2 de la API (DET-30).

Las validaciones de HU-02 / RN-15 viven acá para que cualquier endpoint que reciba
estos datos las aplique igual. Los mensajes van en español porque se muestran
tal cual en el formulario del frontend.
"""
import re
from datetime import date
from pydantic import BaseModel, ConfigDict, field_validator
from .models import ServicioEnum

from pydantic import BaseModel, ConfigDict, field_validator

# Formato razonable de correo (sin depender de librerías extra).
_CORREO_RE = re.compile(r"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}$")

NOMBRE_MAX = 100
CORREO_MAX = 255
CONTRASENA_MIN = 8
CONTRASENA_MAX_BYTES = 72  # límite real de bcrypt


def validar_contrasena(valor: str) -> str:
    """RN-15: mínimo 8 caracteres, con letras y números."""
    if len(valor) < CONTRASENA_MIN or not any(c.isalpha() for c in valor) or not any(c.isdigit() for c in valor):
        raise ValueError("La contraseña debe tener al menos 8 caracteres, con letras y números.")
    if len(valor.encode("utf-8")) > CONTRASENA_MAX_BYTES:
        raise ValueError("La contraseña es demasiado larga (máximo 72 bytes).")
    return valor


class RegistroIn(BaseModel):
    nombre: str
    correo: str
    contrasena: str

    @field_validator("nombre")
    @classmethod
    def _nombre(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("El nombre no puede estar vacío.")
        if len(v) > NOMBRE_MAX:
            raise ValueError(f"El nombre no puede superar los {NOMBRE_MAX} caracteres.")
        return v

    @field_validator("correo")
    @classmethod
    def _correo(cls, v: str) -> str:
        # Se normaliza a minúsculas: "Ana@x.com" y "ana@x.com" son la misma cuenta.
        v = v.strip().lower()
        if len(v) > CORREO_MAX or not _CORREO_RE.match(v):
            raise ValueError("Ingresa un correo válido (por ejemplo, nombre@correo.com).")
        return v

    @field_validator("contrasena")
    @classmethod
    def _contrasena(cls, v: str) -> str:
        return validar_contrasena(v)


class LoginIn(BaseModel):
    """HU-03 / CU-02 · Iniciar sesión (DET-37).

    Solo exige que los campos no vengan vacíos. A propósito NO aplica las reglas de RN-15 ni el
    formato del correo: un dato mal formado simplemente no coincide con ninguna cuenta y recibe el
    mismo error genérico que cualquier credencial incorrecta, sin revelar qué falló ni cómo es la
    política de contraseñas.
    """

    correo: str
    contrasena: str

    @field_validator("correo")
    @classmethod
    def _correo(cls, v: str) -> str:
        # Misma normalización que en el registro: "Ana@x.com" y "ana@x.com" son la misma cuenta.
        v = v.strip().lower()
        if not v:
            raise ValueError("Ingresa tu correo.")
        return v

    @field_validator("contrasena")
    @classmethod
    def _contrasena(cls, v: str) -> str:
        if not v:
            raise ValueError("Ingresa tu contraseña.")
        return v


class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    correo: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioOut
    
class InmuebleIn(BaseModel):
    nombre: str
    direccion: str | None = None

    @field_validator("nombre")
    @classmethod
    def _nombre(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("El nombre no puede estar vacío.")
        if len(v) > 100:
            raise ValueError("El nombre no puede superar los 100 caracteres.")
        return v

class InmuebleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    usuario_id: int
    nombre: str
    direccion: str | None = None



""" Esquemas Pydantic para la carga de lecturas de consumo (DET-54).
    Valida que el servicio sea correcto, que las fechas tengan lógica temporal
    (sin fechas futuras ni de fin anteriores al inicio) y que el consumo
    sea un número mayor o igual a cero (RN-02, RN-05, RN-03).
"""


class LecturaIn(BaseModel):
    servicio: ServicioEnum
    fecha_inicio: date
    fecha_fin: date
    consumo: float

    @field_validator("consumo")
    @classmethod
    def _consumo(cls, v: float) -> float:
        if v < 0:
            raise ValueError("El consumo no puede ser negativo.")
        return v

    @field_validator("fecha_fin")
    @classmethod
    def _fechas(cls, v: date, info) -> date:
        # Pydantic v2 permite validar contra otros campos usando info.data
        fecha_inicio = info.data.get("fecha_inicio")
        if fecha_inicio and v < fecha_inicio:
            raise ValueError("La fecha de fin no puede ser anterior a la de inicio.")
        if v > date.today():
            raise ValueError("La fecha de fin no puede ser posterior a hoy.")
        return v

class LecturaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inmueble_id: int
    servicio: ServicioEnum
    fecha_inicio: date
    fecha_fin: date
    consumo: float
    