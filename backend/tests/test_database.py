"""Pruebas de la resolución de la ruta de SQLite (regresión del bug de CWD).

Si `DATABASE_URL` es relativa (`sqlite:///./ecodet.db`), el motor debe apuntar
siempre a `backend/ecodet.db`, sin importar desde qué directorio se lance uvicorn.
"""
from backend.app.config import BASE_DIR
from backend.app.database import _url_de_base_de_datos


def test_url_sqlite_relativa_se_resuelve_dentro_de_backend():
    assert _url_de_base_de_datos("sqlite:///./ecodet.db") == (
        f"sqlite:///{(BASE_DIR / 'ecodet.db').resolve().as_posix()}"
    )


def test_url_sqlite_en_memoria_no_se_modifica():
    assert _url_de_base_de_datos("sqlite://") == "sqlite://"


def test_url_no_sqlite_no_se_modifica():
    url = "postgresql://usuario:clave@localhost:5432/ecodet"
    assert _url_de_base_de_datos(url) == url
