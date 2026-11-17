"""Pruebas de HU-14 · Saber que el sistema todavía está aprendiendo (DET-92 a DET-95).

RN-07: un servicio con menos de 6 lecturas en un inmueble todavía no se evalúa. La API informa en
`evaluacion` el estado "aprendiendo" y cuántas lecturas faltan, y lo mismo en el historial y el lote.
"""
import pytest

from backend.app.config import detector_config
from backend.app.models import Alerta, EstadoAlertaEnum, Lectura, TipoAlertaEnum
from backend.app.services.detector import lecturas_faltantes_para_activar

CONSUMOS = "/api/consumos"
MINIMO = 6


# ---------- ayudas ----------
def _headers(client, correo="laura@eco.com"):
    res = client.post("/api/auth/register", json={"nombre": "Test", "correo": correo, "contrasena": "Clave1234"})
    assert res.status_code == 201
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _inmueble(client, headers, nombre="Casa"):
    res = client.post("/api/inmuebles/", json={"nombre": nombre, "direccion": "Calle 1"}, headers=headers)
    assert res.status_code == 201
    return res.json()["id"]


def _cargar(client, headers, inmueble_id, numero, consumo=100.0, servicio="LUZ"):
    """Carga una lectura de UN día (así consumo = consumo por día) y devuelve la respuesta completa."""
    dia = f"2025-01-{numero:02d}"
    res = client.post(CONSUMOS, json={
        "inmueble_id": inmueble_id, "servicio": servicio,
        "fecha_inicio": dia, "fecha_fin": dia, "consumo": consumo,
    }, headers=headers)
    assert res.status_code == 201, res.text
    return res.json()


def _historial(client, headers, inmueble_id):
    res = client.get(f"{CONSUMOS}/{inmueble_id}/historial", headers=headers)
    assert res.status_code == 200
    return res.json()


def _fila(numero, consumo=100.0, servicio="LUZ"):
    dia = f"2025-02-{numero:02d}"
    return {"servicio": servicio, "fecha_inicio": dia, "fecha_fin": dia, "consumo": consumo}


@pytest.fixture()
def laura(client):
    headers = _headers(client)
    return headers, _inmueble(client, headers)


# ======================================================================
# Regla pura
# ======================================================================
@pytest.mark.parametrize("total, esperado", [(0, 6), (1, 5), (5, 1), (6, 0), (9, 0)])
def test_lecturas_faltantes_para_activar(total, esperado):
    assert lecturas_faltantes_para_activar(total) == esperado


# ======================================================================
# DET-92 · Respuesta de la evaluación al cargar (criterios 1 y 2)
# ======================================================================
@pytest.mark.parametrize("cargadas", [1, 2, 3, 4, 5])
def test_con_menos_de_6_lecturas_la_evaluacion_dice_aprendiendo_y_cuantas_faltan(client, laura, cargadas):
    """Criterio 1: con menos de 6 lecturas el sistema todavía está aprendiendo."""
    headers, inmueble_id = laura
    for n in range(1, cargadas):
        _cargar(client, headers, inmueble_id, n)

    evaluacion = _cargar(client, headers, inmueble_id, cargadas)["evaluacion"]

    assert evaluacion["estado"] == "aprendiendo"
    assert evaluacion["motivo"] == "lecturas_insuficientes"
    assert evaluacion["lecturas_registradas"] == cargadas
    assert evaluacion["lecturas_faltantes"] == MINIMO - cargadas
    assert evaluacion["promedio"] is None and evaluacion["limite_superior"] is None  # no se evalúa nada


def test_la_sexta_lectura_termina_el_aprendizaje(client, laura):
    """Criterio 2: al llegar a 6 lecturas el aviso desaparece (no hay más faltantes ni estado aprendiendo)."""
    headers, inmueble_id = laura
    for n in range(1, 6):
        _cargar(client, headers, inmueble_id, n)

    evaluacion = _cargar(client, headers, inmueble_id, 6)["evaluacion"]

    assert evaluacion["estado"] != "aprendiendo"
    assert evaluacion["motivo"] is None
    assert evaluacion["lecturas_registradas"] == 6
    assert evaluacion["lecturas_faltantes"] == 0


def test_desde_la_sexta_lectura_el_detector_ya_clasifica(client, laura):
    """Criterio 2: el detector empieza a evaluar (caso 20 / 3 / 2: media 20, desvío 3, límites 14 y 26)."""
    headers, inmueble_id = laura
    for n, consumo in enumerate((17, 17, 20, 23, 23), start=1):
        _cargar(client, headers, inmueble_id, n, consumo)

    evaluacion = _cargar(client, headers, inmueble_id, 6, 31)["evaluacion"]

    assert evaluacion["estado"] == "alta"
    assert (evaluacion["promedio"], evaluacion["limite_inferior"], evaluacion["limite_superior"]) == (20.0, 14.0, 26.0)
    assert evaluacion["lecturas_faltantes"] == 0


