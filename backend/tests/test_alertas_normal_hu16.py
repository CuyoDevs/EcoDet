"""Pruebas de HU-16 · Marcar una alerta como "normal" (CU-07, RN-11, RN-13, RN-17).

Cubren las subtareas DET-100, DET-101 y DET-103:
- PATCH /api/alertas/{id}/normal: pasa la alerta de PENDIENTE a NORMAL y la saca de las pendientes.
- Aislamiento entre usuarios (RN-01): una alerta ajena o inexistente responde 404 y no se modifica.
- Solo se marca una alerta pendiente (RN-13): una ya normal o confirmada responde 409.
- La lectura marcada deja de integrar la referencia de las detecciones siguientes (RN-11).
- Marcarla no recalcula ninguna alerta ya generada (RN-17).
"""
import pytest

from backend.app.models import Alerta, EstadoAlertaEnum, Lectura, TipoAlertaEnum

CONSUMOS = "/api/consumos"
INMUEBLES = "/api/inmuebles/"


def _headers(client, correo="laura.hu16@test.com"):
    res = client.post("/api/auth/register", json={
        "nombre": "Laura HU16",
        "correo": correo,
        "contrasena": "Password123",
    })
    assert res.status_code == 201
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _inmueble(client, headers, nombre="Casa Norte"):
    res = client.post(INMUEBLES, json={"nombre": nombre, "direccion": "Av. San Martín 500"}, headers=headers)
    assert res.status_code == 201
    return res.json()


def _lectura(client, headers, inmueble_id, inicio, fin, consumo, servicio="LUZ"):
    res = client.post(CONSUMOS, json={
        "inmueble_id": inmueble_id,
        "servicio": servicio,
        "fecha_inicio": inicio,
        "fecha_fin": fin,
        "consumo": consumo,
    }, headers=headers)
    assert res.status_code == 201
    return res.json()


def _alerta_alta_luz(client, headers, inmueble_id):
    """6 lecturas estables de Luz (100 en 28 días) y un pico de 450 en julio: alerta ALTA y PENDIENTE."""
    lote = [
        {"servicio": "LUZ", "fecha_inicio": f"2025-0{m}-01", "fecha_fin": f"2025-0{m}-28", "consumo": 100.0}
        for m in range(1, 7)
    ]
    res = client.post(f"{CONSUMOS}/lote", json={"inmueble_id": inmueble_id, "lecturas": lote}, headers=headers)
    assert res.status_code == 201

    pico = _lectura(client, headers, inmueble_id, "2025-07-01", "2025-07-28", 450.0)
    assert pico["alerta"] is not None
    assert pico["alerta"]["tipo"] == "ALTA"
    assert pico["alerta"]["estado"] == "PENDIENTE"
    return pico["alerta"]


def _marcar_normal(client, headers, alerta_id):
    return client.patch(f"/api/alertas/{alerta_id}/normal", headers=headers)


# ======================================================================
# DET-100 · PATCH /api/alertas/{id}/normal
# ======================================================================
def test_marcar_normal_sin_token_da_401(client):
    assert client.patch("/api/alertas/1/normal").status_code == 401


def test_marcar_normal_cambia_el_estado_y_devuelve_el_detalle(client, db):
    headers = _headers(client)
    inmueble = _inmueble(client, headers)
    alerta = _alerta_alta_luz(client, headers, inmueble["id"])

    res = _marcar_normal(client, headers, alerta["id"])

    assert res.status_code == 200
    cuerpo = res.json()
    assert cuerpo["id"] == alerta["id"]
    assert cuerpo["estado"] == "NORMAL"
    assert cuerpo["tipo"] == "ALTA"
    assert cuerpo["servicio"] == "LUZ"
    assert cuerpo["fecha_inicio"] == "2025-07-01"
    assert cuerpo["fecha_fin"] == "2025-07-28"
    assert cuerpo["consumo"] == 450.0

    # El cambio quedó guardado: se ve al consultar el detalle y en la base.
    assert client.get(f"/api/alertas/{alerta['id']}", headers=headers).json()["estado"] == "NORMAL"
    db.expire_all()
    assert db.query(Alerta).one().estado == EstadoAlertaEnum.NORMAL


def test_la_alerta_marcada_sale_de_las_pendientes(client):
    """Criterio 2: sale de las pendientes (listado filtrado y contador de la tarjeta del inmueble)."""
    headers = _headers(client)
    inmueble = _inmueble(client, headers)
    alerta = _alerta_alta_luz(client, headers, inmueble["id"])
    alertas_url = f"/api/inmuebles/{inmueble['id']}/alertas"
    assert client.get(INMUEBLES, headers=headers).json()[0]["alertas_pendientes"] == 1

    assert _marcar_normal(client, headers, alerta["id"]).status_code == 200

    assert client.get(f"{alertas_url}?estado=PENDIENTE", headers=headers).json() == []
    normales = client.get(f"{alertas_url}?estado=NORMAL", headers=headers).json()
    assert [a["id"] for a in normales] == [alerta["id"]]
    assert client.get(INMUEBLES, headers=headers).json()[0]["alertas_pendientes"] == 0


