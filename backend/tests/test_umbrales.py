"""Pruebas de HU-18 · Ajustar la sensibilidad del detector (DET-26, CU-07, RN-09, RN-17).

Cubren el GET y el PUT de `/api/inmuebles/{id}/umbrales`, la validación (texto, cero,
negativo y no finitos se rechazan y conservan el umbral anterior), el aislamiento entre
usuarios (RN-01) y que el umbral guardado cambia el resultado del detector.
"""
import pytest

from backend.app.models import Alerta, TipoAlertaEnum, UmbralServicio

CONSUMOS = "/api/consumos"
MENSAJE_INVALIDO = "El umbral debe ser un número mayor que cero."


# ---------- ayudas ----------
def _headers(client, correo="umbral@test.com"):
    res = client.post("/api/auth/register", json={
        "nombre": "Test", "correo": correo, "contrasena": "Clave1234",
    })
    assert res.status_code == 201
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _inmueble_api(client, headers, nombre="Casa"):
    res = client.post("/api/inmuebles/", json={"nombre": nombre, "direccion": "Calle 1"}, headers=headers)
    assert res.status_code == 201
    return res.json()["id"]


def _url(inmueble_id, servicio=None):
    base = f"/api/inmuebles/{inmueble_id}/umbrales"
    return f"{base}/{servicio}" if servicio else base


def _put(client, headers, inmueble_id, servicio, desvios):
    return client.put(_url(inmueble_id, servicio), json={"desvios": desvios}, headers=headers)


def _post_lectura(client, headers, inmueble_id, dia, consumo):
    return client.post(CONSUMOS, json={
        "inmueble_id": inmueble_id,
        "servicio": "LUZ",
        "fecha_inicio": f"2025-01-{dia:02d}",
        "fecha_fin": f"2025-01-{dia:02d}",
        "consumo": consumo,
    }, headers=headers)


def _cargar_historial_base(client, headers, inmueble_id):
    """17, 17, 20, 23 y 23: promedio 20 y desvío 3 (el caso de prueba del documento)."""
    for dia, consumo in enumerate([17, 17, 20, 23, 23], start=1):
        assert _post_lectura(client, headers, inmueble_id, dia, consumo).status_code == 201


# ======================================================================
# Criterio 4 · El valor inicial es 2 desvíos para cada inmueble y servicio
# ======================================================================
def test_get_devuelve_el_umbral_inicial_de_los_tres_servicios(client):
    headers = _headers(client)
    inmueble_id = _inmueble_api(client, headers)

    res = client.get(_url(inmueble_id), headers=headers)

    assert res.status_code == 200
    umbrales = res.json()
    assert [u["servicio"] for u in umbrales] == ["LUZ", "GAS", "AGUA"]
    assert all(u["desvios"] == pytest.approx(2.0) for u in umbrales)
    assert all(u["personalizado"] is False for u in umbrales)


# ======================================================================
# Criterio 1 · Un valor numérico mayor que cero se guarda
# ======================================================================
def test_put_valido_guarda_y_get_lo_refleja(client, db):
    headers = _headers(client)
    inmueble_id = _inmueble_api(client, headers)

    res = _put(client, headers, inmueble_id, "LUZ", 3.5)

    assert res.status_code == 200
    assert res.json() == {"servicio": "LUZ", "desvios": 3.5, "personalizado": True}
    por_servicio = {u["servicio"]: u for u in client.get(_url(inmueble_id), headers=headers).json()}
    assert por_servicio["LUZ"]["desvios"] == pytest.approx(3.5)
    assert por_servicio["LUZ"]["personalizado"] is True
    # El umbral es por servicio: gas y agua siguen con el valor inicial.
    assert por_servicio["GAS"]["desvios"] == pytest.approx(2.0)
    assert por_servicio["GAS"]["personalizado"] is False
    assert db.query(UmbralServicio).count() == 1


def test_guardar_dos_veces_actualiza_la_misma_fila(client, db):
    headers = _headers(client)
    inmueble_id = _inmueble_api(client, headers)

    assert _put(client, headers, inmueble_id, "GAS", 3).status_code == 200
    assert _put(client, headers, inmueble_id, "GAS", 4.25).status_code == 200

    assert db.query(UmbralServicio).count() == 1
    assert db.query(UmbralServicio).one().desvios == pytest.approx(4.25)


# ======================================================================
# Criterio 2 · No numérico, cero o negativo: se rechaza y se conserva el anterior
# ======================================================================
@pytest.mark.parametrize("invalido", [0, -1, -0.5, "abc", "", None, True], ids=[
    "cero", "negativo", "negativo_decimal", "texto", "vacio", "nulo", "booleano",
])
def test_valor_invalido_da_422_y_conserva_el_umbral_anterior(client, db, invalido):
    headers = _headers(client)
    inmueble_id = _inmueble_api(client, headers)
    assert _put(client, headers, inmueble_id, "LUZ", 3.0).status_code == 200

    res = _put(client, headers, inmueble_id, "LUZ", invalido)

    assert res.status_code == 422
    assert res.json()["errores"]["desvios"] == MENSAJE_INVALIDO
    assert db.query(UmbralServicio).one().desvios == pytest.approx(3.0)
    luz = client.get(_url(inmueble_id), headers=headers).json()[0]
    assert luz["servicio"] == "LUZ" and luz["desvios"] == pytest.approx(3.0)


