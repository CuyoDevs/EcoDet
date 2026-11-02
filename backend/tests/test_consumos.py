"""Pruebas automáticas para HU-08 (DET-16): Cargar una lectura de consumo."""
from datetime import date, timedelta


def _crear_usuario_y_obtener_headers(client, correo="usuario_consumo@test.com"):
    res = client.post("/api/auth/register", json={
        "nombre": "Usuario Consumo",
        "correo": correo,
        "contrasena": "Password123"
    })
    assert res.status_code == 201
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _crear_inmueble(client, headers, nombre="Casa Consumo"):
    res = client.post("/api/inmuebles/", json={"nombre": nombre, "direccion": "Av. San Martín 100"}, headers=headers)
    assert res.status_code == 201
    return res.json()


def test_consumo_sin_token_da_401(client):
    """Petición anónima debe ser rechazada con 401."""
    res = client.post("/api/consumos", json={
        "inmueble_id": 1,
        "servicio": "LUZ",
        "fecha_inicio": "2026-09-01",
        "fecha_fin": "2026-09-30",
        "consumo": 150
    })
    assert res.status_code == 401


def test_consumo_exitoso_luz_gas_agua(client):
    """Carga exitosa para los tres servicios (luz, gas y agua opcional, RN-02 y RN-04)."""
    headers = _crear_usuario_y_obtener_headers(client, "servicios@test.com")
    inmueble = _crear_inmueble(client, headers)
    inmueble_id = inmueble["id"]

    ayer = (date.today() - timedelta(days=1)).isoformat()
    hoy = date.today().isoformat()

    # 1. Luz (kWh)
    res_luz = client.post("/api/consumos", json={
        "inmueble_id": inmueble_id,
        "servicio": "LUZ",
        "fecha_inicio": "2026-08-01",
        "fecha_fin": "2026-08-31",
        "consumo": 120.5
    }, headers=headers)
    assert res_luz.status_code == 201
    assert res_luz.json()["consumo"] == 120.5
    assert res_luz.json()["servicio"] == "LUZ"

    # 2. Gas (m3)
    res_gas = client.post("/api/consumos", json={
        "inmueble_id": inmueble_id,
        "servicio": "GAS",
        "fecha_inicio": "2026-08-01",
        "fecha_fin": "2026-08-31",
        "consumo": 45.0
    }, headers=headers)
    assert res_gas.status_code == 201
    assert res_gas.json()["consumo"] == 45.0
    assert res_gas.json()["servicio"] == "GAS"

    # 3. Agua (m3)
    res_agua = client.post("/api/consumos", json={
        "inmueble_id": inmueble_id,
        "servicio": "AGUA",
        "fecha_inicio": "2026-08-01",
        "fecha_fin": "2026-08-31",
        "consumo": 15.0
    }, headers=headers)
    assert res_agua.status_code == 201
    assert res_agua.json()["consumo"] == 15.0
    assert res_agua.json()["servicio"] == "AGUA"


def test_consumo_inmueble_inexistente_o_ajeno_da_404(client):
    """No permite cargar lecturas en inmuebles inexistentes o de otros usuarios (RN-01)."""
    headers1 = _crear_usuario_y_obtener_headers(client, "usuario1@test.com")
    headers2 = _crear_usuario_y_obtener_headers(client, "usuario2@test.com")

    inmueble1 = _crear_inmueble(client, headers1, "Casa de U1")

    # Inmueble que no existe
    res_no_existe = client.post("/api/consumos", json={
        "inmueble_id": 99999,
        "servicio": "LUZ",
        "fecha_inicio": "2026-09-01",
        "fecha_fin": "2026-09-30",
        "consumo": 100
    }, headers=headers1)
    assert res_no_existe.status_code == 404
    assert "inmueble_id" in res_no_existe.json()["errores"]

    # Inmueble de otro usuario (usuario2 intentando cargar en inmueble de usuario1)
    res_ajeno = client.post("/api/consumos", json={
        "inmueble_id": inmueble1["id"],
        "servicio": "LUZ",
        "fecha_inicio": "2026-09-01",
        "fecha_fin": "2026-09-30",
        "consumo": 100
    }, headers=headers2)
    assert res_ajeno.status_code == 404
    assert "inmueble_id" in res_ajeno.json()["errores"]


def test_consumo_superposicion_periodos_da_409(client):
    """Períodos superpuestos para el mismo servicio en el mismo inmueble dan 409 (RN-14)."""
    headers = _crear_usuario_y_obtener_headers(client, "superposicion@test.com")
    inmueble = _crear_inmueble(client, headers)
    inmueble_id = inmueble["id"]

    # 1. Crear lectura base (01/08 al 31/08)
    res_base = client.post("/api/consumos", json={
        "inmueble_id": inmueble_id,
        "servicio": "GAS",
        "fecha_inicio": "2026-08-01",
        "fecha_fin": "2026-08-31",
        "consumo": 100
    }, headers=headers)
    assert res_base.status_code == 201

    # 2. Solapamiento parcial (15/08 al 15/09)
    res_solape1 = client.post("/api/consumos", json={
        "inmueble_id": inmueble_id,
        "servicio": "GAS",
        "fecha_inicio": "2026-08-15",
        "fecha_fin": "2026-09-15",
        "consumo": 80
    }, headers=headers)
    assert res_solape1.status_code == 409
    assert "fecha_inicio" in res_solape1.json()["errores"]

    # 3. Solapamiento idéntico
    res_solape2 = client.post("/api/consumos", json={
        "inmueble_id": inmueble_id,
        "servicio": "GAS",
        "fecha_inicio": "2026-08-01",
        "fecha_fin": "2026-08-31",
        "consumo": 90
    }, headers=headers)
    assert res_solape2.status_code == 409

    # 4. Mismo período pero OTRO servicio (LUZ) -> DEBE PERMITIRSE
    res_otro_servicio = client.post("/api/consumos", json={
        "inmueble_id": inmueble_id,
        "servicio": "LUZ",
        "fecha_inicio": "2026-08-01",
        "fecha_fin": "2026-08-31",
        "consumo": 200
    }, headers=headers)
    assert res_otro_servicio.status_code == 201


def test_consumo_validaciones_de_esquema(client):
    """Consumo negativo, fechas invertidas o futuras devuelven 422 (RN-03, RN-05)."""
    headers = _crear_usuario_y_obtener_headers(client, "validaciones@test.com")
    inmueble = _crear_inmueble(client, headers)
    inmueble_id = inmueble["id"]

    # Consumo negativo
    res_negativo = client.post("/api/consumos", json={
        "inmueble_id": inmueble_id,
        "servicio": "LUZ",
        "fecha_inicio": "2026-07-01",
        "fecha_fin": "2026-07-31",
        "consumo": -10
    }, headers=headers)
    assert res_negativo.status_code == 422

    # Fecha fin anterior a fecha inicio
    res_fechas_invertidas = client.post("/api/consumos", json={
        "inmueble_id": inmueble_id,
        "servicio": "LUZ",
        "fecha_inicio": "2026-07-31",
        "fecha_fin": "2026-07-01",
        "consumo": 50
    }, headers=headers)
    assert res_fechas_invertidas.status_code == 422

    # Consumo 0 es válido (RN-05)
    res_cero = client.post("/api/consumos", json={
        "inmueble_id": inmueble_id,
        "servicio": "LUZ",
        "fecha_inicio": "2026-07-01",
        "fecha_fin": "2026-07-31",
        "consumo": 0
    }, headers=headers)
    assert res_cero.status_code == 201
