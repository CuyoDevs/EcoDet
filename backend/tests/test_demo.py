"""Pruebas de HU-19 · Cargar datos de ejemplo (DET-27, CU-08, RN-16).

Cubren la carga del inmueble de demostración (24 meses de luz y gas, 12 de agua), que el
detector marque exactamente las lecturas de la tabla de resultados esperados, que no se
duplique, que se pueda eliminar y volver a cargar (HU-07) y el aislamiento entre usuarios.
"""
from datetime import date

from backend.app.models import Alerta, Inmueble, Lectura
from backend.app.services.datos_demo import (
    ALERTAS_ESPERADAS,
    NOMBRE_DEMO,
    SERIES_DEMO,
    periodos_demo,
)

DEMO = "/api/inmuebles/demo"
TOTAL_LECTURAS = 24 + 24 + 12


# ---------- ayudas ----------
def _headers(client, correo="demo@test.com"):
    res = client.post("/api/auth/register", json={
        "nombre": "Test", "correo": correo, "contrasena": "Clave1234",
    })
    assert res.status_code == 201
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _cargar(client, headers):
    return client.post(DEMO, headers=headers)


def _alertas_del_inmueble(db, inmueble_id):
    """(servicio, fecha_inicio, tipo) de cada alerta del inmueble."""
    filas = (
        db.query(Lectura.servicio, Lectura.fecha_inicio, Alerta.tipo)
        .join(Alerta, Alerta.lectura_id == Lectura.id)
        .filter(Lectura.inmueble_id == inmueble_id)
        .all()
    )
    return {(servicio.value, inicio, tipo.value) for servicio, inicio, tipo in filas}


# ======================================================================
# Criterio 1 · Se crea un inmueble de demostración con 24 / 24 / 12 meses
# ======================================================================
def test_cargar_demo_crea_un_inmueble_identificado_como_demostracion(client):
    headers = _headers(client)

    res = _cargar(client, headers)

    assert res.status_code == 201
    inmueble = res.json()
    assert inmueble["es_demo"] is True
    assert inmueble["nombre"] == NOMBRE_DEMO


def test_el_demo_tiene_24_meses_de_luz_y_gas_y_12_de_agua(client):
    headers = _headers(client)
    inmueble_id = _cargar(client, headers).json()["id"]

    historial = client.get(f"/api/consumos/{inmueble_id}/historial", headers=headers).json()

    assert len(historial["LUZ"]["lecturas"]) == 24
    assert len(historial["GAS"]["lecturas"]) == 24
    assert len(historial["AGUA"]["lecturas"]) == 12
    assert all(historial[s]["detector_activo"] for s in ("LUZ", "GAS", "AGUA"))


def test_las_fechas_del_demo_son_pasadas_y_no_se_superponen():
    """RN-03 (nada en el futuro) y RN-14 (sin superposición) para los datos fijos."""
    for servicio in SERIES_DEMO:
        periodos = periodos_demo(servicio)
        assert all(fin < date.today() for _, fin, _ in periodos)
        for (_, fin_anterior, _), (inicio_siguiente, _, _) in zip(periodos, periodos[1:]):
            assert fin_anterior < inicio_siguiente


# ======================================================================
# Criterio 2 · 2 altas y 1 baja por servicio, y el detector las identifica todas
# ======================================================================
def test_el_detector_marca_exactamente_las_lecturas_de_la_tabla_esperada(client, db):
    headers = _headers(client)

    inmueble = _cargar(client, headers).json()

    assert _alertas_del_inmueble(db, inmueble["id"]) == set(ALERTAS_ESPERADAS)
    assert inmueble["alertas_pendientes"] == 9


def test_hay_2_altas_y_1_baja_por_servicio(client, db):
    headers = _headers(client)
    inmueble_id = _cargar(client, headers).json()["id"]

    alertas = _alertas_del_inmueble(db, inmueble_id)

    for servicio in ("LUZ", "GAS", "AGUA"):
        tipos = sorted(tipo for s, _, tipo in alertas if s == servicio)
        assert tipos == ["ALTA", "ALTA", "BAJA"]


# ======================================================================
# Criterio 3 · Si ya cargó los datos de ejemplo, avisa y no duplica (RN-16)
# ======================================================================
def test_cargar_dos_veces_avisa_y_no_duplica(client, db):
    headers = _headers(client)
    assert _cargar(client, headers).status_code == 201

    res = _cargar(client, headers)

    assert res.status_code == 409
    assert "Ya cargaste los datos de ejemplo" in res.json()["errores"]["general"]
    assert db.query(Inmueble).filter(Inmueble.es_demo.is_(True)).count() == 1
    assert db.query(Lectura).count() == TOTAL_LECTURAS
    assert db.query(Alerta).count() == 9


# ======================================================================
# Criterio 4 · Se puede eliminar (HU-07) y volver a cargar
# ======================================================================
def test_eliminar_el_demo_y_volver_a_cargarlo(client, db):
    headers = _headers(client)
    inmueble_id = _cargar(client, headers).json()["id"]

    assert client.delete(f"/api/inmuebles/{inmueble_id}", headers=headers).status_code == 204
    assert db.query(Lectura).count() == 0
    assert db.query(Alerta).count() == 0

    res = _cargar(client, headers)

    assert res.status_code == 201
    assert db.query(Lectura).count() == TOTAL_LECTURAS
    assert _alertas_del_inmueble(db, res.json()["id"]) == set(ALERTAS_ESPERADAS)


# ======================================================================
# RN-01 y apoyo
# ======================================================================
def test_sin_token_da_401(client):
    assert client.post(DEMO).status_code == 401


def test_cada_usuario_tiene_su_propio_demo_y_no_ve_el_ajeno(client):
    laura = _headers(client, "laura@test.com")
    carlos = _headers(client, "carlos@test.com")
    demo_de_laura = _cargar(client, laura).json()["id"]

    assert _cargar(client, carlos).status_code == 201
    de_carlos = client.get("/api/inmuebles/", headers=carlos).json()

    assert len(de_carlos) == 1 and de_carlos[0]["id"] != demo_de_laura
    assert client.get(f"/api/consumos/{demo_de_laura}/historial", headers=carlos).status_code == 404


def test_si_el_nombre_ya_esta_ocupado_usa_otro_y_igual_se_carga(client):
    headers = _headers(client)
    client.post("/api/inmuebles/", json={"nombre": NOMBRE_DEMO}, headers=headers)

    res = _cargar(client, headers)

    assert res.status_code == 201
    assert res.json()["nombre"] == f"{NOMBRE_DEMO} 2"
    assert res.json()["es_demo"] is True


def test_el_listado_expone_es_demo_y_las_alertas_pendientes(client):
    headers = _headers(client)
    client.post("/api/inmuebles/", json={"nombre": "Mi casa"}, headers=headers)
    _cargar(client, headers)

    por_nombre = {i["nombre"]: i for i in client.get("/api/inmuebles/", headers=headers).json()}

    assert por_nombre["Mi casa"]["es_demo"] is False
    assert por_nombre[NOMBRE_DEMO]["es_demo"] is True
    assert por_nombre[NOMBRE_DEMO]["alertas_pendientes"] == 9
