"""Pruebas de HU-11 · Editar o eliminar una lectura (CU-09): DET-73 (PUT) y DET-74 (DELETE).

Una "lectura" es el registro de consumo que se carga con POST /api/consumos. Las alertas todavía no
las crea ningún motor (HU-12), así que estas pruebas las insertan directo en la base de datos.
"""
from datetime import date, timedelta

import pytest

from backend.app.models import Alerta, Lectura, ServicioEnum, TipoAlertaEnum

CONSUMOS = "/api/consumos"


# ---------- ayudas ----------
def _headers(client, correo):
    res = client.post("/api/auth/register", json={"nombre": "Test", "correo": correo, "contrasena": "Clave1234"})
    assert res.status_code == 201
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _inmueble(client, headers, nombre="Casa"):
    res = client.post("/api/inmuebles/", json={"nombre": nombre, "direccion": "Calle 1"}, headers=headers)
    assert res.status_code == 201
    return res.json()["id"]


def _lectura(client, headers, inmueble_id, servicio="LUZ", inicio="2025-01-01", fin="2025-01-31", consumo=100.0):
    res = client.post(CONSUMOS, json={
        "inmueble_id": inmueble_id, "servicio": servicio,
        "fecha_inicio": inicio, "fecha_fin": fin, "consumo": consumo,
    }, headers=headers)
    assert res.status_code == 201, res.text
    return res.json()


def _con_alerta(db, lectura_id, estado=None):
    """Inserta una alerta para la lectura y devuelve su id."""
    alerta = Alerta(lectura_id=lectura_id, tipo=TipoAlertaEnum.ALTA, desvio_porcentual=40.0,
                    consumo_por_dia=5.0, consumo_habitual_por_dia=3.0)
    if estado is not None:
        alerta.estado = estado
    db.add(alerta)
    db.commit()
    return alerta.id


def _datos(**cambios):
    base = {"servicio": "LUZ", "fecha_inicio": "2025-01-01", "fecha_fin": "2025-01-31", "consumo": 100.0}
    return {**base, **cambios}


def _historial(client, headers, inmueble_id, servicio="LUZ"):
    res = client.get(f"{CONSUMOS}/{inmueble_id}/historial", headers=headers)
    assert res.status_code == 200
    return res.json()[servicio]["lecturas"]


@pytest.fixture()
def laura(client):
    headers = _headers(client, "laura@eco.com")
    return headers, _inmueble(client, headers)


# ======================================================================
# DET-73 · PUT /api/consumos/{id}
# ======================================================================
def test_editar_sin_token_da_401(client):
    assert client.put(f"{CONSUMOS}/1", json=_datos()).status_code == 401


def test_editar_cambia_los_datos_y_devuelve_la_lectura(client, laura):
    """Criterio 1: con valores válidos, la lectura se guarda con los datos nuevos."""
    headers, inmueble_id = laura
    lectura = _lectura(client, headers, inmueble_id)

    res = client.put(f"{CONSUMOS}/{lectura['id']}", json=_datos(
        fecha_inicio="2025-02-01", fecha_fin="2025-02-28", consumo=250.5), headers=headers)

    assert res.status_code == 200
    assert res.json() == {"id": lectura["id"], "inmueble_id": inmueble_id, "servicio": "LUZ",
                          "fecha_inicio": "2025-02-01", "fecha_fin": "2025-02-28", "consumo": 250.5}
    guardada = _historial(client, headers, inmueble_id)
    assert len(guardada) == 1 and guardada[0]["consumo"] == 250.5 and guardada[0]["fecha_inicio"] == "2025-02-01"


def test_editar_solo_el_consumo_manteniendo_el_periodo_no_choca_consigo_misma(client, laura):
    headers, inmueble_id = laura
    lectura = _lectura(client, headers, inmueble_id)
    res = client.put(f"{CONSUMOS}/{lectura['id']}", json=_datos(consumo=80), headers=headers)
    assert res.status_code == 200 and res.json()["consumo"] == 80


