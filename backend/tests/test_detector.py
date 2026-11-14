"""Pruebas de HU-12 · Evaluar cada lectura contra mi historial (CU-06, RN-06 a RN-12).

Cubren el motor estadístico (DET-79 a DET-82) y su conexión con la carga individual y en
lote (DET-83). Incluyen el caso de prueba del documento: promedio 20, desvío 3 y umbral 2
dan límites 14 y 26.
"""
from datetime import date

import pytest

from backend.app.models import (
    Alerta,
    EstadoAlertaEnum,
    Inmueble,
    Lectura,
    ServicioEnum,
    TipoAlertaEnum,
    UmbralServicio,
    Usuario,
)
from backend.app.services.detector import (
    EstadoEvaluacion,
    calcular_limites,
    clasificar,
    consumo_por_dia,
    estacion_de,
    evaluar_lectura,
    punto_medio,
    umbral_vigente,
)

CONSUMOS = "/api/consumos"


# ---------- ayudas para pruebas contra la base ----------
def _inmueble(db, correo="detector@test.com"):
    usuario = Usuario(nombre="Test", correo=correo, contrasena_hash="x")
    db.add(usuario)
    db.flush()
    inmueble = Inmueble(usuario_id=usuario.id, nombre="Casa")
    db.add(inmueble)
    db.flush()
    return inmueble


def _lectura(db, inmueble, inicio, fin, consumo, servicio=ServicioEnum.LUZ):
    lectura = Lectura(
        inmueble_id=inmueble.id,
        servicio=servicio,
        fecha_inicio=inicio,
        fecha_fin=fin,
        consumo=consumo,
    )
    db.add(lectura)
    db.flush()
    return lectura


def _marcar_normal(db, lectura):
    db.add(Alerta(
        lectura_id=lectura.id,
        tipo=TipoAlertaEnum.ALTA,
        estado=EstadoAlertaEnum.NORMAL,
        desvio_porcentual=0.0,
        consumo_por_dia=lectura.consumo_por_dia,
        consumo_habitual_por_dia=lectura.consumo_por_dia,
    ))
    db.flush()


# ======================================================================
# DET-80 · Consumo por día, estación y punto medio (funciones puras)
# ======================================================================
@pytest.mark.parametrize("consumo,inicio,fin,esperado", [
    (310.0, date(2025, 1, 1), date(2025, 1, 31), 10.0),   # enero: 31 días
    (280.0, date(2025, 2, 1), date(2025, 2, 28), 10.0),   # febrero: 28 días
    (31.0, date(2025, 3, 1), date(2025, 3, 31), 1.0),     # marzo: 31 días
    (5.0, date(2025, 4, 10), date(2025, 4, 10), 5.0),     # un solo día
    (0.0, date(2025, 5, 1), date(2025, 5, 31), 0.0),      # el 0 es válido
], ids=["enero", "febrero", "marzo", "un_dia", "consumo_cero"])
def test_consumo_por_dia_cuenta_ambos_extremos_del_periodo(consumo, inicio, fin, esperado):
    """RN-06: se divide por los días del período, contando el día final."""
    assert consumo_por_dia(consumo, inicio, fin) == pytest.approx(esperado)


@pytest.mark.parametrize("mes,estacion", [
    (1, "VERANO"), (2, "VERANO"), (12, "VERANO"),
    (3, "OTOÑO"), (4, "OTOÑO"), (5, "OTOÑO"),
    (6, "INVIERNO"), (7, "INVIERNO"), (8, "INVIERNO"),
    (9, "PRIMAVERA"), (10, "PRIMAVERA"), (11, "PRIMAVERA"),
])
def test_estacion_de_asigna_el_hemisferio_sur(mes, estacion):
    assert estacion_de(date(2025, mes, 15)) == estacion


@pytest.mark.parametrize("inicio,fin,esperado", [
    (date(2025, 1, 1), date(2025, 1, 31), date(2025, 1, 16)),   # 31 días: centro exacto
    (date(2025, 1, 1), date(2025, 1, 2), date(2025, 1, 1)),     # 2 días: se toma el anterior
    (date(2025, 1, 31), date(2025, 2, 1), date(2025, 1, 31)),   # cruza de mes
    (date(2025, 12, 1), date(2025, 12, 31), date(2025, 12, 16)),
], ids=["mes_completo", "dos_dias", "cruce_de_mes", "diciembre"])
def test_punto_medio_del_periodo(inicio, fin, esperado):
    """La estación se asigna por el punto medio, no por el inicio ni por el fin."""
    assert punto_medio(inicio, fin) == esperado


