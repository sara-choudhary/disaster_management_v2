import io
import csv
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SimulationRun, Alert, NetworkEvent
from app.schemas import ReportSummary, SimulationRunResponse

router = APIRouter(prefix="/reports", tags=["Reports & Exports"])


@router.get("/summary", response_model=ReportSummary)
def get_reports_summary(db: Session = Depends(get_db)):
    """Computes aggregate analytics over persisted simulation runs and alerts."""
    runs = db.query(SimulationRun).order_by(SimulationRun.start_time.desc()).all()
    total_runs = len(runs)
    successful_runs = sum(1 for r in runs if r.outcome == "success")
    failed_runs = sum(1 for r in runs if r.outcome == "failed")
    degraded_runs = sum(1 for r in runs if r.outcome == "degraded")

    # Average recovery time
    recovery_times = [
        r.recovery_duration_ms for r in runs if r.recovery_duration_ms is not None
    ]
    avg_recovery = (
        round(sum(recovery_times) / len(recovery_times), 2) if recovery_times else None
    )

    # Average delivery ratio
    ratios = []
    for r in runs:
        if r.packet_stats:
            try:
                stats = json.loads(r.packet_stats)
                if "delivery_ratio" in stats:
                    ratios.append(float(stats["delivery_ratio"]))
            except Exception:
                pass
    avg_delivery = round(sum(ratios) / len(ratios), 4) if ratios else None

    total_alerts = db.query(Alert).count()
    critical_alerts = (
        db.query(Alert).filter(Alert.severity == "critical").count()
    )

    recent_runs = runs[:10]

    return {
        "total_runs": total_runs,
        "successful_runs": successful_runs,
        "failed_runs": failed_runs,
        "degraded_runs": degraded_runs,
        "average_recovery_time_ms": avg_recovery,
        "average_delivery_ratio": avg_delivery,
        "total_alerts": total_alerts,
        "critical_alerts": critical_alerts,
        "recent_runs": recent_runs,
    }


@router.get("/simulations/{run_id}")
def get_detailed_run_report(run_id: str, db: Session = Depends(get_db)):
    """Returns complete forensic dossier for a simulation run."""
    run = db.query(SimulationRun).filter(SimulationRun.run_id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Simulation run not found.")

    events = (
        db.query(NetworkEvent)
        .filter(NetworkEvent.simulation_run_id == run_id)
        .order_by(NetworkEvent.timestamp.asc())
        .all()
    )

    return {
        "run": run,
        "events": events,
    }


@router.get("/export/csv")
def export_simulations_csv(db: Session = Depends(get_db)):
    """Exports all persisted simulation history as a CSV file."""
    runs = db.query(SimulationRun).order_by(SimulationRun.start_time.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "Run ID",
            "Scenario Name",
            "Status",
            "Start Time (UTC)",
            "End Time (UTC)",
            "Duration (ms)",
            "Recovery Time (ms)",
            "Outcome",
            "Packets Sent",
            "Packets Delivered",
            "Packets Lost",
            "Delivery Ratio",
            "Details",
        ]
    )

    for r in runs:
        sent, deliv, lost, ratio = "N/A", "N/A", "N/A", "N/A"
        if r.packet_stats:
            try:
                ps = json.loads(r.packet_stats)
                sent = ps.get("sent", "N/A")
                deliv = ps.get("delivered", "N/A")
                lost = ps.get("lost", "N/A")
                ratio = ps.get("delivery_ratio", "N/A")
            except Exception:
                pass

        writer.writerow(
            [
                r.run_id,
                r.scenario_name,
                r.status,
                r.start_time.isoformat() if r.start_time else "",
                r.end_time.isoformat() if r.end_time else "",
                r.duration_ms or "N/A",
                r.recovery_duration_ms or "N/A",
                r.outcome,
                sent,
                deliv,
                lost,
                ratio,
                r.details or "",
            ]
        )

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="emergency_simulation_runs.csv"'
        },
    )


@router.get("/export/json")
def export_simulations_json(db: Session = Depends(get_db)):
    """Exports all persisted simulation history with complete JSON structures."""
    runs = db.query(SimulationRun).order_by(SimulationRun.start_time.desc()).all()
    results = []
    for r in runs:
        results.append(
            {
                "run_id": r.run_id,
                "scenario_name": r.scenario_name,
                "status": r.status,
                "start_time": r.start_time.isoformat() if r.start_time else None,
                "end_time": r.end_time.isoformat() if r.end_time else None,
                "duration_ms": r.duration_ms,
                "recovery_duration_ms": r.recovery_duration_ms,
                "outcome": r.outcome,
                "details": r.details,
                "initial_state": json.loads(r.initial_state) if r.initial_state else None,
                "final_state": json.loads(r.final_state) if r.final_state else None,
                "route_changes": json.loads(r.route_changes) if r.route_changes else None,
                "packet_stats": json.loads(r.packet_stats) if r.packet_stats else None,
            }
        )

    return Response(
        content=json.dumps(results, indent=2),
        media_type="application/json",
        headers={
            "Content-Disposition": 'attachment; filename="emergency_simulation_runs.json"'
        },
    )
