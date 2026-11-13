"""Endpoint para la carga y registro de lecturas de consumo (HU-08 / DET-16 y HU-09 / DET-17).
Permite registrar consumos individuales y en lote asociados a un inmueble validando
las reglas de negocio (RN-02, RN-03, RN-04, RN-05, RN-07, RN-14).
"""
from fastapi import APIRouter, Depends, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Lectura, Inmueble, Usuario, ServicioEnum
from ..schemas import (
    LecturaIn, LecturaOut, LecturaEdicionIn, CargaLoteIn, CargaLoteOut,
    HistorialInmuebleOut, HistorialServicioOut, LecturaHistorialOut,
    EstadisticasServicio, EvaluacionOut, LecturaCreadaOut, LecturaLoteOut,
)
from ..dependencies import get_current_user
from ..config import detector_config
from ..services.detector import evaluar_lectura, reemplazar_alerta_de_lectura

router = APIRouter(prefix="/api/consumos", tags=["consumos"])


def _datos_lectura(lectura: Lectura) -> dict:
    """Campos comunes de una lectura para las respuestas de creación."""
    return {
        "id": lectura.id,
        "inmueble_id": lectura.inmueble_id,
        "servicio": lectura.servicio,
        "fecha_inicio": lectura.fecha_inicio,
        "fecha_fin": lectura.fecha_fin,
        "consumo": lectura.consumo,
    }


def _evaluacion_out(resultado) -> EvaluacionOut:
    """Convierte el resultado del detector al esquema que expone la API."""
    return EvaluacionOut.model_validate(resultado)