def test_estacion_por_punto_medio_cruza_el_cambio_de_estacion():
    """31/1 a 1/2 tiene punto medio 31/1, así que cuenta como verano."""
    assert estacion_de(punto_medio(date(2025, 1, 31), date(2025, 2, 1))) == "VERANO"


# ======================================================================
# DET-82 · Límites y clasificación
# ======================================================================
def test_caso_del_documento_promedio_20_desvio_3_umbral_2_da_14_y_26():
    """Caso de prueba de HU-12: 17, 17, 20, 23 y 23 tienen media 20 y desvío muestral 3."""
    promedio, desvio, inferior, superior = calcular_limites([17, 17, 20, 23, 23], 2.0)

    assert promedio == pytest.approx(20)
    assert desvio == pytest.approx(3)
    assert inferior == pytest.approx(14)
    assert superior == pytest.approx(26)


@pytest.mark.parametrize("consumo,esperado", [
    (14.0, EstadoEvaluacion.DENTRO),    # el límite inferior está incluido
    (20.0, EstadoEvaluacion.DENTRO),
    (26.0, EstadoEvaluacion.DENTRO),    # el límite superior está incluido
    (13.99, EstadoEvaluacion.BAJA),
    (26.01, EstadoEvaluacion.ALTA),
])
def test_clasificar_usa_los_limites_inclusivos(consumo, esperado):
    assert clasificar(consumo, 14.0, 26.0) is esperado


def test_piso_del_diez_por_ciento_cuando_el_desvio_es_cero():
    """RN-12: con un historial idéntico el desvío efectivo no es 0, es el 10 % del promedio."""
    promedio, desvio, inferior, superior = calcular_limites([100, 100, 100, 100, 100], 2.0)

    assert promedio == pytest.approx(100)
    assert desvio == pytest.approx(10)
    assert inferior == pytest.approx(80)
    assert superior == pytest.approx(120)


def test_piso_del_diez_por_ciento_tapa_un_desvio_muy_pequeno():
    """Con 99, 100, 100, 100 y 101 el desvío real (0,71) es menor que el piso (10)."""
    _, desvio, _, _ = calcular_limites([99, 100, 100, 100, 101], 2.0)

    assert desvio == pytest.approx(10)


# ======================================================================
# DET-79 · Umbral vigente por inmueble y servicio
# ======================================================================
def test_umbral_vigente_es_el_inicial_y_luego_el_del_inmueble(db):
    inmueble = _inmueble(db)

    assert umbral_vigente(db, inmueble.id, ServicioEnum.LUZ) == pytest.approx(2.0)

    db.add(UmbralServicio(inmueble_id=inmueble.id, servicio=ServicioEnum.LUZ, desvios=3.5))
    db.flush()

    assert umbral_vigente(db, inmueble.id, ServicioEnum.LUZ) == pytest.approx(3.5)
    # El umbral es por servicio: gas sigue con el valor inicial.
    assert umbral_vigente(db, inmueble.id, ServicioEnum.GAS) == pytest.approx(2.0)


# ======================================================================
# DET-81 / DET-82 · Evaluación contra la referencia
# ======================================================================
def test_con_menos_de_seis_lecturas_el_detector_esta_aprendiendo(db):
    inmueble = _inmueble(db)
    lecturas = [
        _lectura(db, inmueble, date(2025, 1, dia), date(2025, 1, dia), consumo)
        for dia, consumo in enumerate([17, 17, 20, 23, 23], start=1)
    ]

    resultado = evaluar_lectura(db, lecturas[-1])

    assert resultado.estado is EstadoEvaluacion.APRENDIENDO
    assert resultado.motivo == "lecturas_insuficientes"
    assert resultado.promedio is None and resultado.limite_inferior is None


def test_la_lectura_evaluada_no_integra_su_propia_referencia(db):
    inmueble = _inmueble(db)
    for dia, consumo in enumerate([17, 17, 20, 23, 23], start=1):
        _lectura(db, inmueble, date(2025, 1, dia), date(2025, 1, dia), consumo)
    evaluada = _lectura(db, inmueble, date(2025, 1, 6), date(2025, 1, 6), 1000)

    resultado = evaluar_lectura(db, evaluada)

    # La referencia son las otras cinco: si la evaluada entrara, el promedio se dispararía.
    assert resultado.cantidad_referencia == 5
    assert resultado.promedio == pytest.approx(20)
    assert resultado.estado is EstadoEvaluacion.ALTA