def test_mientras_aprende_no_se_genera_ninguna_alerta(client, db, laura):
    """Criterio 1: ni alertas guardadas ni marcas de alerta en el historial."""
    headers, inmueble_id = laura
    for n, consumo in enumerate((10, 500, 10, 500, 10), start=1):  # consumos muy dispares: igual no se evalúa
        _cargar(client, headers, inmueble_id, n, consumo)

    assert db.query(Alerta).count() == 0
    assert all(not l["tiene_alerta"] for l in _historial(client, headers, inmueble_id)["LUZ"]["lecturas"])


def test_cada_servicio_aprende_por_separado(client, laura):
    headers, inmueble_id = laura
    for n in range(1, 7):
        _cargar(client, headers, inmueble_id, n, servicio="LUZ")
    for n in range(1, 3):
        _cargar(client, headers, inmueble_id, n, servicio="GAS")

    gas = _cargar(client, headers, inmueble_id, 3, servicio="GAS")["evaluacion"]
    luz = _cargar(client, headers, inmueble_id, 7, servicio="LUZ")["evaluacion"]

    assert (gas["estado"], gas["lecturas_registradas"], gas["lecturas_faltantes"]) == ("aprendiendo", 3, 3)
    assert luz["estado"] != "aprendiendo"
    assert (luz["lecturas_registradas"], luz["lecturas_faltantes"]) == (7, 0)


def test_las_lecturas_de_otro_inmueble_no_cuentan(client, laura):
    headers, inmueble_id = laura
    otro = _inmueble(client, headers, "Depto")
    for n in range(1, 7):
        _cargar(client, headers, otro, n)

    evaluacion = _cargar(client, headers, inmueble_id, 1)["evaluacion"]

    assert (evaluacion["estado"], evaluacion["lecturas_registradas"], evaluacion["lecturas_faltantes"]) == ("aprendiendo", 1, 5)


def test_las_lecturas_de_otro_usuario_no_cuentan(client, laura):
    """RN-01: lo que cargó otra persona no acerca al detector de Laura a su mínimo."""
    headers, inmueble_id = laura
    carlos = _headers(client, "carlos@eco.com")
    inmueble_carlos = _inmueble(client, carlos, "Casa de Carlos")
    for n in range(1, 7):
        _cargar(client, carlos, inmueble_carlos, n)

    evaluacion = _cargar(client, headers, inmueble_id, 1)["evaluacion"]

    assert (evaluacion["lecturas_registradas"], evaluacion["lecturas_faltantes"]) == (1, 5)


def test_referencia_insuficiente_informa_cuantas_faltan_aunque_haya_6_lecturas(client, db, laura):
    """RN-07: con 6 o más lecturas pero menos de 3 utilizables como referencia, tampoco se evalúa."""
    headers, inmueble_id = laura
    ids = [_cargar(client, headers, inmueble_id, n)["id"] for n in range(1, 7)]
    for lectura_id in ids[:4]:  # 4 marcadas "normal" no cuentan como referencia (RN-11)
        db.add(Alerta(lectura_id=lectura_id, tipo=TipoAlertaEnum.ALTA, estado=EstadoAlertaEnum.NORMAL,
                      desvio_porcentual=40.0, consumo_por_dia=5.0, consumo_habitual_por_dia=3.0))
    db.commit()

    evaluacion = _cargar(client, headers, inmueble_id, 7)["evaluacion"]

    assert evaluacion["estado"] == "aprendiendo"
    assert evaluacion["motivo"] == "referencia_insuficiente"
    assert evaluacion["lecturas_registradas"] == 7
    assert evaluacion["lecturas_faltantes"] == 1  # la referencia tiene 2 y necesita 3


def test_el_minimo_de_lecturas_sale_de_la_configuracion(client, laura, monkeypatch):
    """RN-09: el mínimo no está fijo en el código; si cambia config.json, cambian los faltantes."""
    monkeypatch.setattr(detector_config, "minimo_de_lecturas", 4)
    headers, inmueble_id = laura

    primera = _cargar(client, headers, inmueble_id, 1)["evaluacion"]
    _cargar(client, headers, inmueble_id, 2)
    _cargar(client, headers, inmueble_id, 3)
    cuarta = _cargar(client, headers, inmueble_id, 4)["evaluacion"]

    assert (primera["estado"], primera["lecturas_faltantes"]) == ("aprendiendo", 3)
    assert cuarta["estado"] != "aprendiendo" and cuarta["lecturas_faltantes"] == 0


