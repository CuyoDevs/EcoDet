from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse, Response
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Inmueble, Usuario, Lectura, Alerta, EstadoAlertaEnum
from ..schemas import InmuebleIn, InmuebleOut
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/inmuebles", tags=["inmuebles"])


@router.get("/", response_model=list[InmuebleOut])
def listar_inmuebles(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """Devuelve solo los inmuebles del usuario autenticado (RN-01) con su conteo de alertas pendientes (DET-91)."""
    inmuebles = (
        db.query(Inmueble)
        .filter(Inmueble.usuario_id == usuario.id)
        .order_by(Inmueble.id)
        .all()
    )
    if not inmuebles:
        return []

    inmueble_ids = [i.id for i in inmuebles]
    conteos_raw = (
        db.query(Lectura.inmueble_id, func.count(Alerta.id))
        .join(Alerta, Alerta.lectura_id == Lectura.id)
        .filter(
            Lectura.inmueble_id.in_(inmueble_ids),
            Alerta.estado == EstadoAlertaEnum.PENDIENTE,
        )
        .group_by(Lectura.inmueble_id)
        .all()
    )
    conteos_por_inmueble = dict(conteos_raw)

    return [
        InmuebleOut(
            id=inmueble.id,
            usuario_id=inmueble.usuario_id,
            nombre=inmueble.nombre,
            direccion=inmueble.direccion,
            es_demo=inmueble.es_demo,
            alertas_pendientes=conteos_por_inmueble.get(inmueble.id, 0),
        )
        for inmueble in inmuebles
    ]


@router.post("/", response_model=InmuebleOut, status_code=status.HTTP_201_CREATED)
def crear_inmueble(
    inmueble_in: InmuebleIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    Crea un nuevo inmueble asociado al usuario autenticado.
    """
    existente = db.query(Inmueble).filter(
        Inmueble.usuario_id == usuario.id,
        Inmueble.nombre == inmueble_in.nombre
    ).first()

    if existente:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"errores": {"nombre": "Ya tienes un inmueble con este nombre."}}
        )

    nuevo_inmueble = Inmueble(
        usuario_id=usuario.id,
        nombre=inmueble_in.nombre,
        direccion=inmueble_in.direccion
    )
    
    db.add(nuevo_inmueble)
    db.commit()
    db.refresh(nuevo_inmueble)

    return nuevo_inmueble


@router.put("/{inmueble_id}", response_model=InmuebleOut)
def actualizar_inmueble(
    inmueble_id: int,
    inmueble_in: InmuebleIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    Actualiza los datos de un inmueble existente perteneciente al usuario autenticado.
    """
    inmueble = db.query(Inmueble).filter(
        Inmueble.id == inmueble_id,
        Inmueble.usuario_id == usuario.id
    ).first()

    if not inmueble:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"errores": {"general": "Inmueble no encontrado."}}
        )

    existente = db.query(Inmueble).filter(
        Inmueble.usuario_id == usuario.id,
        Inmueble.nombre == inmueble_in.nombre,
        Inmueble.id != inmueble_id
    ).first()

    if existente:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"errores": {"nombre": "Ya tienes otro inmueble con este nombre."}}
        )

    inmueble.nombre = inmueble_in.nombre
    inmueble.direccion = inmueble_in.direccion

    db.commit()
    db.refresh(inmueble)

    # Calculamos de forma dinámica y segura el número real de alertas pendientes para este inmueble
    conteo_alertas = (
        db.query(func.count(Alerta.id))
        .join(Lectura, Alerta.lectura_id == Lectura.id)
        .filter(
            Lectura.inmueble_id == inmueble.id,
            Alerta.estado == EstadoAlertaEnum.PENDIENTE,
        )
        .scalar()
    ) or 0

    setattr(inmueble, "alertas_pendientes", conteo_alertas)

    return inmueble


@router.delete("/{inmueble_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def eliminar_inmueble(
    inmueble_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    Elimina un inmueble del usuario autenticado junto con todos sus datos asociados.
    """
    inmueble = db.query(Inmueble).filter(
        Inmueble.id == inmueble_id,
        Inmueble.usuario_id == usuario.id
    ).first()

    if not inmueble:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"errores": {"general": "Inmueble no encontrado."}}
        )

    db.delete(inmueble)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)