def test_alerta_inexistente_o_ajena_da_404_y_no_se_modifica(client, db):
    """RN-01: no se puede marcar la alerta de otro usuario, y responde igual que una inexistente."""
    h1 = _headers(client, "hu16_u1@test.com")
    h2 = _headers(client, "hu16_u2@test.com")
    alerta = _alerta_alta_luz(client, h1, _inmueble(client, h1)["id"])

    inexistente = _marcar_normal(client, h1, 99999)
    assert inexistente.status_code == 404
    assert inexistente.json()["errores"]["general"] == "Alerta no encontrada."

    ajena = _marcar_normal(client, h2, alerta["id"])
    assert ajena.status_code == 404
    assert ajena.json() == inexistente.json()

    db.expire_all()
    assert db.query(Alerta).one().estado == EstadoAlertaEnum.PENDIENTE


def test_marcar_dos_veces_la_misma_alerta_da_409(client):
    """RN-13: una alerta que ya es normal no vuelve a decidirse."""
    headers = _headers(client)
    alerta = _alerta_alta_luz(client, headers, _inmueble(client, headers)["id"])
    assert _marcar_normal(client, headers, alerta["id"]).status_code == 200

    segunda = _marcar_normal(client, headers, alerta["id"])

    assert segunda.status_code == 409
    assert "pendiente" in segunda.json()["errores"]["general"]
    assert client.get(f"/api/alertas/{alerta['id']}", headers=headers).json()["estado"] == "NORMAL"


def test_una_alerta_confirmada_no_se_puede_marcar_normal(client, db):
    """RN-13: desde Confirmada no se pasa a Normal; el estado queda como estaba."""
    headers = _headers(client)
    alerta = _alerta_alta_luz(client, headers, _inmueble(client, headers)["id"])
    guardada = db.query(Alerta).filter(Alerta.id == alerta["id"]).one()
    guardada.estado = EstadoAlertaEnum.CONFIRMADA
    db.commit()

    res = _marcar_normal(client, headers, alerta["id"])

    assert res.status_code == 409
    db.expire_all()
    assert db.query(Alerta).one().estado == EstadoAlertaEnum.CONFIRMADA


# ======================================================================
# DET-101 · La lectura marcada se excluye hacia adelante (RN-11, RN-17)
# ======================================================================
def test_la_lectura_marcada_normal_no_integra_la_referencia_de_las_detecciones_siguientes(client):
    """RN-11: con el mismo historial, el pico marcado queda fuera y el que no se marcó sigue contando."""
    headers = _headers(client)
    marcado = _inmueble(client, headers, "Casa marcada")
    sin_marcar = _inmueble(client, headers, "Casa sin marcar")
    alerta = _alerta_alta_luz(client, headers, marcado["id"])
    _alerta_alta_luz(client, headers, sin_marcar["id"])
    assert _marcar_normal(client, headers, alerta["id"]).status_code == 200

    # La misma lectura de agosto (100 en 28 días) en los dos inmuebles.
    con_marca = _lectura(client, headers, marcado["id"], "2025-08-01", "2025-08-28", 100.0)["evaluacion"]
    sin_marca = _lectura(client, headers, sin_marcar["id"], "2025-08-01", "2025-08-28", 100.0)["evaluacion"]

    # Marcado: la referencia son solo las 6 lecturas estables (100 / 28 por día).
    assert con_marca["cantidad_referencia"] == 6
    assert con_marca["promedio"] == pytest.approx(100 / 28)
    # Sin marcar: el pico de 450 también integra la referencia y sube el promedio.
    assert sin_marca["cantidad_referencia"] == 7
    assert sin_marca["promedio"] == pytest.approx((6 * 100 + 450) / 28 / 7)


def test_marcar_normal_no_recalcula_las_alertas_ya_generadas(client, db):
    """RN-17: aplica solo hacia adelante; las demás alertas y la lectura marcada no se tocan."""
    headers = _headers(client)
    inmueble = _inmueble(client, headers)
    pico = _alerta_alta_luz(client, headers, inmueble["id"])
    agosto = _lectura(client, headers, inmueble["id"], "2025-08-01", "2025-08-28", 100.0)

    # Otra alerta pendiente con valores propios: si algo la recalculara, cambiarían.
    otra = Alerta(
        lectura_id=agosto["id"], tipo=TipoAlertaEnum.BAJA, estado=EstadoAlertaEnum.PENDIENTE,
        desvio_porcentual=-77.7, consumo_por_dia=1.11, consumo_habitual_por_dia=4.99,
    )
    db.add(otra)
    db.commit()
    otra_id = otra.id
    assert client.get(INMUEBLES, headers=headers).json()[0]["alertas_pendientes"] == 2

    assert _marcar_normal(client, headers, pico["id"]).status_code == 200

    db.expire_all()
    conservada = db.query(Alerta).filter(Alerta.id == otra_id).one()
    assert conservada.estado == EstadoAlertaEnum.PENDIENTE
    assert (conservada.desvio_porcentual, conservada.consumo_por_dia, conservada.consumo_habitual_por_dia) == (
        -77.7, 1.11, 4.99,
    )
    assert db.query(Lectura).filter(Lectura.id == pico["lectura_id"]).one().consumo == 450.0
    assert client.get(INMUEBLES, headers=headers).json()[0]["alertas_pendientes"] == 1
