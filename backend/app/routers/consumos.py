"""Endpoint para la carga y registro de lecturas de consumo (HU-08 / DET-16 y HU-09 / DET-17).
Permite registrar consumos individuales y en lote asociados a un inmueble validando
las reglas de negocio (RN-02, RN-03, RN-04, RN-05, RN-07, RN-14).
"""
from fastapi import APIRouter, Depends, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Lectura, Inmueble, Usuario, ServicioEnum, Alerta
from ..schemas import (
    LecturaIn, LecturaOut, LecturaEdicionIn, CargaLoteIn, CargaLoteOut,
    HistorialInmuebleOut, HistorialServicioOut, LecturaHistorialOut,
    EstadisticasServicio, EvaluacionOut, LecturaCreadaOut, LecturaLoteOut,
    AlertaOut,
)
from ..dependencies import get_current_user
from ..config import detector_config
from ..services.detector import (
    evaluar_lectura,
    lecturas_faltantes_para_activar,
    reemplazar_alerta_de_lectura,
    alerta_desde_resultado,
    EstadoEvaluacion,
    ResultadoEvaluacion,
)

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


def _evaluacion_out(resultado: ResultadoEvaluacion) -> EvaluacionOut:
    """Convierte el resultado del detector al esquema que expone la API (HU-12, HU-13 / DET-87)."""
    desvio = None
    mensaje = None
    alerta_generada = False

    if resultado.promedio and resultado.promedio > 0:
        desvio = round(((resultado.consumo_por_dia - resultado.promedio) / resultado.promedio) * 100, 2)

    if resultado.estado == EstadoEvaluacion.ALTA:
        alerta_generada = True
        pct = abs(desvio) if desvio is not None else 0.0
        mensaje = f"Consumo alto detectado: un {pct:.1f}% superior a lo habitual para este servicio."
    elif resultado.estado == EstadoEvaluacion.BAJA:
        alerta_generada = True
        pct = abs(desvio) if desvio is not None else 0.0
        mensaje = f"Consumo bajo inusual detectado: un {pct:.1f}% inferior a lo habitual para este servicio."
    elif resultado.estado == EstadoEvaluacion.DENTRO:
        mensaje = "Consumo dentro de los parámetros habituales."
    elif resultado.estado == EstadoEvaluacion.APRENDIENDO:
        mensaje = "El detector continúa aprendiendo los patrones de consumo."

    return EvaluacionOut(
        estado=resultado.estado.value if hasattr(resultado.estado, "value") else str(resultado.estado),
        consumo_por_dia=resultado.consumo_por_dia,
        umbral=resultado.umbral,
        motivo=resultado.motivo,
        promedio=resultado.promedio,
        desvio_efectivo=resultado.desvio_efectivo,
        limite_inferior=resultado.limite_inferior,
        limite_superior=resultado.limite_superior,
        cantidad_referencia=resultado.cantidad_referencia,
        referencia_estacional=resultado.referencia_estacional,
        desvio_porcentual=desvio,
        mensaje=mensaje,
        alerta_generada=alerta_generada,
        lecturas_registradas=getattr(resultado, "lecturas_registradas", 0),
        lecturas_faltantes=getattr(resultado, "lecturas_faltantes", 0),
    )