@pytest.mark.parametrize("consumo,esperado", [
    (20.0, EstadoEvaluacion.DENTRO),
    (27.0, EstadoEvaluacion.ALTA),
    (13.0, EstadoEvaluacion.BAJA),
], ids=["dentro", "alta", "baja"])
def test_evaluacion_aplica_el_caso_del_documento(db, consumo, esperado):
    inmueble = _inmueble(db)
    for dia, valor in enumerate([17, 17, 20, 23, 23], start=1):
        _lectura(db, inmueble, date(2025, 1, dia), date(2025, 1, dia), valor)
    evaluada = _lectura(db, inmueble, date(2025, 1, 6), date(2025, 1, 6), consumo)

    resultado = evaluar_lectura(db, evaluada)

    assert resultado.estado is esperado
    assert resultado.promedio == pytest.approx(20)
    assert resultado.desvio_efectivo == pytest.approx(3)
    assert resultado.limite_inferior == pytest.approx(14)
    assert resultado.limite_superior == pytest.approx(26)
    assert resultado.cantidad_referencia == 5
    assert resultado.referencia_estacional is True


def test_las_lecturas_marcadas_normal_quedan_fuera_de_la_referencia(db):
    inmueble = _inmueble(db)
    for dia, consumo in enumerate([17, 17, 20, 23, 23], start=1):
        _lectura(db, inmueble, date(2025, 1, dia), date(2025, 1, dia), consumo)
    fuera = _lectura(db, inmueble, date(2025, 1, 6), date(2025, 1, 6), 1000)
    _marcar_normal(db, fuera)
    evaluada = _lectura(db, inmueble, date(2025, 1, 7), date(2025, 1, 7), 20)

    resultado = evaluar_lectura(db, evaluada)

    # Quedan la evaluada (excluida) y la normal (excluida): referencia de 5.
    assert resultado.cantidad_referencia == 5
    assert resultado.promedio == pytest.approx(20)
    assert resultado.estado is EstadoEvaluacion.DENTRO


def test_referencia_estacional_con_tres_o_mas_lecturas_de_la_estacion(db):
    inmueble = _inmueble(db)
    # Tres de verano con consumo 10 por día y tres de invierno con 100 por día.
    for dia in (2, 3):
        _lectura(db, inmueble, date(2025, 1, dia), date(2025, 1, dia), 10)
    _lectura(db, inmueble, date(2025, 2, 1), date(2025, 2, 1), 10)
    for mes in (6, 7, 8):
        _lectura(db, inmueble, date(2025, mes, 1), date(2025, mes, 1), 100)
    evaluada = _lectura(db, inmueble, date(2025, 1, 1), date(2025, 1, 1), 20)

    resultado = evaluar_lectura(db, evaluada)

    assert resultado.referencia_estacional is True
    assert resultado.cantidad_referencia == 3
    assert resultado.promedio == pytest.approx(10)  # solo las tres de verano


def test_referencia_general_con_menos_de_tres_lecturas_de_la_estacion(db):
    inmueble = _inmueble(db)
    # Dos de verano (10) y tres de invierno (100): no alcanzan para la referencia estacional.
    for dia in (2, 3):
        _lectura(db, inmueble, date(2025, 1, dia), date(2025, 1, dia), 10)
    for mes in (6, 7, 8):
        _lectura(db, inmueble, date(2025, mes, 1), date(2025, mes, 1), 100)
    evaluada = _lectura(db, inmueble, date(2025, 1, 1), date(2025, 1, 1), 20)

    resultado = evaluar_lectura(db, evaluada)

    assert resultado.referencia_estacional is False
    assert resultado.cantidad_referencia == 5
    assert resultado.promedio == pytest.approx(64)  # (10 + 10 + 100 + 100 + 100) / 5


# ======================================================================
# DET-83 · Evaluación al guardar una lectura y al guardar un lote
# ======================================================================
def _headers(client, correo="detector.api@test.com"):
    res = client.post("/api/auth/register", json={
        "nombre": "Test", "correo": correo, "contrasena": "Clave1234",
    })
    assert res.status_code == 201
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _inmueble_api(client, headers):
    res = client.post("/api/inmuebles/", json={"nombre": "Casa", "direccion": "Calle 1"}, headers=headers)
    assert res.status_code == 201
    return res.json()["id"]


