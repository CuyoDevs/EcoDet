"""Esquemas Pydantic V2 de la API (DET-30)."""
from datetime import date, datetime
import math
import re

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .models import EstadoAlertaEnum, ServicioEnum, TipoAlertaEnum

_CORREO_RE = re.compile(r"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}$")

NOMBRE_MAX = 100
CORREO_MAX = 255
CONTRASENA_MIN = 8
CONTRASENA_MAX_BYTES = 72


def validar_contrasena(valor: str) -> str:
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
        v = v.strip().lower()
        if len(v) > CORREO_MAX or not _CORREO_RE.match(v):
            raise ValueError("Ingresa un correo válido (por ejemplo, nombre@correo.com).")
        return v

    @field_validator("contrasena")
    @classmethod
    def _contrasena(cls, v: str) -> str:
        return validar_contrasena(v)


class LoginIn(BaseModel):
    correo: str
    contrasena: str

    @field_validator("correo")
    @classmethod
    def _correo(cls, v: str) -> str:
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
    es_demo: bool = False
    alertas_pendientes: int = 0


class LecturaIn(BaseModel):
    inmueble_id: int
    servicio: ServicioEnum
    fecha_inicio: date
    fecha_fin: date
    consumo: float

    @field_validator('consumo')
    @classmethod
    def _consumo(cls, v: float) -> float:
        if v < 0:
            raise ValueError('El consumo no puede ser negativo.')
        return v

    @field_validator('fecha_inicio')
    @classmethod
    def _fecha_inicio(cls, v: date) -> date:
        if v > date.today():
            raise ValueError('La fecha de inicio no puede ser posterior a hoy.')
        return v

    @field_validator('fecha_fin')
    @classmethod
    def _fecha_fin(cls, v: date, info) -> date:
        fecha_inicio = info.data.get('fecha_inicio')
        if fecha_inicio and v < fecha_inicio:
            raise ValueError('La fecha de fin no puede ser anterior a la de inicio.')
        if v > date.today():
            raise ValueError('La fecha de fin no puede ser posterior a hoy.')
        return v


class LecturaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inmueble_id: int
    servicio: ServicioEnum
    fecha_inicio: date
    fecha_fin: date
    consumo: float


class AlertaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lectura_id: int
    tipo: TipoAlertaEnum
    estado: EstadoAlertaEnum
    desvio_porcentual: float
    consumo_por_dia: float
    consumo_habitual_por_dia: float
    fecha_creacion: datetime


class AlertaDetalleOut(AlertaOut):
    """Alerta enriquecida con servicio y período de su lectura (HU-15 / DET-96)."""

    inmueble_id: int
    servicio: ServicioEnum
    fecha_inicio: date
    fecha_fin: date
    consumo: float


class EvaluacionOut(BaseModel):
    """Resultado del detector para una lectura (HU-12 y HU-13 / DET-87)."""

    model_config = ConfigDict(from_attributes=True)

    estado: str
    motivo: str | None = None
    consumo_por_dia: float
    umbral: float
    promedio: float | None = None
    desvio_efectivo: float | None = None
    limite_inferior: float | None = None
    limite_superior: float | None = None
    cantidad_referencia: int = 0
    referencia_estacional: bool = False
    lecturas_registradas: int = 0
    lecturas_faltantes: int = 0
    desvio_porcentual: float | None = None
    mensaje: str | None = None
    alerta_generada: bool = False


class LecturaCreadaOut(LecturaOut):
    evaluacion: EvaluacionOut
    alerta: AlertaOut | None = None


class LecturaFilaIn(BaseModel):
    servicio: ServicioEnum
    fecha_inicio: date
    fecha_fin: date
    consumo: float

    @field_validator('consumo')
    @classmethod
    def _consumo(cls, v: float) -> float:
        if v < 0:
            raise ValueError('El consumo no puede ser negativo.')
        return v

    @field_validator('fecha_inicio')
    @classmethod
    def _fecha_inicio(cls, v: date) -> date:
        if v > date.today():
            raise ValueError('La fecha de inicio no puede ser posterior a hoy.')
        return v

    @field_validator('fecha_fin')
    @classmethod
    def _fecha_fin(cls, v: date, info) -> date:
        fecha_inicio = info.data.get('fecha_inicio')
        if fecha_inicio and v < fecha_inicio:
            raise ValueError('La fecha de fin no puede ser anterior a la de inicio.')
        if v > date.today():
            raise ValueError('La fecha de fin no puede ser posterior a hoy.')
        return v


class LecturaEdicionIn(LecturaFilaIn):
    pass


class LecturaLoteOut(LecturaOut):
    evaluacion: EvaluacionOut
    alerta: AlertaOut | None = None


class CargaLoteIn(BaseModel):
    inmueble_id: int
    lecturas: list[LecturaFilaIn]

    @field_validator('lecturas')
    @classmethod
    def _lecturas(cls, v: list[LecturaFilaIn]) -> list[LecturaFilaIn]:
        if not v:
            raise ValueError('Debe incluir al menos una lectura en el lote.')
        return v


class CargaLoteOut(BaseModel):
    inmueble_id: int
    cantidad_cargadas: int
    lecturas: list[LecturaLoteOut]
    detector_activo_por_servicio: dict[str, bool]
    lecturas_faltantes_por_servicio: dict[str, int] = Field(default_factory=dict)


class LecturaHistorialOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    servicio: ServicioEnum
    fecha_inicio: date
    fecha_fin: date
    consumo: float
    consumo_por_dia: float
    tiene_alerta: bool


class EstadisticasServicio(BaseModel):
    promedio: float
    minimo: float
    maximo: float
    tendencia: str


class FranjaHabitualOut(BaseModel):
    promedio: float
    umbral: float
    limite_inferior: float
    limite_superior: float


class HistorialServicioOut(BaseModel):
    detector_activo: bool
    lecturas_faltantes: int = 0
    lecturas: list[LecturaHistorialOut]
    estadisticas: EstadisticasServicio | None
    franja_habitual: FranjaHabitualOut | None = None


class HistorialInmuebleOut(BaseModel):
    inmueble_id: int
    LUZ: HistorialServicioOut
    GAS: HistorialServicioOut
    AGUA: HistorialServicioOut


class UmbralIn(BaseModel):
    """Cuerpo del PUT de umbral (HU-18): un número finito mayor que cero."""

    desvios: float

    @field_validator("desvios", mode="before")
    @classmethod
    def _desvios(cls, v):
        mensaje = "El umbral debe ser un número mayor que cero."
        if isinstance(v, bool):
            raise ValueError(mensaje)
        try:
            numero = float(v)
        except (TypeError, ValueError):
            raise ValueError(mensaje) from None
        if not math.isfinite(numero) or numero <= 0:
            raise ValueError(mensaje)
        return numero


class UmbralOut(BaseModel):
    servicio: ServicioEnum
    desvios: float
    personalizado: bool
