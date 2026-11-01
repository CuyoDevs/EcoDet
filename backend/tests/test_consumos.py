from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_consumos_seguridad_y_exito(client_autenticado, inmueble_prueba):
    # 1. Sin token (401)
    res_401 = client.post("/api/consumos", json={"inmueble_id": 1, "servicio": "LUZ", "fecha_inicio": "2026-10-01", "fecha_fin": "2026-10-31", "consumo": 150})
    assert res_401.status_code == 401

    # 2. Creación exitosa (201)
    res_201 = client_autenticado.post("/api/consumos", json={
        "inmueble_id": inmueble_prueba.id, "servicio": "LUZ",
        "fecha_inicio": "2026-11-01", "fecha_fin": "2026-11-30", "consumo": 200
    })
    assert res_201.status_code == 201

def test_consumos_errores_negocio(client_autenticado, inmueble_prueba):
    # 3. Inmueble inexistente (404)
    res_404 = client_autenticado.post("/api/consumos", json={
        "inmueble_id": 9999, "servicio": "AGUA",
        "fecha_inicio": "2026-11-01", "fecha_fin": "2026-11-30", "consumo": 50
    })
    assert res_404.status_code == 404

    # 4. Superposición de fechas (409) - Insertamos la primera
    client_autenticado.post("/api/consumos", json={
        "inmueble_id": inmueble_prueba.id, "servicio": "GAS",
        "fecha_inicio": "2026-12-01", "fecha_fin": "2026-12-15", "consumo": 100
    })
    # Intentamos solaparla
    res_409 = client_autenticado.post("/api/consumos", json={
        "inmueble_id": inmueble_prueba.id, "servicio": "GAS",
        "fecha_inicio": "2026-12-10", "fecha_fin": "2026-12-20", "consumo": 120
    })
    assert res_409.status_code == 409

def test_consumos_fechas_invalidas(client_autenticado, inmueble_prueba):
    # 5. Fecha inicio posterior a fecha fin (422)
    res_422 = client_autenticado.post("/api/consumos", json={
        "inmueble_id": inmueble_prueba.id, "servicio": "LUZ",
        "fecha_inicio": "2026-11-30", "fecha_fin": "2026-11-01", "consumo": 150
    })
    assert res_422.status_code == 422