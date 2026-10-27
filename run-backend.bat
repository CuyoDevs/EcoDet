@echo off
echo =======================================
echo Iniciando Backend EcoDet (FastAPI)...
echo =======================================
cd backend
if not exist .env (
    echo Creando archivo .env desde .env.example...
    copy .env.example .env
)
python -m uvicorn app.main:app --reload --port 8000
