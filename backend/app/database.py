from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings, BASE_DIR

db_url = settings.DATABASE_URL
# Si es una ruta SQLite relativa al directorio actual, fijarla a BASE_DIR (carpeta backend)
if db_url.startswith("sqlite:///./"):
    nombre_archivo = db_url.replace("sqlite:///./", "")
    ruta_absoluta = (BASE_DIR / nombre_archivo).resolve().as_posix()
    db_url = f"sqlite:///{ruta_absoluta}"

# Para SQLite necesitamos check_same_thread=False
connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

engine = create_engine(
    db_url,
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
