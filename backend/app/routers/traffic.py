from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import TrafficClass
from app.schemas import (
    TrafficClassResponse,
    TrafficSimulationRequest,
    TrafficSimulationResponse,
)
from app.services.qos import QoSEngine

router = APIRouter(prefix="/traffic", tags=["Traffic & QoS Priority"])


@router.get("/classes", response_model=List[TrafficClassResponse])
def get_traffic_classes(db: Session = Depends(get_db)):
    """Returns the 4 traffic priority classes (Critical, High, Normal, Low) and scheduler weights."""
    return db.query(TrafficClass).order_by(TrafficClass.priority_level.asc()).all()


@router.post("/simulate", response_model=TrafficSimulationResponse)
def simulate_traffic_endpoint(
    payload: TrafficSimulationRequest, db: Session = Depends(get_db)
):
    """
    Executes a deterministic traffic simulation along the calculated path.
    Models congestion, queue delay, and strict priority preferential service for Critical packets.
    """
    qos = QoSEngine(db)
    result = qos.simulate_traffic(
        source_department=payload.source_department,
        destination_department=payload.destination_department,
        traffic_class=payload.traffic_class,
        packet_count=payload.packet_count,
        offered_load_mbps=payload.offered_load_mbps,
        duration_seconds=payload.duration_seconds,
    )
    return result