@router.post("", response_model=LecturaCreadaOut, status_code=status.HTTP_201_CREATED)
def crear_lectura(
    lectura_in: LecturaIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    Registra una nueva lectura de consumo para un inmueble del usuario autenticado (DET-16).

    Después de guardarla la evalúa contra el historial del servicio (HU-12 / DET-83) y
    devuelve el resultado junto con la lectura. No crea la alerta: eso lo hará HU-13.
    """
    # 1. Verificar que el inmueble exista y pertenezca al usuario autenticado (RN-01)
    inmueble = db.query(Inmueble).filter(
        Inmueble.id == lectura_in.inmueble_id,
        Inmueble.usuario_id == usuario.id
    ).first()

    if not inmueble:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"errores": {"inmueble_id": "El inmueble no existe o no pertenece al usuario."}}
        )

    # 2. Validar superposiciÃ³n de perÃ­odos para el mismo servicio en el inmueble (RN-14)
    superposicion = db.query(Lectura).filter(
        Lectura.inmueble_id == lectura_in.inmueble_id,
        Lectura.servicio == lectura_in.servicio,
        Lectura.fecha_inicio <= lectura_in.fecha_fin,
        Lectura.fecha_fin >= lectura_in.fecha_inicio
    ).first()

    if superposicion:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"errores": {"fecha_inicio": "El perÃ­odo ingresado se superpone con otra lectura existente para este servicio."}}
        )

    # 3. Crear y guardar la nueva lectura de consumo
    nueva_lectura = Lectura(
        inmueble_id=lectura_in.inmueble_id,
        servicio=lectura_in.servicio,
        fecha_inicio=lectura_in.fecha_inicio,
        fecha_fin=lectura_in.fecha_fin,
        consumo=lectura_in.consumo
    )

    db.add(nueva_lectura)
    # Flush para que la lectura tenga id y quede visible en la consulta de la evaluación.
    db.flush()

    # 4. Evaluar contra el historial del mismo servicio (HU-12 / DET-83).
    #    El resultado se devuelve, pero no se persiste ninguna alerta: eso es de HU-13.
    resultado = evaluar_lectura(db, nueva_lectura)

    db.commit()
    db.refresh(nueva_lectura)

    return LecturaCreadaOut(
        **_datos_lectura(nueva_lectura),
        evaluacion=_evaluacion_out(resultado),
    )


@router.post("/lote", response_model=CargaLoteOut, status_code=status.HTTP_201_CREATED)
def crear_lecturas_lote(
    lote_in: CargaLoteIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    Carga masiva histórica de lecturas de consumo bajo la regla 'todo o nada' (HU-09 / DET-17).
    Si alguna fila es inválida o se superpone interna o externamente, ninguna se persiste.

    Después de guardar el lote evalúa cada fila contra las demás del servicio, incluidas
    las del propio lote (HU-12 / DET-83). No crea alertas: el resultado vuelve en la
    respuesta para que HU-13 las genere.
    """
    # 1. Verificar que el inmueble exista y pertenezca al usuario autenticado (RN-01)
    inmueble = db.query(Inmueble).filter(
        Inmueble.id == lote_in.inmueble_id,
        Inmueble.usuario_id == usuario.id
    ).first()

    if not inmueble:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"errores": {"inmueble_id": "El inmueble no existe o no pertenece al usuario."}}
        )

    # 2. Validar superposiciÃ³n INTERNA entre las filas del lote
    # Agrupamos por servicio
    filas_por_servicio = {}
    for idx, fila in enumerate(lote_in.lecturas):
        srv = fila.servicio
        if srv not in filas_por_servicio:
            filas_por_servicio[srv] = []
        filas_por_servicio[srv].append((idx, fila))

    errores_filas = {}
    for srv, lista in filas_por_servicio.items():
        # Comparar pares en la lista
        for i in range(len(lista)):
            idx_a, fila_a = lista[i]
            for j in range(i + 1, len(lista)):
                idx_b, fila_b = lista[j]
                if fila_a.fecha_inicio <= fila_b.fecha_fin and fila_a.fecha_fin >= fila_b.fecha_inicio:
                    errores_filas[f"fila_{idx_b}"] = (
                        f"La fila {idx_b + 1} se superpone con la fila {idx_a + 1} para el servicio {srv.value}."
                    )

    if errores_filas:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "mensaje": "El lote contiene perÃ­odos superpuestos internamente (todo o nada).",
                "errores": errores_filas
            }
        )

    # 3. Validar superposiciÃ³n EXTERNA contra lecturas ya guardadas en la base de datos
    for idx, fila in enumerate(lote_in.lecturas):
        superposicion = db.query(Lectura).filter(
            Lectura.inmueble_id == lote_in.inmueble_id,
            Lectura.servicio == fila.servicio,
            Lectura.fecha_inicio <= fila.fecha_fin,
            Lectura.fecha_fin >= fila.fecha_inicio
        ).first()

        if superposicion:
            errores_filas[f"fila_{idx}"] = (
                f"La fila {idx + 1} ({fila.servicio.value}: {fila.fecha_inicio} a {fila.fecha_fin}) "
                f"se superpone con una lectura ya registrada en el historial."
            )

    if errores_filas:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "mensaje": "Una o mÃ¡s lecturas del lote se superponen con el historial existente (todo o nada).",
                "errores": errores_filas
            }
        )

    # 4. Transacción atómica Todo o Nada + evaluación de cada fila (DET-83)
    nuevas_lecturas = []
    evaluaciones = []
    try:
        for fila in lote_in.lecturas:
            nueva = Lectura(
                inmueble_id=lote_in.inmueble_id,
                servicio=fila.servicio,
                fecha_inicio=fila.fecha_inicio,
                fecha_fin=fila.fecha_fin,
                consumo=fila.consumo
            )
            db.add(nueva)
            nuevas_lecturas.append(nueva)

        # Flush para que todas las filas tengan id y se vean entre sí en la evaluación:
        # cada lectura del lote se compara con las demás del servicio, incluidas las del lote.
        db.flush()
        evaluaciones = [
            (lectura, evaluar_lectura(db, lectura)) for lectura in nuevas_lecturas
        ]

        db.commit()
    except Exception as e:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"mensaje": f"Error al persistir el lote: {str(e)}"}
        )

    # Refrescar instancias guardadas y armar la respuesta con su evaluación
    lecturas_out = []
    for lectura, resultado in evaluaciones:
        db.refresh(lectura)
        lecturas_out.append(
            LecturaLoteOut(
                **_datos_lectura(lectura),
                evaluacion=_evaluacion_out(resultado),
            )
        )

    # 5. Calcular si el detector queda activo por servicio (RN-07: >= 6 lecturas en total)
    minimo_lecturas = detector_config.minimo_de_lecturas
    detector_activo = {}
    for srv in [ServicioEnum.LUZ, ServicioEnum.GAS, ServicioEnum.AGUA]:
        total_servicio = db.query(Lectura).filter(
            Lectura.inmueble_id == lote_in.inmueble_id,
            Lectura.servicio == srv
        ).count()
        detector_activo[srv.value] = total_servicio >= minimo_lecturas

    return CargaLoteOut(
        inmueble_id=lote_in.inmueble_id,
        cantidad_cargadas=len(nuevas_lecturas),
        lecturas=lecturas_out,
        detector_activo_por_servicio=detector_activo,
    )