@pytest.mark.parametrize("literal", ["Infinity", "-Infinity", "NaN"])
def test_infinito_y_nan_se_rechazan(client, db, literal):
    """Un `inf` pasaría el `> 0` y el detector nunca generaría alertas."""
    headers = _headers(client)
    inmueble_id = _inmueble_api(client, headers)

    res = client.put(
        _url(inmueble_id, "LUZ"),
        content=f'{{"desvios": {literal}}}',
        headers={**headers, "Content-Type": "application/json"},
    )

    assert res.status_code == 422
    assert res.json()["errores"]["desvios"] == MENSAJE_INVALIDO
    assert db.query(UmbralServicio).count() == 0


def test_sin_el_campo_desvios_da_422(client):
    headers = _headers(client)
    inmueble_id = _inmueble_api(client, headers)

    res = client.put(_url(inmueble_id, "LUZ"), json={}, headers=headers)

    assert res.status_code == 422
    assert res.json()["errores"]["desvios"] == "Este campo es obligatorio."


def test_servicio_inexistente_en_la_ruta_da_422(client):
    headers = _headers(client)
    inmueble_id = _inmueble_api(client, headers)

    assert _put(client, headers, inmueble_id, "GASOIL", 3).status_code == 422


# ======================================================================
# RN-01 · Cada usuario ve y modifica solo sus inmuebles
# ======================================================================
def test_sin_token_da_401(client):
    headers = _headers(client)
    inmueble_id = _inmueble_api(client, headers)

    assert client.get(_url(inmueble_id)).status_code == 401
    assert client.put(_url(inmueble_id, "LUZ"), json={"desvios": 3}).status_code == 401


def test_inmueble_ajeno_o_inexistente_da_404_y_no_se_modifica(client, db):
    laura = _headers(client, "laura@test.com")
    carlos = _headers(client, "carlos@test.com")
    inmueble_de_laura = _inmueble_api(client, laura)

    for res in (
        client.get(_url(inmueble_de_laura), headers=carlos),
        _put(client, carlos, inmueble_de_laura, "LUZ", 5),
        client.get(_url(9999), headers=carlos),
        _put(client, carlos, 9999, "LUZ", 5),
    ):
        assert res.status_code == 404
        assert res.json()["errores"]["general"] == "Inmueble no encontrado."
    assert db.query(UmbralServicio).count() == 0


# ======================================================================
# Conexión con el detector (HU-12) y RN-17
# ======================================================================
def test_el_umbral_guardado_cambia_el_resultado_del_detector(client):
    """Mismo historial y misma lectura nueva (27): con umbral 2 es alta, con umbral 3,5 es normal."""
    headers = _headers(client)
    con_inicial = _inmueble_api(client, headers, "Casa inicial")
    con_ajustado = _inmueble_api(client, headers, "Casa ajustada")
    assert _put(client, headers, con_ajustado, "LUZ", 3.5).status_code == 200
    for inmueble_id in (con_inicial, con_ajustado):
        _cargar_historial_base(client, headers, inmueble_id)

    alta = _post_lectura(client, headers, con_inicial, 6, 27).json()["evaluacion"]
    dentro = _post_lectura(client, headers, con_ajustado, 6, 27).json()["evaluacion"]

    assert alta["estado"] == "alta"
    assert alta["umbral"] == pytest.approx(2.0)
    assert alta["limite_superior"] == pytest.approx(26)      # 20 + 2 × 3
    assert dentro["estado"] == "dentro"
    assert dentro["umbral"] == pytest.approx(3.5)
    assert dentro["limite_superior"] == pytest.approx(30.5)  # 20 + 3,5 × 3
    assert dentro["limite_inferior"] == pytest.approx(9.5)


def test_cambiar_el_umbral_no_toca_las_alertas_ya_generadas(client, db):
    """RN-17: el cambio aplica solo a las detecciones siguientes; no recalcula hacia atrás."""
    headers = _headers(client)
    inmueble_id = _inmueble_api(client, headers)
    _cargar_historial_base(client, headers, inmueble_id)
    assert _post_lectura(client, headers, inmueble_id, 6, 27).json()["evaluacion"]["estado"] == "alta"
    assert db.query(Alerta).count() == 1

    assert _put(client, headers, inmueble_id, "LUZ", 10).status_code == 200

    db.expire_all()
    alerta = db.query(Alerta).one()
    assert alerta.tipo == TipoAlertaEnum.ALTA
