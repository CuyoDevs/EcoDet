from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from .database import engine, Base, get_db
from .config import settings, detector_config

# Crear tablas en SQLite automáticamente al iniciar
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EcoDet API",
    description="API REST para detección de anomalías en consumo de servicios del hogar (Luz, Gas, Agua)",
    version="1.0.0"
)

# Configuración de CORS
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["General"])
def read_root():
    return {
        "proyecto": "EcoDet",
        "descripcion": "Detector de anomalías en consumo del hogar",
        "estado": "En línea",
        "documentacion": "/docs"
    }


@app.get("/api/health", tags=["Salud del Sistema"], status_code=status.HTTP_200_OK)
def health_check(db: Session = Depends(get_db)):
    """
    Endpoint para verificar la conexión a la base de datos y la carga de parámetros.
    Cumple con el criterio de aceptación de HU-01 (DET-9).
    """
    db_status = "Desconectado"
    try:
        # Prueba real de consulta sobre la BD
        db.execute(text("SELECT 1"))
        db_status = "Conectado (SQLite)"
    except Exception as e:
        db_status = f"Error: {str(e)}"

    return {
        "status": "ok" if "Conectado" in db_status else "error",
        "database": db_status,
        "detector_parameters": {
            "minimo_de_lecturas": detector_config.minimo_de_lecturas,
            "umbral_inicial_en_desvios": detector_config.umbral_inicial_en_desvios,
            "piso_del_desvio_porcentaje_del_promedio": detector_config.piso_del_desvio_porcentaje_del_promedio
        },
        "environment": settings.ENVIRONMENT
    }