def test_editar_una_lectura_mientras_se_aprende_no_crea_alerta(client, db, laura):
    headers, inmueble_id = laura
    lectura = _cargar(client, headers, inmueble_id, 1, 10)

    res = client.put(f"{CONSUMOS}/{lectura['id']}", json={
        "servicio": "LUZ", "fecha_inicio": "2025-01-01", "fecha_fin": "2025-01-01", "consumo": 9999}, headers=headers)

    assert res.status_code == 200
    assert db.query(Alerta).count() == 0


# ======================================================================
# DET-92 · Historial (W4)
# ======================================================================
@pytest.mark.parametrize("cargadas", [0, 1, 3, 5, 6, 8])
def test_el_historial_informa_cuantas_lecturas_faltan(client, laura, cargadas):
    headers, inmueble_id = laura
    for n in range(1, cargadas + 1):
        _cargar(client, headers, inmueble_id, n)

    luz = _historial(client, headers, inmueble_id)["LUZ"]

    assert luz["lecturas_faltantes"] == max(0, MINIMO - cargadas)
    assert luz["detector_activo"] is (cargadas >= MINIMO)


def test_el_historial_informa_los_faltantes_de_cada_servicio(client, laura):
    headers, inmueble_id = laura
    for n in range(1, 7):
        _cargar(client, headers, inmueble_id, n, servicio="LUZ")
    for n in range(1, 3):
        _cargar(client, headers, inmueble_id, n, servicio="GAS")

    historial = _historial(client, headers, inmueble_id)

    assert [historial[s]["lecturas_faltantes"] for s in ("LUZ", "GAS", "AGUA")] == [0, 4, 6]


def test_al_eliminar_una_lectura_vuelven_a_faltar_lecturas(client, laura):
    """Un servicio que ya llegó al mínimo vuelve a "aprender" si se elimina una lectura (HU-11)."""
    headers, inmueble_id = laura
    ids = [_cargar(client, headers, inmueble_id, n)["id"] for n in range(1, 7)]
    assert _historial(client, headers, inmueble_id)["LUZ"]["lecturas_faltantes"] == 0

    client.delete(f"{CONSUMOS}/{ids[0]}", headers=headers)

    luz = _historial(client, headers, inmueble_id)["LUZ"]
    assert (luz["detector_activo"], luz["lecturas_faltantes"]) == (False, 1)


# ======================================================================
# DET-92 · Carga en lote (resumen de W3)
# ======================================================================
def test_el_lote_informa_los_faltantes_por_servicio_y_en_cada_evaluacion(client, laura):
    headers, inmueble_id = laura
    res = client.post(f"{CONSUMOS}/lote", json={
        "inmueble_id": inmueble_id, "lecturas": [_fila(n) for n in range(1, 5)]}, headers=headers)

    assert res.status_code == 201
    assert res.json()["lecturas_faltantes_por_servicio"] == {"LUZ": 2, "GAS": 6, "AGUA": 6}
    assert res.json()["detector_activo_por_servicio"] == {"LUZ": False, "GAS": False, "AGUA": False}
    for lectura in res.json()["lecturas"]:
        assert (lectura["evaluacion"]["estado"], lectura["evaluacion"]["lecturas_faltantes"]) == ("aprendiendo", 2)


def test_el_lote_suma_las_lecturas_que_ya_estaban_cargadas(client, laura):
    headers, inmueble_id = laura
    for n in range(1, 4):
        _cargar(client, headers, inmueble_id, n)

    res = client.post(f"{CONSUMOS}/lote", json={
        "inmueble_id": inmueble_id, "lecturas": [_fila(n) for n in range(1, 3)]}, headers=headers)

    assert res.json()["lecturas_faltantes_por_servicio"]["LUZ"] == 1


def test_un_lote_que_llega_al_minimo_activa_el_detector_sin_faltantes(client, laura):
    headers, inmueble_id = laura
    res = client.post(f"{CONSUMOS}/lote", json={
        "inmueble_id": inmueble_id, "lecturas": [_fila(n) for n in range(1, 7)]}, headers=headers)

    assert res.json()["detector_activo_por_servicio"]["LUZ"] is True
    assert res.json()["lecturas_faltantes_por_servicio"]["LUZ"] == 0
    assert all(l["evaluacion"]["estado"] != "aprendiendo" for l in res.json()["lecturas"])


def test_un_lote_rechazado_no_cambia_los_faltantes(client, laura):
    """Todo o nada (HU-09): si el lote falla, el servicio sigue con las lecturas que tenía."""
    headers, inmueble_id = laura
    for n in range(1, 3):
        _cargar(client, headers, inmueble_id, n)

    res = client.post(f"{CONSUMOS}/lote", json={
        "inmueble_id": inmueble_id, "lecturas": [_fila(3), _fila(4, consumo=-1)]}, headers=headers)

    assert res.status_code == 422
    assert _historial(client, headers, inmueble_id)["LUZ"]["lecturas_faltantes"] == 4
