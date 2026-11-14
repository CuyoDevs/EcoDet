"""Pruebas de HU-13 · Recibir una alerta de consumo alto o bajo (CU-07, RN-06 a RN-13).

Cubre las subtareas DET-86, DET-87 y DET-89:
- Persistencia de alertas asociadas a la lectura cuando es ALTA o BAJA.
- Estado inicial PENDIENTE y tipo correspondiente.
- Inclusión de desvío porcentual, mensaje y alerta en la respuesta.
- Caso testigo oficial: media 20, desvío 3, umbral 2 (límites 14 a 26).
  * Consumo 31: ALTA (+55.0% de desvío), alerta generada.
  * Consumo 10: BAJA (-50.0% de desvío), alerta generada.
  * Consumo 20: DENTRO, sin alerta.
- Carga en lote con persistencia de alertas en filas anómalas.
"""
import pytest
from backend.app.models import Usuario, Inmueble, Lectura, Alerta, TipoAlertaEnum, EstadoAlertaEnum

CONSUMOS = "/api/consumos"


def _headers(client, correo="alerta.hu13@test.com"):
    res = client.post("/api/auth/register", json={
        "nombre": "Alerta Tester",
        "correo": correo,
        "contrasena": "Secreta123!"
    })
    assert res.status_code == 201
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _inmueble(client, headers):
    res = client.post("/api/inmuebles/", json={"nombre": "Casa Alertas", "direccion": "Av. Test 123"}, headers=headers)
    assert res.status_code == 201
    return res.json()["id"]


def _post_lectura(client, headers, inmueble_id, dia, consumo, servicio="LUZ"):
    return client.post(CONSUMOS, json={
        "inmueble_id": inmueble_id,
        "servicio": servicio,
        "fecha_inicio": f"2025-01-{dia:02d}",
        "fecha_fin": f"2025-01-{dia:02d}",
        "consumo": consumo,
    }, headers=headers)


def test_caso_testigo_alerta_alta_persiste_y_devuelve_desvio_55_porciento(client, db):
    """Caso testigo (RN-09, RN-10, RN-12): media 20, desvío 3, umbral 2 -> límite 26.
    Lectura 31 genera alerta ALTA con desvío +55.0% y estado PENDIENTE (DET-86, DET-87).
    """
    headers = _headers(client, "testigo.alta@test.com")
    inmueble_id = _inmueble(client, headers)

    # 5 lecturas de referencia: [17, 17, 20, 23, 23] -> media 20, desvío 3
    for dia, c in enumerate([17, 17, 20, 23, 23], start=1):
        r = _post_lectura(client, headers, inmueble_id, dia, c)
        assert r.status_code == 201
        assert r.json()["evaluacion"]["estado"] == "aprendiendo"
        assert r.json()["alerta"] is None

    # Lectura 6: consumo 31
    res = _post_lectura(client, headers, inmueble_id, 6, 31)
    assert res.status_code == 201
    data = res.json()

    # Evaluación y mensaje (DET-87)
    ev = data["evaluacion"]
    assert ev["estado"] == "alta"
    assert ev["alerta_generada"] is True
    assert ev["desvio_porcentual"] == pytest.approx(55.0)
    assert "superior a lo habitual" in ev["mensaje"]
    assert "55.0%" in ev["mensaje"]

    # Objeto alerta en la respuesta (DET-86)
    assert data["alerta"] is not None
    alerta_data = data["alerta"]
    assert alerta_data["tipo"] == "ALTA"
    assert alerta_data["estado"] == "PENDIENTE"
    assert alerta_data["desvio_porcentual"] == pytest.approx(55.0)
    assert alerta_data["consumo_por_dia"] == pytest.approx(31.0)
    assert alerta_data["consumo_habitual_por_dia"] == pytest.approx(20.0)

    # Persistencia en base de datos (DET-86)
    alerta_db = db.query(Alerta).filter(Alerta.lectura_id == data["id"]).first()
    assert alerta_db is not None
    assert alerta_db.tipo == TipoAlertaEnum.ALTA
    assert alerta_db.estado == EstadoAlertaEnum.PENDIENTE
    assert alerta_db.desvio_porcentual == pytest.approx(55.0)
    assert alerta_db.consumo_por_dia == pytest.approx(31.0)
    assert alerta_db.consumo_habitual_por_dia == pytest.approx(20.0)


