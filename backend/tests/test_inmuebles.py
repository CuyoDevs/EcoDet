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
