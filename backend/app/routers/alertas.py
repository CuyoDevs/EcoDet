"""Endpoints de alertas de consumo: consulta y detalle (HU-15 / DET-23, DET-96) y marcado como normal (HU-16 / DET-100)."""
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..dependencies import get_current_user
from ..models import (
    Alerta,
    EstadoAlertaEnum,
    Inmueble,
    Lectura,
    ServicioEnum,
    Usuario,
)
from ..schemas import AlertaDetalleOut

router = APIRouter(tags=["alertas"])


def _serializar_alerta(alerta: Alerta) -> AlertaDetalleOut:
    lectura = alerta.lectura
    return AlertaDetalleOut(
        id=alerta.id,
        lectura_id=alerta.lectura_id,
        inmueble_id=lectura.inmueble_id,
        servicio=lectura.servicio,
        fecha_inicio=lectura.fecha_inicio,
        fecha_fin=lectura.fecha_fin,
        consumo=lectura.consumo,
        tipo=alerta.tipo,
        estado=alerta.estado,
        desvio_porcentual=alerta.desvio_porcentual,
        consumo_por_dia=alerta.consumo_por_dia,
        consumo_habitual_por_dia=alerta.consumo_habitual_por_dia,
        fecha_creacion=alerta.fecha_creacion,
    )


def _buscar_alerta_del_usuario(db: Session, alerta_id: int, usuario: Usuario) -> Alerta | None:
    return (
        db.query(Alerta)
        .options(joinedload(Alerta.lectura))
        .join(Lectura, Alerta.lectura_id == Lectura.id)
        .join(Inmueble, Lectura.inmueble_id == Inmueble.id)
        .filter(Alerta.id == alerta_id, Inmueble.usuario_id == usuario.id)
        .first()
    )


def _alerta_no_encontrada() -> JSONResponse:
    """RN-01: una alerta ajena responde igual que una inexistente."""
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"errores": {"general": "Alerta no encontrada."}},
    )


@router.get("/api/inmuebles/{inmueble_id}/alertas", response_model=list[AlertaDetalleOut])
def listar_alertas_inmueble(
    inmueble_id: int,
    estado: EstadoAlertaEnum | None = None,
    servicio: ServicioEnum | None = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """Lista las alertas de un inmueble del usuario autenticado con filtros opcionales (DET-96)."""
    inmueble = (
        db.query(Inmueble)
        .filter(Inmueble.id == inmueble_id, Inmueble.usuario_id == usuario.id)
        .first()
    )
    if not inmueble:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"errores": {"general": "Inmueble no encontrado."}},
        )

    query = (
        db.query(Alerta)
        .options(joinedload(Alerta.lectura))
        .join(Lectura, Alerta.lectura_id == Lectura.id)
        .filter(Lectura.inmueble_id == inmueble_id)
    )

    if estado is not None:
        query = query.filter(Alerta.estado == estado)
    if servicio is not None:
        query = query.filter(Lectura.servicio == servicio)

    alertas = query.order_by(Lectura.fecha_fin.desc(), Alerta.id.desc()).all()
    return [_serializar_alerta(a) for a in alertas]


@router.get("/api/alertas/{alerta_id}", response_model=AlertaDetalleOut)
def obtener_detalle_alerta(
    alerta_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """Obtiene el detalle de una alerta verificando que pertenezca al usuario (RN-01)."""
    alerta = _buscar_alerta_del_usuario(db, alerta_id, usuario)
    if not alerta:
        return _alerta_no_encontrada()
    return _serializar_alerta(alerta)


@router.patch("/api/alertas/{alerta_id}/normal", response_model=AlertaDetalleOut)
def marcar_alerta_normal(
    alerta_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """Marca como "normal" una alerta pendiente del usuario autenticado (HU-16 / DET-100, RN-13).

    Solo cambia el estado de esta alerta. A partir de ahora el detector deja su lectura fuera de
    la referencia de las evaluaciones nuevas (RN-11, ver `detector._integran_referencia`), y las
    alertas que ya existen para otras lecturas no se recalculan (RN-17).
    """
    alerta = _buscar_alerta_del_usuario(db, alerta_id, usuario)
    if not alerta:
        return _alerta_no_encontrada()

    # RN-13: la alerta nace Pendiente y de ahí pasa a Confirmada o Normal; no se vuelve a decidir.
    if alerta.estado != EstadoAlertaEnum.PENDIENTE:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"errores": {"general": "Solo se puede marcar como normal una alerta pendiente."}},
        )

    alerta.estado = EstadoAlertaEnum.NORMAL
    db.commit()
    db.refresh(alerta)
    return _serializar_alerta(alerta)
