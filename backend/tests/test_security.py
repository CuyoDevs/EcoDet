"""Pruebas del módulo reutilizable de seguridad (hash y JWT)."""
import pytest
from jose import JWTError

from backend.app import security
from backend.app.config import SECRET_KEY_DE_DESARROLLO, settings


def test_hash_distinto_en_cada_llamada_pero_ambos_verifican():
    h1, h2 = security.hashear_contrasena("Clave1234"), security.hashear_contrasena("Clave1234")
    assert h1 != h2
    assert security.verificar_contrasena("Clave1234", h1)
    assert security.verificar_contrasena("Clave1234", h2)


def test_verificar_rechaza_contrasena_incorrecta_y_hash_roto():
    h = security.hashear_contrasena("Clave1234")
    assert not security.verificar_contrasena("otraClave1", h)
    assert not security.verificar_contrasena("Clave1234", "esto-no-es-un-hash")


def test_token_ida_y_vuelta():
    claims = security.decodificar_token(security.crear_token_acceso(42))
    assert claims["sub"] == "42"


def test_token_vencido_se_rechaza():
    with pytest.raises(JWTError):
        security.decodificar_token(security.crear_token_acceso(1, expira_minutos=-1))


def test_token_adulterado_se_rechaza():
    token = security.crear_token_acceso(1)
    with pytest.raises(JWTError):
        security.decodificar_token(token[:-2] + ("AA" if not token.endswith("AA") else "BB"))


def test_fuera_de_desarrollo_no_se_acepta_la_clave_por_defecto(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "SECRET_KEY", SECRET_KEY_DE_DESARROLLO)
    with pytest.raises(RuntimeError):
        security.crear_token_acceso(1)