def test_editar_el_servicio_de_una_lectura(client, laura):
    """Se cargó como luz y era gas: se corrige y pasa al historial del otro servicio."""
    headers, inmueble_id = laura
    lectura = _lectura(client, headers, inmueble_id, servicio="LUZ")
    res = client.put(f"{CONSUMOS}/{lectura['id']}", json=_datos(servicio="GAS"), headers=headers)

    assert res.status_code == 200 and res.json()["servicio"] == "GAS"
    assert _historial(client, headers, inmueble_id, "LUZ") == []
    assert len(_historial(client, headers, inmueble_id, "GAS")) == 1


def test_editar_con_consumo_cero_es_valido(client, laura):
    """Igual que en la carga: el valor 0 es válido (RN-05)."""
    headers, inmueble_id = laura
    lectura = _lectura(client, headers, inmueble_id)
    assert client.put(f"{CONSUMOS}/{lectura['id']}", json=_datos(consumo=0), headers=headers).status_code == 200


def test_editar_con_fecha_fin_de_hoy_es_valido(client, laura):
    headers, inmueble_id = laura
    lectura = _lectura(client, headers, inmueble_id)
    hoy = date.today().isoformat()
    res = client.put(f"{CONSUMOS}/{lectura['id']}", json=_datos(fecha_inicio=hoy, fecha_fin=hoy), headers=headers)
    assert res.status_code == 200


# ---------- las mismas validaciones que la carga (RN-03, RN-05) ----------
MANANA = (date.today() + timedelta(days=1)).isoformat()


@pytest.mark.parametrize("cambios, campo", [
    ({"consumo": -10}, "consumo"),
    ({"consumo": "abc"}, "consumo"),
    ({"consumo": None}, "consumo"),
    ({"fecha_inicio": "2025-01-31", "fecha_fin": "2025-01-01"}, "fecha_fin"),
    ({"fecha_fin": MANANA}, "fecha_fin"),
    ({"fecha_inicio": MANANA, "fecha_fin": MANANA}, "fecha_inicio"),
    ({"fecha_inicio": "no-es-fecha"}, "fecha_inicio"),
    ({"servicio": "PETROLEO"}, "servicio"),
], ids=["consumo_negativo", "consumo_no_numerico", "consumo_nulo", "fechas_invertidas", "fin_futuro",
        "inicio_futuro", "fecha_invalida", "servicio_desconocido"])
def test_editar_con_datos_invalidos_da_422_indicando_el_campo_y_no_modifica(client, laura, cambios, campo):
    headers, inmueble_id = laura
    lectura = _lectura(client, headers, inmueble_id)

    res = client.put(f"{CONSUMOS}/{lectura['id']}", json=_datos(**cambios), headers=headers)

    assert res.status_code == 422
    assert campo in res.json()["errores"]
    despues = _historial(client, headers, inmueble_id)[0]
    assert (despues["consumo"], despues["fecha_inicio"], despues["fecha_fin"]) == (100.0, "2025-01-01", "2025-01-31")


def test_editar_sin_cuerpo_da_422_con_todos_los_campos(client, laura):
    headers, inmueble_id = laura
    lectura = _lectura(client, headers, inmueble_id)
    res = client.put(f"{CONSUMOS}/{lectura['id']}", json={}, headers=headers)
    assert res.status_code == 422
    assert set(res.json()["errores"]) == {"servicio", "fecha_inicio", "fecha_fin", "consumo"}


def test_los_mensajes_de_validacion_son_los_mismos_que_en_la_carga(client, laura):
    """El PUT hereda las validaciones de la carga: mismo mensaje para el mismo error."""
    headers, inmueble_id = laura
    lectura = _lectura(client, headers, inmueble_id)
    en_la_carga = client.post(CONSUMOS, json={"inmueble_id": inmueble_id, **_datos(consumo=-1)}, headers=headers)
    en_la_edicion = client.put(f"{CONSUMOS}/{lectura['id']}", json=_datos(consumo=-1), headers=headers)
    assert en_la_edicion.json()["errores"]["consumo"] == en_la_carga.json()["errores"]["consumo"]