def test_caso_testigo_alerta_baja_persiste_y_devuelve_desvio_menos_50_porciento(client, db):
    """Caso testigo (RN-09, RN-10, RN-12): media 20, desvío 3, umbral 2 -> límite 14.
    Lectura 10 genera alerta BAJA con desvío -50.0% y estado PENDIENTE (DET-86, DET-87).
    """
    headers = _headers(client, "testigo.baja@test.com")
    inmueble_id = _inmueble(client, headers)

    for dia, c in enumerate([17, 17, 20, 23, 23], start=1):
        _post_lectura(client, headers, inmueble_id, dia, c)

    # Lectura 6: consumo 10
    res = _post_lectura(client, headers, inmueble_id, 6, 10)
    assert res.status_code == 201
    data = res.json()

    ev = data["evaluacion"]
    assert ev["estado"] == "baja"
    assert ev["alerta_generada"] is True
    assert ev["desvio_porcentual"] == pytest.approx(-50.0)
    assert "inferior a lo habitual" in ev["mensaje"]
    assert "50.0%" in ev["mensaje"]

    assert data["alerta"] is not None
    assert data["alerta"]["tipo"] == "BAJA"
    assert data["alerta"]["estado"] == "PENDIENTE"
    assert data["alerta"]["desvio_porcentual"] == pytest.approx(-50.0)

    alerta_db = db.query(Alerta).filter(Alerta.lectura_id == data["id"]).first()
    assert alerta_db is not None
    assert alerta_db.tipo == TipoAlertaEnum.BAJA
    assert alerta_db.estado == EstadoAlertaEnum.PENDIENTE
    assert alerta_db.desvio_porcentual == pytest.approx(-50.0)


def test_consumo_normal_dentro_de_limites_no_genera_alerta(client, db):
    """Lectura 20 queda dentro de límites (14-26); no genera alerta ni registro en BD."""
    headers = _headers(client, "testigo.dentro@test.com")
    inmueble_id = _inmueble(client, headers)

    for dia, c in enumerate([17, 17, 20, 23, 23], start=1):
        _post_lectura(client, headers, inmueble_id, dia, c)

    # Lectura 6: consumo 20
    res = _post_lectura(client, headers, inmueble_id, 6, 20)
    assert res.status_code == 201
    data = res.json()

    ev = data["evaluacion"]
    assert ev["estado"] == "dentro"
    assert ev["alerta_generada"] is False
    assert ev["desvio_porcentual"] == pytest.approx(0.0)
    assert "dentro de los parámetros habituales" in ev["mensaje"]
    assert data["alerta"] is None

    # En BD no existe alerta
    assert db.query(Alerta).filter(Alerta.lectura_id == data["id"]).first() is None


def test_lote_con_multiples_anomalias_persiste_todas_las_alertas(client, db):
    """En carga por lote, si hay filas con alta y baja, se persisten todas las alertas correspondientes."""
    headers = _headers(client, "lote.anomalias@test.com")
    inmueble_id = _inmueble(client, headers)

    # 7 lecturas: 5 normales (17, 17, 20, 23, 23), 1 baja (10), 1 alta (31)
    consumos = [17, 17, 20, 23, 23, 10, 31]
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
    assert data["cantidad_cargadas"] == 7

    # Debe haber alertas para las filas 6 (baja) y 7 (alta)
    alertas_en_db = db.query(Alerta).all()
    # Filtramos las de este inmueble/lecturas
    lecturas_ids = [l["id"] for l in data["lecturas"]]
    alertas_lote = [a for a in alertas_en_db if a.lectura_id in lecturas_ids]
    assert len(alertas_lote) >= 2

    # Verificar que las lecturas en la respuesta tienen su objeto alerta
    fila_baja = next(f for f in data["lecturas"] if f["consumo"] == 10)
    assert fila_baja["evaluacion"]["estado"] == "baja"
    assert fila_baja["evaluacion"]["alerta_generada"] is True
    assert fila_baja["alerta"]["tipo"] == "BAJA"

    fila_alta = next(f for f in data["lecturas"] if f["consumo"] == 31)
    assert fila_alta["evaluacion"]["estado"] == "alta"
    assert fila_alta["evaluacion"]["alerta_generada"] is True
    assert fila_alta["alerta"]["tipo"] == "ALTA"
