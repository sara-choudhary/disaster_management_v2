from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Scenario, SimulationRun
from app.schemas import (
    ScenarioResponse,
    ScenarioCreate,
    SimulationRunResponse,
    SimulationRunCreate,
)
from app.services.simulation import SimulationService

router = APIRouter(tags=["Scenarios & Simulations"])


@router.get("/scenarios", response_model=List[ScenarioResponse])
def get_all_scenarios(db: Session = Depends(get_db)):
    """Returns all 6 predefined disaster scenarios."""
    return db.query(Scenario).all()


@router.post("/scenarios", response_model=ScenarioResponse, status_code=201)
def create_scenario(payload: ScenarioCreate, db: Session = Depends(get_db)):
    """Creates a custom emergency scenario."""
    existing = (
        db.query(Scenario)
        .filter(Scenario.scenario_key == payload.scenario_key)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Scenario key already exists.")

    scenario = Scenario(**payload.dict())
    db.add(scenario)
    db.commit()
    db.refresh(scenario)
    return scenario


@router.get("/scenarios/{scenario_id}", response_model=ScenarioResponse)
def get_scenario_by_id(scenario_id: int, db: Session = Depends(get_db)):
    """Returns details of a specific scenario."""
    sc = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not sc:
        raise HTTPException(status_code=404, detail="Scenario not found.")
    return sc


@router.post("/simulations", response_model=SimulationRunResponse, status_code=201)
def execute_simulation(payload: SimulationRunCreate, db: Session = Depends(get_db)):
    """Runs a scenario, calculates route changes, measures recovery, and persists the result."""
    service = SimulationService(db)
    try:
        run = service.execute_scenario(payload.scenario_key)
        return run
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


@router.get("/simulations", response_model=List[SimulationRunResponse])
def get_all_simulations(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Returns persistent history of simulation runs ordered by start time descending."""
    return (
        db.query(SimulationRun)
        .order_by(SimulationRun.start_time.desc())
        .limit(limit)
        .all()
    )


@router.get("/simulations/{run_id}", response_model=SimulationRunResponse)
def get_simulation_run(run_id: str, db: Session = Depends(get_db)):
    """Returns full forensic report and initial/final states of a specific run."""
    run = (
        db.query(SimulationRun)
        .filter(SimulationRun.run_id == run_id)
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail=f"Simulation run '{run_id}' not found.")
    return run


@router.post("/simulations/{run_id}/stop")
def cancel_simulation_run(run_id: str, db: Session = Depends(get_db)):
    """Cancels or terminates an active simulation run."""
    run = (
        db.query(SimulationRun)
        .filter(SimulationRun.run_id == run_id)
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail="Simulation run not found.")

    if run.status == "running":
        run.status = "cancelled"
        run.end_time = datetime.utcnow()
        db.commit()

    return {"message": f"Simulation run '{run_id}' status updated to {run.status}."}