# ---------- superposición (RN-14) ----------
def test_editar_con_periodo_que_se_superpone_con_otra_lectura_da_409_y_no_modifica(client, laura):
    headers, inmueble_id = laura
    _lectura(client, headers, inmueble_id, inicio="2025-01-01", fin="2025-01-31")
    otra = _lectura(client, headers, inmueble_id, inicio="2025-02-01", fin="2025-02-28", consumo=70)

    res = client.put(f"{CONSUMOS}/{otra['id']}", json=_datos(fecha_inicio="2025-01-15", fecha_fin="2025-02-28"),
                     headers=headers)

    assert res.status_code == 409
    assert "período" in res.json()["errores"]["fecha_inicio"]  # mismo campo que en la carga
    guardada = [l for l in _historial(client, headers, inmueble_id) if l["id"] == otra["id"]][0]
    assert (guardada["fecha_inicio"], guardada["consumo"]) == ("2025-02-01", 70.0)


def test_la_superposicion_incluye_el_dia_de_borde(client, laura):
    """Las fechas son inclusivas: empezar el mismo día en que termina otra lectura sí se superpone."""
    headers, inmueble_id = laura
    _lectura(client, headers, inmueble_id, inicio="2025-01-01", fin="2025-01-31")
    otra = _lectura(client, headers, inmueble_id, inicio="2025-02-01", fin="2025-02-28")

    choca = client.put(f"{CONSUMOS}/{otra['id']}", json=_datos(fecha_inicio="2025-01-31", fecha_fin="2025-02-28"),
                       headers=headers)
    pega = client.put(f"{CONSUMOS}/{otra['id']}", json=_datos(fecha_inicio="2025-02-01", fecha_fin="2025-02-28"),
                      headers=headers)
    assert choca.status_code == 409
    assert pega.status_code == 200


def test_el_mismo_periodo_en_otro_servicio_se_permite(client, laura):
    headers, inmueble_id = laura
    _lectura(client, headers, inmueble_id, servicio="GAS")
    luz = _lectura(client, headers, inmueble_id, servicio="LUZ", inicio="2025-03-01", fin="2025-03-31")
    res = client.put(f"{CONSUMOS}/{luz['id']}", json=_datos(servicio="LUZ"), headers=headers)
    assert res.status_code == 200


def test_cambiar_el_servicio_a_uno_que_ya_tiene_ese_periodo_da_409(client, laura):
    headers, inmueble_id = laura
    _lectura(client, headers, inmueble_id, servicio="GAS")
    luz = _lectura(client, headers, inmueble_id, servicio="LUZ")
    assert client.put(f"{CONSUMOS}/{luz['id']}", json=_datos(servicio="GAS"), headers=headers).status_code == 409


def test_la_superposicion_solo_cuenta_dentro_del_mismo_inmueble(client, laura):
    headers, inmueble_id = laura
    otro_inmueble = _inmueble(client, headers, "Depto")
    _lectura(client, headers, otro_inmueble)
    propia = _lectura(client, headers, inmueble_id, inicio="2025-05-01", fin="2025-05-31")
    assert client.put(f"{CONSUMOS}/{propia['id']}", json=_datos(), headers=headers).status_code == 200


# ---------- aislamiento (RN-01) y recursos inexistentes ----------
def test_editar_una_lectura_inexistente_da_404(client, laura):
    headers, _ = laura
    res = client.put(f"{CONSUMOS}/99999", json=_datos(), headers=headers)
    assert res.status_code == 404
    assert res.json() == {"errores": {"general": "Lectura no encontrada."}}


def test_editar_la_lectura_de_otro_usuario_da_404_y_no_la_modifica(client, laura):
    headers, inmueble_id = laura
    lectura = _lectura(client, headers, inmueble_id)
    carlos = _headers(client, "carlos@eco.com")

    res = client.put(f"{CONSUMOS}/{lectura['id']}", json=_datos(consumo=1), headers=carlos)

    assert res.status_code == 404
    assert res.json() == client.put(f"{CONSUMOS}/99999", json=_datos(), headers=carlos).json()  # igual que inexistente
    assert _historial(client, headers, inmueble_id)[0]["consumo"] == 100.0