@router.post("", response_model=LecturaCreadaOut, status_code=status.HTTP_201_CREATED)
def crear_lectura(
    lectura_in: LecturaIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    Registra una nueva lectura de consumo para un inmueble del usuario autenticado (DET-16).

    Después de guardarla la evalúa contra el historial del servicio (HU-12 / DET-83) y
    si detecta anomalía (alta o baja), genera y persiste la alerta en estado PENDIENTE (HU-13 / DET-86, DET-87).
    """
    inmueble = db.query(Inmueble).filter(
        Inmueble.id == lectura_in.inmueble_id,
        Inmueble.usuario_id == usuario.id
    ).first()

    if not inmueble:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"errores": {"inmueble_id": "El inmueble no existe o no pertenece al usuario."}}
        )

    superposicion = db.query(Lectura).filter(
        Lectura.inmueble_id == lectura_in.inmueble_id,
        Lectura.servicio == lectura_in.servicio,
        Lectura.fecha_inicio <= lectura_in.fecha_fin,
        Lectura.fecha_fin >= lectura_in.fecha_inicio
    ).first()

    if superposicion:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"errores": {"fecha_inicio": "El período ingresado se superpone con otra lectura existente para este servicio."}}
        )

    nueva_lectura = Lectura(
        inmueble_id=lectura_in.inmueble_id,
        servicio=lectura_in.servicio,
        fecha_inicio=lectura_in.fecha_inicio,
        fecha_fin=lectura_in.fecha_fin,
        consumo=lectura_in.consumo
    )

    db.add(nueva_lectura)
    db.flush()

    resultado = evaluar_lectura(db, nueva_lectura)
    alerta = None
    if resultado.estado in (EstadoEvaluacion.ALTA, EstadoEvaluacion.BAJA):
        alerta = alerta_desde_resultado(nueva_lectura, resultado)
        if alerta:
            db.add(alerta)

    db.commit()
    db.refresh(nueva_lectura)
    if alerta:
        db.refresh(alerta)

    return LecturaCreadaOut(
        **_datos_lectura(nueva_lectura),
        evaluacion=_evaluacion_out(resultado),
        alerta=AlertaOut.model_validate(alerta) if alerta else None,
    )


@router.post("/lote", response_model=CargaLoteOut, status_code=status.HTTP_201_CREATED)
def crear_lecturas_lote(
    lote_in: CargaLoteIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """Carga masiva histórica de lecturas de consumo bajo la regla 'todo o nada' (HU-09 / DET-17)."""
    inmueble = db.query(Inmueble).filter(
        Inmueble.id == lote_in.inmueble_id,
        Inmueble.usuario_id == usuario.id
    ).first()

    if not inmueble:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"errores": {"inmueble_id": "El inmueble no existe o no pertenece al usuario."}}
        )

    filas_por_servicio = {}
    for idx, fila in enumerate(lote_in.lecturas):
        srv = fila.servicio
        if srv not in filas_por_servicio:
            filas_por_servicio[srv] = []
        filas_por_servicio[srv].append((idx, fila))

    errores_filas = {}
    for srv, lista in filas_por_servicio.items():
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
                "mensaje": "El lote contiene períodos superpuestos internamente (todo o nada).",
                "errores": errores_filas
            }
        )

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
                "mensaje": "Una o más lecturas del lote se superponen con el historial existente (todo o nada).",
                "errores": errores_filas
            }
        )

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

        db.flush()
        evaluaciones = []
        for lectura in nuevas_lecturas:
            res = evaluar_lectura(db, lectura)
            alerta = None
            if res.estado in (EstadoEvaluacion.ALTA, EstadoEvaluacion.BAJA):
                alerta = alerta_desde_resultado(lectura, res)
                if alerta:
                    db.add(alerta)
            evaluaciones.append((lectura, res, alerta))

        db.commit()
    except Exception as e:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"mensaje": f"Error al persistir el lote: {str(e)}"}
        )

    lecturas_out = []
    for lectura, resultado, alerta in evaluaciones:
        db.refresh(lectura)
        if alerta:
            db.refresh(alerta)
        lecturas_out.append(
            LecturaLoteOut(
                **_datos_lectura(lectura),
                evaluacion=_evaluacion_out(resultado),
                alerta=AlertaOut.model_validate(alerta) if alerta else None,
            )
        )

    minimo_lecturas = detector_config.minimo_de_lecturas
    detector_activo = {}
    lecturas_faltantes = {}
    for srv in [ServicioEnum.LUZ, ServicioEnum.GAS, ServicioEnum.AGUA]:
        total_servicio = db.query(Lectura).filter(
            Lectura.inmueble_id == lote_in.inmueble_id,
            Lectura.servicio == srv
        ).count()
        detector_activo[srv.value] = total_servicio >= minimo_lecturas
        lecturas_faltantes[srv.value] = lecturas_faltantes_para_activar(total_servicio)

    return CargaLoteOut(
        inmueble_id=lote_in.inmueble_id,
        cantidad_cargadas=len(nuevas_lecturas),
        lecturas=lecturas_out,
        detector_activo_por_servicio=detector_activo,
        lecturas_faltantes_por_servicio=lecturas_faltantes,
    )


def _buscar_lectura_del_usuario(db: Session, lectura_id: int, usuario: Usuario) -> Lectura | None:
    return (
        db.query(Lectura)
        .join(Inmueble, Lectura.inmueble_id == Inmueble.id)
        .filter(Lectura.id == lectura_id, Inmueble.usuario_id == usuario.id)
        .first()
    )


def _lectura_no_encontrada() -> JSONResponse:
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
    lectura = _buscar_lectura_del_usuario(db, lectura_id, usuario)
    if not lectura:
        return _lectura_no_encontrada()

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
    lectura = _buscar_lectura_del_usuario(db, lectura_id, usuario)
    if not lectura:
        return _lectura_no_encontrada()

    db.delete(lectura)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _calcular_estadisticas(lecturas_ord: list) -> dict | None:
    if not lecturas_ord:
        return None
    consumos_dia = [l.consumo_por_dia for l in lecturas_ord]
    promedio = sum(consumos_dia) / len(consumos_dia)
    minimo = min(consumos_dia)
    maximo = max(consumos_dia)
    if len(consumos_dia) >= 2:
        diff = consumos_dia[-1] - consumos_dia[-2]
        umbral = promedio * 0.05
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
            lecturas_faltantes=lecturas_faltantes_para_activar(len(lecturas_db)),
            lecturas=lecturas_out,
            estadisticas=estadisticas,
        )

    return resultado