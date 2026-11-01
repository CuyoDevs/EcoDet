"DET-56 Casos de prueba con pytests"

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_crear_lectura_consumo_sin_token():

    response = client.post("/api/consumos", json={
        "inmueble_id": 1,
        "servicio": "LUZ",
        "fecha_inicio": "2026-10-01",
        "fecha_fin": "2026-10-31",
        "consumo": 150.5
    })
    assert response.status_code == 401