def test_el_inmueble_de_una_lectura_no_se_puede_cambiar(client, laura):
    """Aunque el cuerpo traiga otro inmueble_id (incluso uno ajeno), la lectura sigue en el suyo."""
    headers, inmueble_id = laura
    lectura = _lectura(client, headers, inmueble_id)
    ajeno = _inmueble(client, _headers(client, "carlos@eco.com"), "Ajeno")

    res = client.put(f"{CONSUMOS}/{lectura['id']}", json={**_datos(consumo=5), "inmueble_id": ajeno}, headers=headers)

    assert res.status_code == 200 and res.json()["inmueble_id"] == inmueble_id
    assert len(_historial(client, headers, inmueble_id)) == 1


def test_un_id_que_no_es_numero_da_422(client, laura):
    headers, _ = laura
    assert client.put(f"{CONSUMOS}/abc", json=_datos(), headers=headers).status_code == 422


# ---------- alertas (criterio 2 de HU-11) y RN-17 ----------
def test_editar_descarta_la_alerta_anterior_de_la_lectura(client, db, laura):
    """Criterio 2: la alerta anterior no sobrevive a la edición (se reemplaza por el resultado nuevo)."""
    headers, inmueble_id = laura
    lectura = _lectura(client, headers, inmueble_id)
    alerta_vieja = _con_alerta(db, lectura["id"])
    assert _historial(client, headers, inmueble_id)[0]["tiene_alerta"] is True

    assert client.put(f"{CONSUMOS}/{lectura['id']}", json=_datos(consumo=95), headers=headers).status_code == 200

    db.expire_all()
    assert db.query(Alerta).filter(Alerta.id == alerta_vieja).first() is None
    assert db.query(Lectura).filter(Lectura.id == lectura["id"]).one().consumo == 95


def test_editar_no_toca_las_alertas_ni_los_datos_de_otras_lecturas(client, db, laura):
    """RN-17: editar una lectura no recalcula las alertas ya generadas de las demás."""
    headers, inmueble_id = laura
    editada = _lectura(client, headers, inmueble_id, inicio="2025-01-01", fin="2025-01-31")
    vecina = _lectura(client, headers, inmueble_id, inicio="2025-02-01", fin="2025-02-28", consumo=500)
    _con_alerta(db, editada["id"])
    alerta_vecina = _con_alerta(db, vecina["id"])

    client.put(f"{CONSUMOS}/{editada['id']}", json=_datos(consumo=1), headers=headers)

    db.expire_all()
    conservada = db.query(Alerta).filter(Alerta.id == alerta_vecina).one()
    assert (conservada.lectura_id, conservada.desvio_porcentual, conservada.estado.value) == (vecina["id"], 40.0, "PENDIENTE")
    assert db.query(Lectura).filter(Lectura.id == vecina["id"]).one().consumo == 500


def test_editar_una_lectura_sin_alerta_funciona(client, db, laura):
    headers, inmueble_id = laura
    lectura = _lectura(client, headers, inmueble_id)
    assert db.query(Alerta).count() == 0
    assert client.put(f"{CONSUMOS}/{lectura['id']}", json=_datos(consumo=3), headers=headers).status_code == 200


def test_una_edicion_rechazada_no_toca_la_alerta(client, db, laura):
    """Si la edición falla (422 o 409) no cambió nada, así que la alerta sigue donde estaba."""
    headers, inmueble_id = laura
    lectura = _lectura(client, headers, inmueble_id)
    alerta = _con_alerta(db, lectura["id"])

    client.put(f"{CONSUMOS}/{lectura['id']}", json=_datos(consumo=-5), headers=headers)

    db.expire_all()
    assert db.query(Alerta).filter(Alerta.id == alerta).first() is not None
