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
