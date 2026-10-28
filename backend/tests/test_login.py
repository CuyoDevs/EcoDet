"""Pruebas de HU-03 · Iniciar sesión (DET-37, parte backend). CU-02 · RN-01."""
import pytest
from jose import jwt

from backend.app.config import settings
from backend.app.models import Usuario

REGISTRO = "/api/auth/register"
LOGIN = "/api/auth/login"
VALIDO = {"nombre": "Laura Pérez", "correo": "laura@correo.com", "contrasena": "Clave1234"}
MENSAJE_GENERICO = "Correo o contraseña incorrectos."


def registrar(client, **cambios):
    return client.post(REGISTRO, json={**VALIDO, **cambios})


def entrar(client, **cambios):
    datos = {"correo": VALIDO["correo"], "contrasena": VALIDO["contrasena"]}
    return client.post(LOGIN, json={**datos, **cambios})


@pytest.fixture()
def cuenta(client):
    """Una cuenta ya registrada (la respuesta del registro, con su id)."""
    return registrar(client).json()


# ---------- criterio 1: credenciales correctas ----------
def test_login_correcto_devuelve_token_y_usuario(client, cuenta):
    r = entrar(client)
    assert r.status_code == 200
    datos = r.json()
    assert datos["token_type"] == "bearer"
    assert datos["access_token"]
    assert datos["usuario"] == {"id": cuenta["usuario"]["id"], "nombre": "Laura Pérez", "correo": "laura@correo.com"}


def test_el_token_identifica_al_usuario_que_entro(client, cuenta):
    token = entrar(client).json()["access_token"]
    claims = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert claims["sub"] == str(cuenta["usuario"]["id"])
    assert claims["exp"] > claims["iat"]


def test_el_correo_se_normaliza_al_entrar(client, cuenta):
    assert entrar(client, correo="  LAURA@Correo.COM ").status_code == 200


def test_la_respuesta_nunca_expone_la_contrasena_ni_el_hash(client, cuenta):
    texto = entrar(client).text
    assert "Clave1234" not in texto
    assert "hash" not in texto.lower()
    assert "$2b$" not in texto


def test_entrar_no_crea_ni_modifica_cuentas(client, cuenta, db):
    antes = db.query(Usuario).one().contrasena_hash
    entrar(client)
    entrar(client, contrasena="Equivocada1")
    assert db.query(Usuario).count() == 1
    db.expire_all()
    assert db.query(Usuario).one().contrasena_hash == antes


# ---------- criterio 2: credenciales incorrectas -> error genérico ----------
@pytest.mark.parametrize(
    "cambios",
    [
        {"contrasena": "Equivocada1"},
        {"correo": "nadie@correo.com"},
        {"correo": "esto-no-es-un-correo"},
        {"contrasena": "Clave1234" + "z" * 80},  # más de 72 bytes
        {"contrasena": "clave1234"},  # mayúsculas distintas
    ],
    ids=["contrasena_mala", "correo_inexistente", "correo_mal_formado", "contrasena_larguisima", "mayusculas"],
)
def test_credenciales_incorrectas_devuelven_401_con_mensaje_generico(client, cuenta, cambios):
    r = entrar(client, **cambios)
    assert r.status_code == 401
    assert r.json() == {"detail": MENSAJE_GENERICO}


def test_el_error_es_identico_si_falla_el_correo_o_la_contrasena(client, cuenta):
    """No se puede deducir si un correo existe: ambas respuestas son byte a byte iguales."""
    contrasena_mala = entrar(client, contrasena="Equivocada1")
    correo_inexistente = entrar(client, correo="nadie@correo.com")
    assert contrasena_mala.status_code == correo_inexistente.status_code == 401
    assert contrasena_mala.text == correo_inexistente.text


def test_el_mensaje_no_revela_que_dato_fallo(client, cuenta):
    mensaje = entrar(client, contrasena="Equivocada1").json()["detail"].lower()
    assert "no existe" not in mensaje
    assert "no está registrado" not in mensaje


def test_el_401_no_entrega_token(client, cuenta):
    assert "access_token" not in entrar(client, contrasena="Equivocada1").text


# ---------- criterio 3: campos vacíos o faltantes ----------
@pytest.mark.parametrize(
    "cuerpo, campos",
    [
        ({"correo": "", "contrasena": ""}, {"correo", "contrasena"}),
        ({"correo": "   ", "contrasena": "Clave1234"}, {"correo"}),
        ({"correo": "laura@correo.com", "contrasena": ""}, {"contrasena"}),
    ],
    ids=["ambos_vacios", "correo_en_blanco", "contrasena_vacia"],
)
def test_campos_vacios_devuelven_422_indicando_cuales(client, cuenta, cuerpo, campos):
    r = client.post(LOGIN, json=cuerpo)
    assert r.status_code == 422
    assert set(r.json()["errores"]) == campos


@pytest.mark.parametrize("campo", ["correo", "contrasena"])
def test_campo_faltante_devuelve_422_indicando_cual(client, cuenta, campo):
    cuerpo = {"correo": VALIDO["correo"], "contrasena": VALIDO["contrasena"]}
    del cuerpo[campo]
    r = client.post(LOGIN, json=cuerpo)
    assert r.status_code == 422
    assert r.json()["errores"][campo] == "Este campo es obligatorio."


def test_cuerpo_vacio_devuelve_422(client):
    assert client.post(LOGIN, json={}).status_code == 422


# ---------- aislamiento entre usuarios (RN-01) ----------
def test_cada_cuenta_entra_con_su_propia_identidad(client, cuenta):
    otra = registrar(client, nombre="Carlos", correo="carlos@correo.com", contrasena="Otra12345").json()
    a = entrar(client).json()
    b = entrar(client, correo="carlos@correo.com", contrasena="Otra12345").json()
    assert a["usuario"]["id"] == cuenta["usuario"]["id"]
    assert b["usuario"]["id"] == otra["usuario"]["id"]
    assert a["access_token"] != b["access_token"]
    assert "carlos" not in str(a).lower()


def test_la_contrasena_de_una_cuenta_no_abre_otra(client, cuenta):
    registrar(client, nombre="Carlos", correo="carlos@correo.com", contrasena="Otra12345")
    assert entrar(client, correo="carlos@correo.com").status_code == 401  # con la clave de Laura
