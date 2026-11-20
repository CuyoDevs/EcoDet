"""Endpoints de alertas de consumo: consulta y detalle (HU-15 / DET-23, DET-96), marcado como normal (HU-16 / DET-100)
y confirmación (HU-17 / DET-25)."""
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


def _decidir_alerta_pendiente(
    db: Session,
    alerta_id: int,
    usuario: Usuario,
    nuevo_estado: EstadoAlertaEnum,
    mensaje_conflicto: str,
):
    """RN-13: una alerta nace Pendiente y de ahí pasa a Confirmada o a Normal; después no se vuelve a decidir.

    Solo cambia el estado de esa alerta (RN-17: no se recalcula ninguna otra) y solo si es del usuario (RN-01).
    """
    alerta = _buscar_alerta_del_usuario(db, alerta_id, usuario)
    if not alerta:
        return _alerta_no_encontrada()

    if alerta.estado != EstadoAlertaEnum.PENDIENTE:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"errores": {"general": mensaje_conflicto}},
        )

    alerta.estado = nuevo_estado
    db.commit()
    db.refresh(alerta)
    return _serializar_alerta(alerta)


@router.patch("/api/alertas/{alerta_id}/normal", response_model=AlertaDetalleOut)
def marcar_alerta_normal(
    alerta_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """Marca como "normal" una alerta pendiente del usuario autenticado (HU-16 / DET-100, RN-13).

    A partir de ahora el detector deja su lectura fuera de la referencia de las evaluaciones nuevas
    (RN-11, ver `detector._integran_referencia`); las alertas ya generadas no se recalculan (RN-17).
    """
    return _decidir_alerta_pendiente(
        db,
        alerta_id,
        usuario,
        EstadoAlertaEnum.NORMAL,
        "Solo se puede marcar como normal una alerta pendiente.",
    )


@router.patch("/api/alertas/{alerta_id}/confirmar", response_model=AlertaDetalleOut)
def confirmar_alerta(
    alerta_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """Confirma una alerta pendiente del usuario autenticado: sí era un consumo anormal (HU-17 / DET-25, RN-13).

    Confirmar no cambia el cálculo del detector: solo las lecturas marcadas "normal" salen de la referencia,
    así que una lectura confirmada sigue integrándola en las detecciones siguientes.
    """
    return _decidir_alerta_pendiente(
        db,
        alerta_id,
        usuario,
        EstadoAlertaEnum.CONFIRMADA,
        "Solo se puede confirmar una alerta pendiente.",
    )