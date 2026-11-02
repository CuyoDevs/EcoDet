def test_crear_inmueble_exito(client, db):
    # 1. Registrar usuario (devuelve 201 y el token directamente)
    auth_res = client.post("/api/auth/register", json={
        "nombre": "Test", 
        "correo": "test@eco.com", 
        "contrasena": "Password123"
    })
    assert auth_res.status_code == 201, f"Error al registrar: {auth_res.text}"
    
    token = auth_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Intentar crear el inmueble
    datos = {"nombre": "Casa Norte", "direccion": "Ruta 40"}
    response = client.post("/api/inmuebles/", json=datos, headers=headers)

    # 3. Validar
    assert response.status_code in [200, 201]
    data = response.json()
    assert data["nombre"] == "Casa Norte"
    assert data["direccion"] == "Ruta 40"

def test_crear_inmueble_duplicado_da_error_409(client):
    # 1. Registrar usuario de prueba y obtener token
    auth_res = client.post("/api/auth/register", json={
        "nombre": "Test2", 
        "correo": "test2@eco.com", 
        "contrasena": "Password123"
    })
    assert auth_res.status_code == 201
    
    headers = {"Authorization": f"Bearer {auth_res.json()['access_token']}"}

    # 2. Crear el primer inmueble
    client.post("/api/inmuebles/", json={"nombre": "Local Único", "direccion": ""}, headers=headers)

    # 3. Intentar crear otro con el MISMO nombre
    response = client.post("/api/inmuebles/", json={"nombre": "Local Único", "direccion": "Otra calle"}, headers=headers)
    
    # 4. Validar que el servidor lo rechaza con 409
    assert response.status_code == 409

def test_crear_inmueble_sin_token_da_error_401(client):
    # Enviar petición sin credenciales
    response = client.post("/api/inmuebles/", json={"nombre": "Galpón", "direccion": ""})
    
    # Validar que rebote por seguridad
    assert response.status_code == 401


# ---- DET-48: casos que faltaban (422, aislamiento entre usuarios, listado) ----

def _headers(client, correo, nombre="Test"):
    r = client.post("/api/auth/register", json={
        "nombre": nombre, "correo": correo, "contrasena": "Password123"})
    assert r.status_code == 201, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_crear_inmueble_nombre_vacio_da_error_422(client):
    headers = _headers(client, "vacio@eco.com")
    for nombre in ["", "   "]:
        r = client.post("/api/inmuebles/", json={"nombre": nombre}, headers=headers)
        assert r.status_code == 422
        assert r.json()["errores"]["nombre"]  # formato errores: {campo: mensaje}
    assert client.get("/api/inmuebles/", headers=headers).json() == []  # no se creó nada


def test_el_mismo_nombre_se_permite_en_otro_usuario(client):
    h_a = _headers(client, "a1@eco.com")
    h_b = _headers(client, "b1@eco.com")
    assert client.post("/api/inmuebles/", json={"nombre": "Casa"}, headers=h_a).status_code == 201
    assert client.post("/api/inmuebles/", json={"nombre": "Casa"}, headers=h_b).status_code == 201


def test_listar_inmuebles_devuelve_los_del_usuario_en_orden(client):
    headers = _headers(client, "lista@eco.com")
    assert client.get("/api/inmuebles/", headers=headers).json() == []
    client.post("/api/inmuebles/", json={"nombre": "Casa"}, headers=headers)
    client.post("/api/inmuebles/", json={"nombre": "Casa de mamá", "direccion": "Luján"}, headers=headers)
    lista = client.get("/api/inmuebles/", headers=headers).json()
    assert [i["nombre"] for i in lista] == ["Casa", "Casa de mamá"]  # más de un inmueble
    assert lista[1]["direccion"] == "Luján"


def test_un_usuario_no_ve_los_inmuebles_de_otro(client):
    """RN-01: cada usuario ve solo sus propios datos."""
    h_a = _headers(client, "a2@eco.com", "A")
    h_b = _headers(client, "b2@eco.com", "B")
    client.post("/api/inmuebles/", json={"nombre": "Casa A"}, headers=h_a)
    assert [i["nombre"] for i in client.get("/api/inmuebles/", headers=h_a).json()] == ["Casa A"]
    assert client.get("/api/inmuebles/", headers=h_b).json() == []


def test_listar_inmuebles_sin_token_da_error_401(client):
    assert client.get("/api/inmuebles/").status_code == 401


# ---- DET-14 / HU-06: editar un inmueble (PUT /api/inmuebles/{id}) ----

