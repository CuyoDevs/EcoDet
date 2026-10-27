import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Date, DateTime,
    ForeignKey, Enum, UniqueConstraint, CheckConstraint
)
from sqlalchemy.orm import relationship
from .database import Base


class ServicioEnum(str, enum.Enum):
    LUZ = "LUZ"
    GAS = "GAS"
    AGUA = "AGUA"


class TipoAlertaEnum(str, enum.Enum):
    ALTA = "ALTA"
    BAJA = "BAJA"


class EstadoAlertaEnum(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    CONFIRMADA = "CONFIRMADA"
    NORMAL = "NORMAL"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    correo = Column(String(255), unique=True, index=True, nullable=False)
    contrasena_hash = Column(String(255), nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)

    inmuebles = relationship("Inmueble", back_populates="usuario", cascade="all, delete-orphan")


class Inmueble(Base):
    __tablename__ = "inmuebles"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    nombre = Column(String(100), nullable=False)
    direccion = Column(String(255), nullable=True)
    es_demo = Column(Boolean, default=False, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)

    usuario = relationship("Usuario", back_populates="inmuebles")
    lecturas = relationship("Lectura", back_populates="inmueble", cascade="all, delete-orphan")
    umbrales = relationship("UmbralServicio", back_populates="inmueble", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("usuario_id", "nombre", name="uq_usuario_inmueble_nombre"),
    )


class Lectura(Base):
    __tablename__ = "lecturas"

    id = Column(Integer, primary_key=True, index=True)
    inmueble_id = Column(Integer, ForeignKey("inmuebles.id", ondelete="CASCADE"), nullable=False)
    servicio = Column(Enum(ServicioEnum), nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    consumo = Column(Float, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)

    inmueble = relationship("Inmueble", back_populates="lecturas")
    alerta = relationship("Alerta", back_populates="lectura", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("consumo >= 0", name="chk_consumo_no_negativo"),
        CheckConstraint("fecha_fin >= fecha_inicio", name="chk_fecha_valida"),
    )

    @property
    def dias_del_periodo(self) -> int:
        return (self.fecha_fin - self.fecha_inicio).days + 1

    @property
    def consumo_por_dia(self) -> float:
        dias = self.dias_del_periodo
        return self.consumo / dias if dias > 0 else 0.0


class UmbralServicio(Base):
    __tablename__ = "umbrales_servicio"

    id = Column(Integer, primary_key=True, index=True)
    inmueble_id = Column(Integer, ForeignKey("inmuebles.id", ondelete="CASCADE"), nullable=False)
    servicio = Column(Enum(ServicioEnum), nullable=False)
    desvios = Column(Float, nullable=False, default=2.0)

    inmueble = relationship("Inmueble", back_populates="umbrales")

    __table_args__ = (
        UniqueConstraint("inmueble_id", "servicio", name="uq_inmueble_servicio_umbral"),
        CheckConstraint("desvios > 0", name="chk_umbral_positivo"),
    )


class Alerta(Base):
    __tablename__ = "alertas"

    id = Column(Integer, primary_key=True, index=True)
    lectura_id = Column(Integer, ForeignKey("lecturas.id", ondelete="CASCADE"), unique=True, nullable=False)
    tipo = Column(Enum(TipoAlertaEnum), nullable=False)
    estado = Column(Enum(EstadoAlertaEnum), default=EstadoAlertaEnum.PENDIENTE, nullable=False)
    desvio_porcentual = Column(Float, nullable=False)
    consumo_por_dia = Column(Float, nullable=False)
    consumo_habitual_por_dia = Column(Float, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow, nullable=False)

    lectura = relationship("Lectura", back_populates="alerta")
