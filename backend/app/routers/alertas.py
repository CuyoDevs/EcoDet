from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# Ajusta las importaciones según la estructura de tu proyecto (database y models)
from ..database import get_db
from ..models import Alerta # Asegúrate de que el modelo Alerta esté definido en models.py

router = APIRouter(prefix="/api/alertas", tags=["Alertas"])

@router.get("/", response_model=List[dict])
def listar_alertas(db: Session = Depends(get_db)):
    """Obtiene la lista de todas las alertas."""
    alertas = db.query(Alerta).all()
    return alertas

@router.get("/{alerta_id}")
def obtener_detalle_alerta(alerta_id: int, db: Session = Depends(get_db)):
    """Obtiene el detalle específico de una alerta por su ID (DET-23)."""
    alerta = db.query(Alerta).filter(Alerta.id == alerta_id).first()
    if not alerta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La alerta solicitada no existe."
        )
    return alerta