def _post_lectura(client, headers, inmueble_id, dia, consumo):
    return client.post(CONSUMOS, json={
        "inmueble_id": inmueble_id,
        "servicio": "LUZ",
        "fecha_inicio": f"2025-01-{dia:02d}",
        "fecha_fin": f"2025-01-{dia:02d}",
        "consumo": consumo,
    }, headers=headers)


def test_post_individual_devuelve_la_evaluacion_y_no_crea_alertas(client, db):
    headers = _headers(client)
    inmueble_id = _inmueble_api(client, headers)

    # Las primeras cinco quedan en "aprendiendo" (RN-07).
    for dia, consumo in enumerate([17, 17, 20, 23, 23], start=1):
        res = _post_lectura(client, headers, inmueble_id, dia, consumo)
        assert res.status_code == 201
        assert res.json()["evaluacion"]["estado"] == "aprendiendo"
        assert res.json()["evaluacion"]["motivo"] == "lecturas_insuficientes"

    res = _post_lectura(client, headers, inmueble_id, 6, 20)

    assert res.status_code == 201
    evaluacion = res.json()["evaluacion"]
    assert evaluacion["estado"] == "dentro"
    assert evaluacion["promedio"] == pytest.approx(20)
    assert evaluacion["desvio_efectivo"] == pytest.approx(3)
    assert evaluacion["limite_inferior"] == pytest.approx(14)
    assert evaluacion["limite_superior"] == pytest.approx(26)
    assert evaluacion["cantidad_referencia"] == 5
    assert evaluacion["referencia_estacional"] is True
    # DET-83: la carga no genera la alerta; eso queda para HU-13.
    assert db.query(Alerta).count() == 0


def test_lote_evalua_cada_fila_contra_las_demas_incluidas_las_del_lote(client, db):
    headers = _headers(client, "detector.lote@test.com")
    inmueble_id = _inmueble_api(client, headers)
    consumos = [17, 17, 20, 23, 23, 27]

    res = client.post(f"{CONSUMOS}/lote", json={
        "inmueble_id": inmueble_id,
        "lecturas": [
            {"servicio": "LUZ", "fecha_inicio": f"2025-01-{dia:02d}",
             "fecha_fin": f"2025-01-{dia:02d}", "consumo": consumo}
            for dia, consumo in enumerate(consumos, start=1)
        ],
    }, headers=headers)

    assert res.status_code == 201
    data = res.json()
    assert data["cantidad_cargadas"] == 6
    assert data["detector_activo_por_servicio"]["LUZ"] is True

    estados = [fila["evaluacion"]["estado"] for fila in data["lecturas"]]
    assert estados == ["dentro", "dentro", "dentro", "dentro", "dentro", "alta"]
    # Cada fila usó como referencia a las otras cinco, incluidas las del propio lote.
    assert all(fila["evaluacion"]["cantidad_referencia"] == 5 for fila in data["lecturas"])
    # La fila 27 es alta porque se la compara con las otras cinco (media 20, límites 14-26).
    assert data["lecturas"][-1]["evaluacion"]["promedio"] == pytest.approx(20)
    assert data["lecturas"][-1]["evaluacion"]["limite_superior"] == pytest.approx(26)
    # HU-13 / DET-86: el lote persiste la alerta de la fila anómala (consumo 27: alta).
    assert db.query(Alerta).count() == 1
    alerta_creada = db.query(Alerta).first()
    assert alerta_creada.tipo == TipoAlertaEnum.ALTA
    assert alerta_creada.estado == EstadoAlertaEnum.PENDIENTE
    assert alerta_creada.desvio_porcentual == pytest.approx(35.0)


def test_lote_con_menos_de_seis_lecturas_queda_aprendiendo(client, db):
    headers = _headers(client, "detector.lote.corto@test.com")
    inmueble_id = _inmueble_api(client, headers)

    res = client.post(f"{CONSUMOS}/lote", json={
        "inmueble_id": inmueble_id,
        "lecturas": [
            {"servicio": "LUZ", "fecha_inicio": f"2025-01-0{dia}",
             "fecha_fin": f"2025-01-0{dia}", "consumo": consumo}
            for dia, consumo in enumerate([17, 20, 23], start=1)
        ],
    }, headers=headers)

    assert res.status_code == 201
    data = res.json()
    assert [fila["evaluacion"]["estado"] for fila in data["lecturas"]] == ["aprendiendo"] * 3
    assert data["detector_activo_por_servicio"]["LUZ"] is False
    assert db.query(Alerta).count() == 0