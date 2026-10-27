"""Fixtures compartidas. Las pruebas usan SQLite en memoria: nunca tocan `ecodet.db`."""
import os

# Debe ir ANTES de importar la app: evita que el import cree/abra el archivo real ecodet.db.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["ENVIRONMENT"] = "development"
os.environ["SECRET_KEY"] = "clave-solo-para-pruebas-automaticas-0123456789"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base, get_db
from backend.app.main import app


@pytest.fixture()
def db_engine():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture()
def db(db_engine):
    """Sesión para inspeccionar lo que quedó guardado."""
    sesion = sessionmaker(bind=db_engine, autocommit=False, autoflush=False)()
    yield sesion
    sesion.close()


@pytest.fixture()
def client(db_engine):
    Sesion = sessionmaker(bind=db_engine, autocommit=False, autoflush=False)

    def _get_db_de_prueba():
        sesion = Sesion()
        try:
            yield sesion
        finally:
            sesion.close()

    app.dependency_overrides[get_db] = _get_db_de_prueba
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