def _buscar_lectura_del_usuario(db: Session, lectura_id: int, usuario: Usuario) -> Lectura | None:
    """Una lectura solo existe para el dueño de su inmueble (RN-01)."""
    return (
        db.query(Lectura)
        .join(Inmueble, Lectura.inmueble_id == Inmueble.id)
        .filter(Lectura.id == lectura_id, Inmueble.usuario_id == usuario.id)
        .first()
    )


def _lectura_no_encontrada() -> JSONResponse:
    # RN-01: la lectura de otro usuario responde igual que una inexistente.
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"errores": {"general": "Lectura no encontrada."}}
    )


@router.put("/{lectura_id}", response_model=LecturaOut)
def actualizar_lectura(
    lectura_id: int,
    lectura_in: LecturaEdicionIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    Edita una lectura de consumo del usuario autenticado (HU-11 / DET-73, CU-09).

    Se valida igual que al cargarla (RN-03, RN-05: 422) y no puede superponerse con otra lectura
    del mismo servicio e inmueble (RN-14: 409); la propia lectura no cuenta como superposición.
    Cambia servicio, fechas y consumo; el inmueble no se puede cambiar.
    Después de guardar se reevalúa SOLO esta lectura y su alerta anterior se reemplaza por el
    resultado nuevo (DET-75); las alertas ya generadas para las demás no se recalculan (RN-17).
    """
    lectura = _buscar_lectura_del_usuario(db, lectura_id, usuario)
    if not lectura:
        return _lectura_no_encontrada()

    # RN-14: sin superposición con OTRA lectura (por eso se excluye la propia).
    superposicion = db.query(Lectura).filter(
        Lectura.inmueble_id == lectura.inmueble_id,
        Lectura.servicio == lectura_in.servicio,
        Lectura.id != lectura.id,
        Lectura.fecha_inicio <= lectura_in.fecha_fin,
        Lectura.fecha_fin >= lectura_in.fecha_inicio
    ).first()

    if superposicion:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"errores": {"fecha_inicio": "El período ingresado se superpone con otra lectura existente para este servicio."}}
        )

    lectura.servicio = lectura_in.servicio
    lectura.fecha_inicio = lectura_in.fecha_inicio
    lectura.fecha_fin = lectura_in.fecha_fin
    lectura.consumo = lectura_in.consumo

    # La lectura cambió: se reevalúa contra su historial y la alerta anterior se reemplaza
    # por el resultado nuevo. Las alertas de las demás lecturas no se tocan (RN-17).
    reemplazar_alerta_de_lectura(db, lectura)

    db.commit()
    db.refresh(lectura)

    return lectura


@router.delete("/{lectura_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def eliminar_lectura(
    lectura_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    Elimina una lectura del usuario autenticado junto con su alerta (HU-11 / DET-74, CU-09).
    Responde 204 sin cuerpo. La confirmación ("se borra la lectura y su alerta") la pide el frontend.

    El borrado de la alerta lo hace el ORM (`cascade="all, delete-orphan"` en `Lectura.alerta`): no
    depende de que SQLite tenga activadas las claves foráneas, por eso se usa `db.delete()`.
    No toca otras lecturas ni sus alertas (RN-17), y libera el período para volver a cargarlo.
    """
    lectura = _buscar_lectura_del_usuario(db, lectura_id, usuario)
    if not lectura:
        return _lectura_no_encontrada()

    db.delete(lectura)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _calcular_estadisticas(lecturas_ord: list) -> dict | None:
    """Calcula promedio, min, max y tendencia sobre una lista de lecturas ordenadas por fecha."""
    if not lecturas_ord:
        return None
    consumos_dia = [l.consumo_por_dia for l in lecturas_ord]
    promedio = sum(consumos_dia) / len(consumos_dia)
    minimo = min(consumos_dia)
    maximo = max(consumos_dia)
    # Tendencia: comparar el consumo_por_dia del Ãºltimo perÃ­odo vs el anterior
    if len(consumos_dia) >= 2:
        diff = consumos_dia[-1] - consumos_dia[-2]
        umbral = promedio * 0.05  # 5 % de tolerancia para "estable"
        if diff > umbral:
            tendencia = "sube"
        elif diff < -umbral:
            tendencia = "baja"
        else:
            tendencia = "estable"
    else:
        tendencia = "sin_datos"
    return {"promedio": round(promedio, 4), "minimo": round(minimo, 4), "maximo": round(maximo, 4), "tendencia": tendencia}


@router.get("/{inmueble_id}/historial", response_model=HistorialInmuebleOut, status_code=status.HTTP_200_OK)
def obtener_historial(
    inmueble_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    Devuelve el historial de lecturas de un inmueble agrupado por servicio,
    con estadisticas y estado del detector (HU-10 / DET-18).
    """
    # 1. Verificar pertenencia del inmueble (RN-01)
    inmueble = db.query(Inmueble).filter(
        Inmueble.id == inmueble_id,
        Inmueble.usuario_id == usuario.id
    ).first()

    if not inmueble:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"errores": {"inmueble_id": "El inmueble no existe o no pertenece al usuario."}}
        )

    minimo_lecturas = detector_config.minimo_de_lecturas
    resultado = {"inmueble_id": inmueble_id}

    for srv in [ServicioEnum.LUZ, ServicioEnum.GAS, ServicioEnum.AGUA]:
        # Lecturas ordenadas por fecha de inicio (RN-06: ordenadas por perÃ­odo)
        lecturas_db = (
            db.query(Lectura)
            .filter(Lectura.inmueble_id == inmueble_id, Lectura.servicio == srv)
            .order_by(Lectura.fecha_inicio)
            .all()
        )

        detector_activo = len(lecturas_db) >= minimo_lecturas

        lecturas_out = [
            LecturaHistorialOut(
                id=l.id,
                servicio=l.servicio,
                fecha_inicio=l.fecha_inicio,
                fecha_fin=l.fecha_fin,
                consumo=l.consumo,
                consumo_por_dia=round(l.consumo_por_dia, 4),
                tiene_alerta=l.alerta is not None,
            )
            for l in lecturas_db
        ]

        estadisticas_raw = _calcular_estadisticas(lecturas_db)
        estadisticas = EstadisticasServicio(**estadisticas_raw) if estadisticas_raw else None

        resultado[srv.value] = HistorialServicioOut(
            detector_activo=detector_activo,
            lecturas=lecturas_out,
            estadisticas=estadisticas,
        )

    return resultado

