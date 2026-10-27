"""Pruebas de HU-02 · Registrarme (DET-35, parte backend). CU-01 · RN-01, RN-15."""
import bcrypt
import pytest
from jose import jwt

from backend.app.config import settings
from backend.app.models import Usuario

URL = "/api/auth/register"
VALIDO = {"nombre": "Laura Pérez", "correo": "laura@correo.com", "contrasena": "Clave1234"}


def registrar(client, **cambios):
    return client.post(URL, json={**VALIDO, **cambios})


# ---------- criterio 1: alta correcta ----------
def test_registro_correcto_crea_cuenta_y_devuelve_sesion(client, db):
    r = registrar(client)
    assert r.status_code == 201
    datos = r.json()
    assert datos["token_type"] == "bearer"
    assert datos["access_token"]
    assert datos["usuario"]["nombre"] == "Laura Pérez"
    assert datos["usuario"]["correo"] == "laura@correo.com"
    assert db.query(Usuario).count() == 1


def test_la_respuesta_nunca_expone_la_contrasena_ni_el_hash(client):
    texto = registrar(client).text
    assert "Clave1234" not in texto
    assert "hash" not in texto.lower()
    assert "$2b$" not in texto


def test_la_contrasena_guardada_esta_cifrada_con_bcrypt(client, db):
    registrar(client)
    guardado = db.query(Usuario).one().contrasena_hash
    assert guardado != VALIDO["contrasena"]
    assert guardado.startswith("$2")
    assert bcrypt.checkpw(VALIDO["contrasena"].encode(), guardado.encode())


def test_el_token_devuelto_identifica_al_usuario_creado(client, db):
    r = registrar(client)
    claims = jwt.decode(r.json()["access_token"], settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert claims["sub"] == str(db.query(Usuario).one().id)
    assert claims["exp"] > claims["iat"]


def test_nombre_y_correo_se_normalizan(client, db):
    registrar(client, nombre="  Laura  ", correo="  LAURA@Correo.COM ")
    u = db.query(Usuario).one()
    assert u.nombre == "Laura"
    assert u.correo == "laura@correo.com"


# ---------- criterio 2: correo repetido ----------
def test_correo_repetido_devuelve_409_y_no_crea_otra_cuenta(client, db):
    registrar(client)
    r = registrar(client, nombre="Otra Persona", contrasena="OtraClave99")
    assert r.status_code == 409
    assert "correo" in r.json()["detail"].lower()
    assert db.query(Usuario).count() == 1


def test_correo_repetido_con_otras_mayusculas_tambien_es_409(client, db):
    registrar(client)
    assert registrar(client, correo="LAURA@CORREO.COM").status_code == 409
    assert db.query(Usuario).count() == 1


# ---------- criterio 3: datos inválidos o faltantes ----------
@pytest.mark.parametrize(
    "contrasena",
    ["Ab1", "soloLetrasAqui", "123456789", "abc 12", ""],
    ids=["corta", "sin_numeros", "sin_letras", "7_caracteres", "vacia"],
)
def test_contrasena_debil_devuelve_422_indicando_el_campo(client, db, contrasena):
    r = registrar(client, contrasena=contrasena)
    assert r.status_code == 422
    assert "contrasena" in r.json()["errores"]
    assert db.query(Usuario).count() == 0


def test_contrasena_de_exactamente_8_con_letras_y_numeros_es_valida(client):
    assert registrar(client, contrasena="abcd1234").status_code == 201


def test_contrasena_de_mas_de_72_bytes_se_rechaza(client):
    assert registrar(client, contrasena="a1" * 40).status_code == 422


@pytest.mark.parametrize("correo", ["sin-arroba", "a@b", "a@@b.com", "@correo.com", "", "con espacio@correo.com"])
def test_correo_invalido_devuelve_422(client, db, correo):
    r = registrar(client, correo=correo)
    assert r.status_code == 422
    assert "correo" in r.json()["errores"]
    assert db.query(Usuario).count() == 0


@pytest.mark.parametrize("nombre", ["", "   "])
def test_nombre_vacio_devuelve_422(client, db, nombre):
    r = registrar(client, nombre=nombre)
    assert r.status_code == 422
    assert "nombre" in r.json()["errores"]
    assert db.query(Usuario).count() == 0


@pytest.mark.parametrize("campo", ["nombre", "correo", "contrasena"])
def test_campo_faltante_devuelve_422_indicando_cual(client, db, campo):
    cuerpo = {k: v for k, v in VALIDO.items() if k != campo}
    r = client.post(URL, json=cuerpo)
    assert r.status_code == 422
    assert r.json()["errores"][campo] == "Este campo es obligatorio."
    assert db.query(Usuario).count() == 0


def test_todos_los_errores_vienen_juntos(client):
    r = client.post(URL, json={"nombre": " ", "correo": "x", "contrasena": "1"})
    assert set(r.json()["errores"]) == {"nombre", "correo", "contrasena"}


def test_cuerpo_vacio_devuelve_422(client):
    assert client.post(URL, json={}).status_code == 422


# ---------- criterio 4: aislamiento (RN-01) ----------
def test_cada_cuenta_recibe_su_propia_identidad_y_sesion(client):
    a = registrar(client).json()
    b = registrar(client, nombre="Carlos", correo="carlos@correo.com").json()
    assert a["usuario"]["id"] != b["usuario"]["id"]
    assert a["access_token"] != b["access_token"]
    # La respuesta de una cuenta nueva solo contiene a esa cuenta, nunca datos de otras.
    assert "laura" not in str(b).lower()
