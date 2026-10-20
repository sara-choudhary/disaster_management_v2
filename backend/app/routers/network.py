from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import NetworkNode, NetworkLink, Department
from app.schemas import (
    NetworkNodeResponse,
    NetworkLinkResponse,
    DepartmentResponse,
    TopologyResponse,
    RouteResult,
)
from app.services.routing import RoutingEngine
from app.services.simulation import SimulationService

router = APIRouter(prefix="/network", tags=["Network & Topology"])


@router.get("/topology", response_model=TopologyResponse)
def get_topology(db: Session = Depends(get_db)):
    """Returns complete network topology with all nodes, links, departments, and live health metrics."""
    nodes = db.query(NetworkNode).all()
    links = db.query(NetworkLink).all()
    departments = db.query(Department).all()

    routing = RoutingEngine(db)
    reachability = routing.evaluate_all_department_reachability()

    active_links_count = sum(1 for l in links if l.status == "up")
    active_nodes_count = sum(1 for n in nodes if n.status == "healthy")

    metrics = {
        "total_nodes": len(nodes),
        "active_nodes": active_nodes_count,
        "total_links": len(links),
        "active_links": active_links_count,
        "department_reachability_pct": reachability["availability_percentage"],
        "is_fully_connected": reachability["is_fully_connected"],
        "unreachable_pairs": reachability["unreachable_pairs"],
    }

    return {
        "nodes": nodes,
        "links": links,
        "departments": departments,
        "metrics": metrics,
    }


@router.get("/nodes", response_model=List[NetworkNodeResponse])
def get_nodes(db: Session = Depends(get_db)):
    """Returns all network nodes (routers, switches, servers, endpoints)."""
    return db.query(NetworkNode).all()


@router.get("/links", response_model=List[NetworkLinkResponse])
def get_links(db: Session = Depends(get_db)):
    """Returns all network links with status, bandwidth, latency, and cost."""
    return db.query(NetworkLink).all()


@router.get("/departments", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    """Returns all 7 emergency departments with subnets, gateways, and VLAN IDs."""
    return db.query(Department).all()


@router.get("/routes", response_model=RouteResult)
def calculate_route(
    source: str = Query(..., description="Source node device_id or department name"),
    destination: str = Query(..., description="Destination node device_id or department name"),
    db: Session = Depends(get_db),
):
    """Calculates lowest-cost path using Dijkstra's algorithm (OSPF-inspired link-state calculation)."""
    engine = RoutingEngine(db)
    result = engine.dijkstra_shortest_path(source, destination)
    return result


@router.get("/metrics")
def get_network_metrics(db: Session = Depends(get_db)):
    """Returns current network availability, link counts, and reachability."""
    nodes = db.query(NetworkNode).all()
    links = db.query(NetworkLink).all()
    routing = RoutingEngine(db)
    reachability = routing.evaluate_all_department_reachability()

    return {
        "total_nodes": len(nodes),
        "healthy_nodes": sum(1 for n in nodes if n.status == "healthy"),
        "failed_nodes": sum(1 for n in nodes if n.status == "failed"),
        "total_links": len(links),
        "active_links": sum(1 for l in links if l.status == "up"),
        "down_links": sum(1 for l in links if l.status == "down"),
        "availability_percentage": reachability["availability_percentage"],
        "is_fully_connected": reachability["is_fully_connected"],
    }


# Failure Injection & Restoration Endpoints
@router.post("/links/{link_id}/failure")
def fail_link_endpoint(link_id: str, db: Session = Depends(get_db)):
    """Injects a failure on the specified link, recalculates routes, and logs events."""
    service = SimulationService(db)
    try:
        res = service.fail_link(link_id)
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/links/{link_id}/restore")
def restore_link_endpoint(link_id: str, db: Session = Depends(get_db)):
    """Restores the specified link and converges routes back to baseline."""
    service = SimulationService(db)
    try:
        res = service.restore_link(link_id)
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/nodes/{node_id}/failure")
def fail_node_endpoint(node_id: str, db: Session = Depends(get_db)):
    """Injects a failure on a network node (router, switch, or server)."""
    service = SimulationService(db)
    try:
        res = service.fail_node(node_id)
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/nodes/{node_id}/restore")
def restore_node_endpoint(node_id: str, db: Session = Depends(get_db)):
    """Restores an offline network node."""
    service = SimulationService(db)
    try:
        res = service.restore_node(node_id)
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/reset")
def reset_network_endpoint(db: Session = Depends(get_db)):
    """Controlled baseline reset without erasing history."""
    service = SimulationService(db)
    return service.reset_network_baseline()