def _crear(client, headers, nombre, direccion=None):
    body = {"nombre": nombre}
    if direccion is not None:
        body["direccion"] = direccion
    r = client.post("/api/inmuebles/", json=body, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


def test_editar_inmueble_exito_guarda_y_persiste(client):
    h = _headers(client, "edit1@eco.com")
    inm = _crear(client, h, "Casa", "Calle 1")
    r = client.put(f"/api/inmuebles/{inm['id']}", json={"nombre": "  Casa Norte  ", "direccion": "Ruta 40"}, headers=h)
    assert r.status_code == 200, r.text
    assert r.json()["id"] == inm["id"]
    assert r.json()["nombre"] == "Casa Norte"  # se recorta, igual que al crear
    assert r.json()["direccion"] == "Ruta 40"
    lista = client.get("/api/inmuebles/", headers=h).json()
    assert [(i["nombre"], i["direccion"]) for i in lista] == [("Casa Norte", "Ruta 40")]


def test_editar_inmueble_conservando_su_propio_nombre_no_da_409(client):
    h = _headers(client, "edit2@eco.com")
    inm = _crear(client, h, "Casa", "Calle 1")
    r = client.put(f"/api/inmuebles/{inm['id']}", json={"nombre": "Casa", "direccion": "Calle 2"}, headers=h)
    assert r.status_code == 200
    assert r.json()["direccion"] == "Calle 2"


def test_editar_inmueble_nombre_de_otro_inmueble_propio_da_409(client):
    h = _headers(client, "edit3@eco.com")
    _crear(client, h, "Casa")
    otro = _crear(client, h, "Depto")
    r = client.put(f"/api/inmuebles/{otro['id']}", json={"nombre": "Casa"}, headers=h)
    assert r.status_code == 409
    assert r.json()["errores"]["nombre"]
    nombres = [i["nombre"] for i in client.get("/api/inmuebles/", headers=h).json()]
    assert nombres == ["Casa", "Depto"]  # no cambió nada


def test_editar_inmueble_nombre_vacio_da_422_y_no_modifica(client):
    h = _headers(client, "edit4@eco.com")
    inm = _crear(client, h, "Casa", "Calle 1")
    for nombre in ["", "   "]:
        r = client.put(f"/api/inmuebles/{inm['id']}", json={"nombre": nombre, "direccion": "X"}, headers=h)
        assert r.status_code == 422
        assert r.json()["errores"]["nombre"]
    assert client.get("/api/inmuebles/", headers=h).json()[0]["direccion"] == "Calle 1"


def test_editar_inmueble_de_otro_usuario_da_404_y_no_lo_modifica(client):
    """RN-01: un usuario no puede editar (ni saber que existe) el inmueble de otro."""
    h_a = _headers(client, "edit5a@eco.com", "A")
    h_b = _headers(client, "edit5b@eco.com", "B")
    inm = _crear(client, h_a, "Casa A", "Calle A")
    r = client.put(f"/api/inmuebles/{inm['id']}", json={"nombre": "Hackeado"}, headers=h_b)
    assert r.status_code == 404
    assert client.get("/api/inmuebles/", headers=h_a).json()[0]["nombre"] == "Casa A"


def test_editar_inmueble_inexistente_da_404(client):
    h = _headers(client, "edit6@eco.com")
    assert client.put("/api/inmuebles/9999", json={"nombre": "X"}, headers=h).status_code == 404


def test_editar_inmueble_sin_token_da_401(client):
    assert client.put("/api/inmuebles/1", json={"nombre": "X"}).status_code == 401


def test_editar_inmueble_no_modifica_lecturas_ni_alertas(client, db):
    """HU-06, criterio 2: editar nombre/dirección deja intactas las lecturas y alertas del inmueble."""
    from datetime import date
    from backend.app.models import Alerta, Lectura, TipoAlertaEnum, ServicioEnum

    h = _headers(client, "edit7@eco.com")
    inm = _crear(client, h, "Casa", "Calle 1")
    lectura = Lectura(inmueble_id=inm["id"], servicio=ServicioEnum.LUZ,
                      fecha_inicio=date(2026, 1, 1), fecha_fin=date(2026, 1, 31), consumo=120.5)
    db.add(lectura)
    db.commit()
    db.add(Alerta(lectura_id=lectura.id, tipo=TipoAlertaEnum.ALTA, desvio_porcentual=40.0,
                  consumo_por_dia=3.9, consumo_habitual_por_dia=2.8))
    db.commit()

    r = client.put(f"/api/inmuebles/{inm['id']}", json={"nombre": "Casa Nueva", "direccion": "Otra"}, headers=h)
    assert r.status_code == 200

    db.expire_all()
    lecturas = db.query(Lectura).filter(Lectura.inmueble_id == inm["id"]).all()
    assert [(l.id, l.consumo, l.fecha_inicio, l.fecha_fin) for l in lecturas] == [
        (lectura.id, 120.5, date(2026, 1, 1), date(2026, 1, 31))]
    alertas = db.query(Alerta).all()
    assert len(alertas) == 1 and alertas[0].lectura_id == lectura.id and alertas[0].desvio_porcentual == 40.0
