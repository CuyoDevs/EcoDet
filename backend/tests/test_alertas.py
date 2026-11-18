"""Pruebas automáticas para HU-15 (DET-23, DET-91, DET-96): Consulta, filtrado y detalle de alertas."""


def _crear_usuario_y_obtener_headers(client, correo="usuario_alertas@test.com"):
    res = client.post("/api/auth/register", json={
        "nombre": "Usuario Alertas",
        "correo": correo,
        "contrasena": "Password123",
    })
    assert res.status_code == 201
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _crear_inmueble(client, headers, nombre="Casa Alertas"):
    res = client.post(
        "/api/inmuebles/",
        json={"nombre": nombre, "direccion": "Av. San Martín 500"},
        headers=headers,
    )
    assert res.status_code == 201
    return res.json()


def _generar_alerta_alta_luz(client, headers, inmueble_id):
    """Carga 6 lecturas estables de LUZ y luego un pico anómalo que dispara una alerta ALTA/PENDIENTE."""
    lote = [
        {"servicio": "LUZ", "fecha_inicio": f"2025-0{m}-01", "fecha_fin": f"2025-0{m}-28", "consumo": 100.0}
        for m in range(1, 7)
    ]
    res_lote = client.post("/api/consumos/lote", json={"inmueble_id": inmueble_id, "lecturas": lote}, headers=headers)
    assert res_lote.status_code == 201

    res_pico = client.post("/api/consumos", json={
        "inmueble_id": inmueble_id,
        "servicio": "LUZ",
        "fecha_inicio": "2025-07-01",
        "fecha_fin": "2025-07-28",
        "consumo": 450.0,
    }, headers=headers)
    assert res_pico.status_code == 201
    alerta = res_pico.json()["alerta"]
    assert alerta is not None
    assert alerta["tipo"] == "ALTA"
    assert alerta["estado"] == "PENDIENTE"
    return alerta


def test_alertas_sin_token_da_401(client):
    """Endpoints de alertas rechazan peticiones anónimas con 401."""
    assert client.get("/api/inmuebles/1/alertas").status_code == 401
    assert client.get("/api/alertas/1").status_code == 401


def test_alertas_inmueble_inexistente_o_ajeno_da_404(client):
    """Aislamiento entre usuarios (RN-01): un inmueble ajeno o inexistente responde 404."""
    h1 = _crear_usuario_y_obtener_headers(client, "alertas_u1@test.com")
    h2 = _crear_usuario_y_obtener_headers(client, "alertas_u2@test.com")
    inmueble1 = _crear_inmueble(client, h1, "Casa U1")
    alerta1 = _generar_alerta_alta_luz(client, h1, inmueble1["id"])

    # Inmueble inexistente
    res_inexistente = client.get("/api/inmuebles/99999/alertas", headers=h1)
    assert res_inexistente.status_code == 404
    assert "general" in res_inexistente.json()["errores"]

    # Inmueble de otro usuario
    res_ajeno = client.get(f"/api/inmuebles/{inmueble1['id']}/alertas", headers=h2)
    assert res_ajeno.status_code == 404
    assert "general" in res_ajeno.json()["errores"]

    # Detalle de alerta ajena
    res_detalle_ajeno = client.get(f"/api/alertas/{alerta1['id']}", headers=h2)
    assert res_detalle_ajeno.status_code == 404
    assert "general" in res_detalle_ajeno.json()["errores"]


def test_listar_filtrar_y_detalle_alertas_inmueble(client):
    """Lista alertas con datos de lectura, filtra por servicio/estado y devuelve detalle (DET-96)."""
    headers = _crear_usuario_y_obtener_headers(client, "alertas_ok@test.com")
    inmueble = _crear_inmueble(client, headers, "Casa con Alerta")
    inmueble_id = inmueble["id"]

    # Sin alertas iniciales -> lista vacía y contador en 0
    res_vacio = client.get(f"/api/inmuebles/{inmueble_id}/alertas", headers=headers)
    assert res_vacio.status_code == 200
    assert res_vacio.json() == []

    alerta = _generar_alerta_alta_luz(client, headers, inmueble_id)

    # Listado general del inmueble
    res_lista = client.get(f"/api/inmuebles/{inmueble_id}/alertas", headers=headers)
    assert res_lista.status_code == 200
    items = res_lista.json()
    assert len(items) == 1
    assert items[0]["id"] == alerta["id"]
    assert items[0]["servicio"] == "LUZ"
    assert items[0]["fecha_inicio"] == "2025-07-01"
    assert items[0]["fecha_fin"] == "2025-07-28"
    assert items[0]["consumo"] == 450.0
    assert items[0]["tipo"] == "ALTA"
    assert items[0]["estado"] == "PENDIENTE"

    # Filtro que coincide
    res_filtro_ok = client.get(
        f"/api/inmuebles/{inmueble_id}/alertas?servicio=LUZ&estado=PENDIENTE",
        headers=headers,
    )
    assert res_filtro_ok.status_code == 200
    assert len(res_filtro_ok.json()) == 1

    # Filtro por otro servicio o estado -> vacío
    res_filtro_gas = client.get(f"/api/inmuebles/{inmueble_id}/alertas?servicio=GAS", headers=headers)
    assert res_filtro_gas.status_code == 200
    assert res_filtro_gas.json() == []

    res_filtro_conf = client.get(f"/api/inmuebles/{inmueble_id}/alertas?estado=CONFIRMADA", headers=headers)
    assert res_filtro_conf.status_code == 200
    assert res_filtro_conf.json() == []

    # Detalle individual
    res_detalle = client.get(f"/api/alertas/{alerta['id']}", headers=headers)
    assert res_detalle.status_code == 200
    detalle = res_detalle.json()
    assert detalle["id"] == alerta["id"]
    assert detalle["inmueble_id"] == inmueble_id
    assert detalle["desvio_porcentual"] > 0
    assert detalle["consumo_por_dia"] > detalle["consumo_habitual_por_dia"]


def test_inmuebles_incluye_contador_alertas_pendientes(client):
    """GET /api/inmuebles/ incluye alertas_pendientes por cada inmueble (DET-91)."""
    headers = _crear_usuario_y_obtener_headers(client, "contador_alertas@test.com")
    inm_con_alerta = _crear_inmueble(client, headers, "Casa Alerta")
    inm_normal = _crear_inmueble(client, headers, "Casa Normal")

    _generar_alerta_alta_luz(client, headers, inm_con_alerta["id"])

    res = client.get("/api/inmuebles/", headers=headers)
    assert res.status_code == 200
    por_id = {i["id"]: i for i in res.json()}
    assert por_id[inm_con_alerta["id"]]["alertas_pendientes"] == 1
    assert por_id[inm_normal["id"]]["alertas_pendientes"] == 0