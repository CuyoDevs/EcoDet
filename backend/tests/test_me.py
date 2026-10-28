"""Pruebas de DET-38 · get_current_user (JWT) y GET /api/auth/me. RN-01.

Los tokens se obtienen con el registro (que ya devuelve sesión), sin depender del login.
"""
import base64
import json
import time

import pytest
from jose import jwt

from backend.app import security
from backend.app.config import settings
from backend.app.dependencies import MENSAJE_SESION_INVALIDA
from backend.app.models import Usuario

REGISTRO = "/api/auth/register"
ME = "/api/auth/me"
LAURA = {"nombre": "Laura Pérez", "correo": "laura@correo.com", "contrasena": "Clave1234"}
CARLOS = {"nombre": "Carlos Gómez", "correo": "carlos@correo.com", "contrasena": "Otra12345"}


def registrar(client, datos):
    return client.post(REGISTRO, json=datos).json()


def con_token(token):
    return {"Authorization": f"Bearer {token}"}


def assert_401_generico(r):
    assert r.status_code == 401
    assert r.json() == {"detail": MENSAJE_SESION_INVALIDA}
    assert r.headers["www-authenticate"] == "Bearer"


def _b64(datos: dict) -> str:
    return base64.urlsafe_b64encode(json.dumps(datos).encode()).rstrip(b"=").decode()


@pytest.fixture()
def laura(client):
    return registrar(client, LAURA)


# ---------- token válido ----------
def test_token_valido_devuelve_los_datos_del_usuario(client, laura):
    r = client.get(ME, headers=con_token(laura["access_token"]))
    assert r.status_code == 200
    assert r.json() == {"id": laura["usuario"]["id"], "nombre": "Laura Pérez", "correo": "laura@correo.com"}


def test_la_respuesta_nunca_expone_la_contrasena_ni_el_hash(client, laura):
    texto = client.get(ME, headers=con_token(laura["access_token"])).text
    assert "Clave1234" not in texto
    assert "hash" not in texto.lower()
    assert "$2b$" not in texto


def test_token_generado_con_security_tambien_sirve(client, laura):
    """get_current_user reutiliza security.py: cualquier token que este módulo emita es válido."""
    token = security.crear_token_acceso(laura["usuario"]["id"])
    assert client.get(ME, headers=con_token(token)).status_code == 200


# ---------- sin token ----------
def test_sin_header_authorization_devuelve_401(client, laura):
    assert_401_generico(client.get(ME))


@pytest.mark.parametrize(
    "header",
    ["Bearer", "Bearer ", "Basic abc123", "abc.def.ghi", "Token abc.def.ghi"],
    ids=["bearer_solo", "bearer_vacio", "esquema_basic", "sin_esquema", "esquema_otro"],
)
def test_header_mal_formado_devuelve_401(client, laura, header):
    assert_401_generico(client.get(ME, headers={"Authorization": header}))


# ---------- token inválido ----------
def test_token_basura_devuelve_401(client, laura):
    assert_401_generico(client.get(ME, headers=con_token("esto-no-es-un-jwt")))


def test_token_vencido_devuelve_401(client, laura):
    vencido = security.crear_token_acceso(laura["usuario"]["id"], expira_minutos=-1)
    assert_401_generico(client.get(ME, headers=con_token(vencido)))


def test_token_con_firma_adulterada_devuelve_401(client, laura):
    token = laura["access_token"]
    adulterado = token[:-2] + ("AA" if not token.endswith("AA") else "BB")
    assert_401_generico(client.get(ME, headers=con_token(adulterado)))


def test_token_firmado_con_otra_clave_devuelve_401(client, laura):
    falso = jwt.encode(
        {"sub": str(laura["usuario"]["id"]), "exp": int(time.time()) + 3600},
        "otra-clave-que-no-es-la-del-servidor",
        algorithm=settings.ALGORITHM,
    )
    assert_401_generico(client.get(ME, headers=con_token(falso)))


def test_cambiar_el_sub_de_un_token_real_no_permite_suplantar_a_otro(client, laura):
    """Se reemplaza el cuerpo del token conservando la firma original: debe fallar."""
    carlos = registrar(client, CARLOS)
    cabecera, _, firma = laura["access_token"].split(".")
    cuerpo_falso = _b64({"sub": str(carlos["usuario"]["id"]), "exp": int(time.time()) + 3600})
    assert_401_generico(client.get(ME, headers=con_token(f"{cabecera}.{cuerpo_falso}.{firma}")))


def test_token_valido_sin_sub_devuelve_401(client, laura):
    sin_sub = jwt.encode({"exp": int(time.time()) + 3600}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    assert_401_generico(client.get(ME, headers=con_token(sin_sub)))


def test_token_valido_con_sub_no_numerico_devuelve_401(client, laura):
    raro = jwt.encode({"sub": "abc", "exp": int(time.time()) + 3600}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    assert_401_generico(client.get(ME, headers=con_token(raro)))


def test_token_de_una_cuenta_inexistente_devuelve_401(client, laura):
    huerfano = security.crear_token_acceso(9999)
    assert_401_generico(client.get(ME, headers=con_token(huerfano)))


def test_token_de_una_cuenta_eliminada_devuelve_401(client, db, laura):
    db.delete(db.get(Usuario, laura["usuario"]["id"]))
    db.commit()
    assert_401_generico(client.get(ME, headers=con_token(laura["access_token"])))


# ---------- aislamiento entre usuarios (RN-01) ----------
def test_cada_token_devuelve_solo_a_su_dueno(client, laura):
    carlos = registrar(client, CARLOS)
    de_laura = client.get(ME, headers=con_token(laura["access_token"])).json()
    de_carlos = client.get(ME, headers=con_token(carlos["access_token"])).json()
    assert de_laura["correo"] == "laura@correo.com"
    assert de_carlos["correo"] == "carlos@correo.com"
    assert "carlos" not in str(de_laura).lower()
    assert "laura" not in str(de_carlos).lower()
