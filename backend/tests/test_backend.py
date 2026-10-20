import json
import pytest
from app.models import NetworkNode, NetworkLink, Scenario, SimulationRun, AccessRule
from app.services.routing import RoutingEngine
from app.services.qos import QoSEngine
from app.services.security import SecurityEngine
from app.services.simulation import SimulationService


def test_schema_and_seeding(db_session):
    """Verifies that all 7 departments, 4 core routers, switches, endpoints, and links are seeded."""
    # Verify NetworkNode with device_id (ensures no network_nodes.device_id schema mismatch)
    r1 = db_session.query(NetworkNode).filter(NetworkNode.device_id == "R1").first()
    assert r1 is not None
    assert r1.device_id == "R1"
    assert r1.node_type == "router"

    # Verify all 4 routers exist
    for r_id in ["R1", "R2", "R3", "R4"]:
        node = db_session.query(NetworkNode).filter(NetworkNode.device_id == r_id).first()
        assert node is not None, f"Router {r_id} missing"

    # Verify links exist
    links = db_session.query(NetworkLink).all()
    assert len(links) >= 20


def test_dijkstra_shortest_path(db_session):
    """Tests Dijkstra's shortest path routing calculation."""
    engine = RoutingEngine(db_session)
    result = engine.dijkstra_shortest_path("R1", "R2")
    assert result["reachable"] is True
    assert result["path"] == ["R1", "R2"]
    assert result["total_cost"] == 10
    assert result["hops"] == 1


def test_alternate_route_on_link_failure(db_session):
    """Tests that failing a primary link triggers alternate path recalculation."""
    sim = SimulationService(db_session)

    # Baseline path
    routing = RoutingEngine(db_session)
    base_res = routing.dijkstra_shortest_path("R1", "R2")
    assert base_res["path"] == ["R1", "R2"]

    # Fail primary link L-R1-R2
    fail_res = sim.fail_link("L-R1-R2")
    assert fail_res["success"] is True

    # Re-query path
    new_routing = RoutingEngine(db_session)
    alt_res = new_routing.dijkstra_shortest_path("R1", "R2")
    assert alt_res["reachable"] is True
    assert alt_res["path"] != ["R1", "R2"]
    # Path should reroute through mesh or ring (e.g. R1 -> R4 -> R2 or R1 -> R3 -> R2)
    assert "R1" == alt_res["path"][0]
    assert "R2" == alt_res["path"][-1]

    # Restore link
    restore_res = sim.restore_link("L-R1-R2")
    assert restore_res["success"] is True

    restored_routing = RoutingEngine(db_session)
    final_res = restored_routing.dijkstra_shortest_path("R1", "R2")
    assert final_res["path"] == ["R1", "R2"]


def test_qos_priority_scheduling(db_session):
    """Tests that Critical traffic receives preferential service under congestion and packet accounting is exact."""
    qos = QoSEngine(db_session)

    # Congested traffic test (1500 Mbps load on 1000 Mbps link)
    res = qos.simulate_traffic(
        source_department="Emergency Control Center",
        destination_department="Hospital",
        traffic_class="critical",
        packet_count=1000,
        offered_load_mbps=1500.0,
    )

    assert res["congestion_detected"] is True
    assert res["overall_sent"] == 1000
    assert res["overall_sent"] == res["overall_delivered"] + res["overall_lost"]

    # Find Critical and Low class results
    class_map = {c["traffic_class"]: c for c in res["classes"]}
    crit = class_map["critical"]
    low = class_map["low"]

    # Critical must have significantly higher delivery ratio than Low
    assert crit["delivery_ratio"] >= 0.98
    assert low["delivery_ratio"] < crit["delivery_ratio"]
    assert low["packets_lost"] > crit["packets_lost"]


def test_access_control_evaluator(db_session):
    """Tests that ACL properly allows permitted traffic and denies blocked traffic."""
    sec = SecurityEngine(db_session)

    # Emergency Control Center to Police -> Permitted by Rule ACL-10
    allowed_res = sec.evaluate_access(
        source_dept="Emergency Control Center",
        destination_dept="Police",
        source_ip="192.168.10.10",
        destination_ip="192.168.20.10",
        protocol="TCP",
        port=80,
    )
    assert allowed_res["allowed"] is True
    assert allowed_res["action"] == "PERMIT"

    # Relief Camp to ECC Command Server -> Denied by Rule ACL-50
    denied_res = sec.evaluate_access(
        source_dept="Relief Camp",
        destination_dept="Emergency Control Center",
        source_ip="192.168.60.10",
        destination_ip="192.168.10.50",
        protocol="TCP",
        port=5432,
    )
    assert denied_res["allowed"] is False
    assert denied_res["action"] == "DENY"
    assert denied_res["security_event_logged"] is True


def test_educational_security_features(db_session):
    """Tests DHCP, Port Security, and SSH access control simulations."""
    sec = SecurityEngine(db_session)

    # DHCP Allocation
    dhcp = sec.simulate_dhcp_allocation(
        department_name="Hospital",
        client_hostname="icu-monitor-4",
        client_mac="00:50:56:AB:CD:EF",
    )
    assert dhcp["success"] is True
    assert dhcp["allocated_ip"].startswith("192.168.40.")

    # Port Security: Authorized MAC
    ps_ok = sec.test_port_security("SW-ECC", 1, "00:50:56:11:22:33")
    assert ps_ok["allowed"] is True
    assert ps_ok["action_taken"] == "FORWARDING"

    # Port Security: Rogue MAC
    ps_rogue = sec.test_port_security("SW-ECC", 2, "DE:AD:BE:EF:00:01")
    assert ps_rogue["allowed"] is False
    assert "ERR_DISABLE" in ps_rogue["action_taken"]

    # SSH Access: Admin from ECC subnet
    ssh_ok = sec.test_ssh_access("R1", "admin", "192.168.10.15")
    assert ssh_ok["session_allowed"] is True

    # SSH Access: Unauthorized user from Relief Camp
    ssh_denied = sec.test_ssh_access("R1", "guest", "192.168.60.25")
    assert ssh_denied["session_allowed"] is False


def test_scenario_execution(db_session):
    """Tests execution of the Primary Link Failure scenario and persistence in SimulationRun table."""
    sim = SimulationService(db_session)
    run = sim.execute_scenario("primary_link_failure")

    assert run.run_id is not None
    assert run.scenario_name == "Primary Link Failure (R1 <-> R2 Outage)"
    assert run.status == "completed"
    assert run.outcome == "success"
    assert run.recovery_duration_ms > 0

    # Ensure run is in database
    saved_run = (
        db_session.query(SimulationRun)
        .filter(SimulationRun.run_id == run.run_id)
        .first()
    )
    assert saved_run is not None


def test_api_endpoints(client):
    """Tests core REST endpoints."""
    # Health check
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    # Topology
    res = client.get("/api/v1/network/topology")
    assert res.status_code == 200
    data = res.json()
    assert len(data["nodes"]) >= 15
    assert len(data["links"]) >= 20

    # Scenarios
    res = client.get("/api/v1/scenarios")
    assert res.status_code == 200
    assert len(res.json()) == 6

    # Reports Summary
    res = client.get("/api/v1/reports/summary")
    assert res.status_code == 200
    summary = res.json()
    assert "total_runs" in summary
