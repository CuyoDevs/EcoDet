from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings, BASE_DIR


def _url_de_base_de_datos(url: str) -> str:
    """Convierte una ruta SQLite relativa al CWD en absoluta dentro de `backend/`.

    Sin esto, `sqlite:///./ecodet.db` depende del directorio desde donde se lance
    uvicorn: desde `backend/` usa `backend/ecodet.db`, pero desde la raíz del repo
    usa `./ecodet.db`. Eso hacía que el backend arrancara contra otra base vacía
    (los usuarios "desaparecían" y el login/el panel dejaban de funcionar).
    """
    prefijo = "sqlite:///./"
    if url.startswith(prefijo):
        archivo = url[len(prefijo):]
        ruta_absoluta = (BASE_DIR / archivo).resolve().as_posix()
        return f"sqlite:///{ruta_absoluta}"
    return url


DATABASE_URL = _url_de_base_de_datos(settings.DATABASE_URL)

# Para SQLite necesitamos check_same_thread=False
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
