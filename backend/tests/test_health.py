from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["proyecto"] == "EcoDet"


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "SQLite" in data["database"]
    assert data["detector_parameters"]["minimo_de_lecturas"] == 6
    assert data["detector_parameters"]["umbral_inicial_en_desvios"] == 2.0
    assert data["detector_parameters"]["piso_del_desvio_porcentaje_del_promedio"] == 10.0
