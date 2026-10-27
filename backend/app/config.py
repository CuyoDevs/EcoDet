import json
import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

# Clave por defecto SOLO para desarrollo local. Fuera de "development" no se acepta (ver security.py).
SECRET_KEY_DE_DESARROLLO = "dev_secret_key_ecodet_2026_scrum"
CONFIG_JSON_PATH = BASE_DIR / "config.json"


class SystemDetectorSettings:
    def __init__(self, filepath: Path = CONFIG_JSON_PATH):
        if filepath.exists():
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
        else:
            data = {}
        
        self.minimo_de_lecturas: int = int(data.get("minimo_de_lecturas", 6))
        self.umbral_inicial_en_desvios: float = float(data.get("umbral_inicial_en_desvios", 2.0))
        self.piso_del_desvio_porcentaje_del_promedio: float = float(data.get("piso_del_desvio_porcentaje_del_promedio", 10.0))


class AppSettings(BaseSettings):
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "sqlite:///./ecodet.db"
    SECRET_KEY: str = SECRET_KEY_DE_DESARROLLO
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = AppSettings()
detector_config = SystemDetectorSettings()
