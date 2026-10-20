import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import (
    NetworkNode,
    NetworkLink,
    Department,
    TrafficClass,
    Scenario,
    AccessRule,
    Alert,
    NetworkEvent,
)


def seed_database(db: Session):
    """
    Idempotent database seeding.
    Checks for existence of default records before adding.
    Preserves existing simulation history and runs.
    """
    # 1. Seed Departments
    default_departments = [
        {
            "name": "Emergency Control Center",
            "department_code": "ECC",
            "department_type": "Command",
            "subnet": "192.168.10.0/24",
            "gateway": "192.168.10.1",
            "vlan_id": 10,
            "priority": 1,
        },
        {
            "name": "Police",
            "department_code": "POLICE",
            "department_type": "Law Enforcement",
            "subnet": "192.168.20.0/24",
            "gateway": "192.168.20.1",
            "vlan_id": 20,
            "priority": 2,
        },
        {
            "name": "Fire Department",
            "department_code": "FIRE",
            "department_type": "Fire & Rescue",
            "subnet": "192.168.30.0/24",
            "gateway": "192.168.30.1",
            "vlan_id": 30,
            "priority": 2,
        },
        {
            "name": "Hospital",
            "department_code": "HOSPITAL",
            "department_type": "Medical Center",
            "subnet": "192.168.40.0/24",
            "gateway": "192.168.40.1",
            "vlan_id": 40,
            "priority": 1,
        },
        {
            "name": "Ambulance Services",
            "department_code": "AMBULANCE",
            "department_type": "Emergency Medical Transport",
            "subnet": "192.168.50.0/24",
            "gateway": "192.168.50.1",
            "vlan_id": 50,
            "priority": 1,
        },
        {
            "name": "Relief Camp",
            "department_code": "RELIEF",
            "department_type": "Humanitarian Relief",
            "subnet": "192.168.60.0/24",
            "gateway": "192.168.60.1",
            "vlan_id": 60,
            "priority": 3,
        },
        {
            "name": "Backup Control Center",
            "department_code": "BACKUP",
            "department_type": "Disaster Recovery Command",
            "subnet": "192.168.70.0/24",
            "gateway": "192.168.70.1",
            "vlan_id": 70,
            "priority": 1,
        },
    ]

    for dept in default_departments:
        if not db.query(Department).filter(Department.department_code == dept["department_code"]).first():
            db.add(Department(**dept))
    db.commit()

    # 2. Seed Traffic Classes
    default_traffic_classes = [
        {
            "name": "critical",
            "description": "Ambulance dispatch, hospital patient telemetry, vital command alerts",
            "priority_level": 1,
            "weight": 50,
            "guaranteed_bandwidth": 50.0,
        },
        {
            "name": "high",
            "description": "Police & fire emergency tactical coordination and status reports",
            "priority_level": 2,
            "weight": 25,
            "guaranteed_bandwidth": 30.0,
        },
        {
            "name": "normal",
            "description": "Inter-departmental messaging, supply manifests, general telemetry",
            "priority_level": 3,
            "weight": 15,
            "guaranteed_bandwidth": 15.0,
        },
        {
            "name": "low",
            "description": "Administrative records, software updates, background log synchronization",
            "priority_level": 4,
            "weight": 10,
            "guaranteed_bandwidth": 5.0,
        },
    ]

    for tc in default_traffic_classes:
        if not db.query(TrafficClass).filter(TrafficClass.name == tc["name"]).first():
            db.add(TrafficClass(**tc))
    db.commit()

    # 3. Seed Network Nodes (Routers, Switches, Endpoints, Servers)
    # Positions mapped to provide a clear, symmetrical circular topology
    default_nodes = [
        # 4 Core Routers in Ring
        {
            "device_id": "R1",
            "name": "Core Router 1 (North)",
            "node_type": "router",
            "department": "Infrastructure",
            "ip_address": "10.0.0.1",
            "status": "healthy",
            "node_metadata": json.dumps({"x": 450, "y": 150}),
        },
        {
            "device_id": "R2",
            "name": "Core Router 2 (East)",
            "node_type": "router",
            "department": "Infrastructure",
            "ip_address": "10.0.0.2",
            "status": "healthy",
            "node_metadata": json.dumps({"x": 750, "y": 350}),
        },
        {
            "device_id": "R3",
            "name": "Core Router 3 (South)",
            "node_type": "router",
            "department": "Infrastructure",
            "ip_address": "10.0.0.3",
            "status": "healthy",
            "node_metadata": json.dumps({"x": 450, "y": 550}),
        },
        {
            "device_id": "R4",
            "name": "Core Router 4 (West)",
            "node_type": "router",
            "department": "Infrastructure",
            "ip_address": "10.0.0.4",
            "status": "healthy",
            "node_metadata": json.dumps({"x": 150, "y": 350}),
        },
        # Department Switches
        {
            "device_id": "SW-ECC",
            "name": "Switch - Emergency Control",
            "node_type": "switch",
            "department": "Emergency Control Center",
            "ip_address": "192.168.10.2",
            "status": "healthy",
            "node_metadata": json.dumps({"x": 450, "y": 30}),
        },
        {
            "device_id": "SW-POLICE",
            "name": "Switch - Police HQ",
            "node_type": "switch",
            "department": "Police",
            "ip_address": "192.168.20.2",
            "status": "healthy",
            "node_metadata": json.dumps({"x": 880, "y": 250}),
        },
        {
            "device_id": "SW-FIRE",
            "name": "Switch - Fire Rescue",
            "node_type": "switch",
            "department": "Fire Department",
            "ip_address": "192.168.30.2",
            "status": "healthy",
            "node_metadata": json.dumps({"x": 880, "y": 450}),
        },
        {
            "device_id": "SW-HOSPITAL",
            "name": "Switch - Hospital Complex",
            "node_type": "switch",
            "department": "Hospital",
            "ip_address": "192.168.40.2",
            "status": "healthy",
            "node_metadata": json.dumps({"x": 580, "y": 680}),
        },
        {
            "device_id": "SW-AMBULANCE",
            "name": "Switch - Ambulance Fleet",
            "node_type": "switch",
            "department": "Ambulance Services",
            "ip_address": "192.168.50.2",
            "status": "healthy",
            "node_metadata": json.dumps({"x": 320, "y": 680}),
        },
        {
            "device_id": "SW-RELIEF",
            "name": "Switch - Relief Camp",
            "node_type": "switch",
            "department": "Relief Camp",
            "ip_address": "192.168.60.2",
            "status": "healthy",
            "node_metadata": json.dumps({"x": 20, "y": 450}),
        },
        {
            "device_id": "SW-BACKUP",
            "name": "Switch - Backup Command",
            "node_type": "switch",
            "department": "Backup Control Center",
            "ip_address": "192.168.70.2",
            "status": "healthy",
            "node_metadata": json.dumps({"x": 20, "y": 250}),
        },
        # Key Endpoints & Department Servers
        {
            "device_id": "SRV-ECC",
            "name": "Main ECC Command Server",
            "node_type": "server",
            "department": "Emergency Control Center",
            "ip_address": "192.168.10.50",
            "status": "healthy",
            "node_metadata": json.dumps({"x": 550, "y": -60}),
        },
        {
            "device_id": "EP-ECC-01",
            "name": "ECC Dispatch Console",
            "node_type": "endpoint",
            "department": "Emergency Control Center",
            "ip_address": "192.168.10.10",
            "status": "healthy",
            "node_metadata": json.dumps({"x": 350, "y": -60}),
        },
        {
            "device_id": "EP-POLICE-01",
            "name": "Police Tactical Dispatch",
            "node_type": "endpoint",
            "department": "Police",
            "ip_address": "192.168.20.10",
            "status": "healthy",
            "node_metadata": json.dumps({"x": 1020, "y": 250}),
        },
        {
            "device_id": "EP-FIRE-01",
            "name": "Fire Command Terminal",
            "node_type": "endpoint",
            "department": "Fire Department",
            "ip_address": "192.168.30.10",
            "status": "healthy",
            "node_metadata": json.dumps({"x": 1020, "y": 450}),
        },
        {
            "device_id": "SRV-HOSP",
            "name": "Hospital ICU Patient Server",
            "node_type": "server",
            "department": "Hospital",
            "ip_address": "192.168.40.50",
            "status": "healthy",
            "node_metadata": json.dumps({"x": 680, "y": 790}),
        },
        {
            "device_id": "EP-HOSP-01",
            "name": "Hospital ER Coordination Station",
            "node_type": "endpoint",
            "department": "Hospital",
            "ip_address": "192.168.40.10",
            "status": "healthy",
            "node_metadata": json.dumps({"x": 520, "y": 790}),
        },
        {
            "device_id": "EP-AMB-DISPATCH",
            "name": "Ambulance Fleet Dispatcher",
            "node_type": "endpoint",
            "department": "Ambulance Services",
            "ip_address": "192.168.50.11",
            "status": "healthy",
            "node_metadata": json.dumps({"x": 220, "y": 790}),
        },
        {
            "device_id": "EP-RELIEF-01",
            "name": "Relief Camp Coordinator Terminal",
            "node_type": "endpoint",
            "department": "Relief Camp",
            "ip_address": "192.168.60.10",
            "status": "healthy",
            "node_metadata": json.dumps({"x": -110, "y": 450}),
        },
        {
            "device_id": "SRV-BACKUP",
            "name": "Backup Command Server",
            "node_type": "server",
            "department": "Backup Control Center",
            "ip_address": "192.168.70.50",
            "status": "healthy",
            "node_metadata": json.dumps({"x": -110, "y": 250}),
        },
    ]

    for node in default_nodes:
        existing = db.query(NetworkNode).filter(NetworkNode.device_id == node["device_id"]).first()
        if not existing:
            db.add(NetworkNode(**node))
    db.commit()

    # 4. Seed Links (Bidirectional Network Links)
    # Core Router Ring + Mesh Diagonals + Distribution Uplinks
    raw_links = [
        # Core Ring
        ("R1", "R2", 1000.0, 4.0, 10),
        ("R2", "R3", 1000.0, 4.0, 10),
        ("R3", "R4", 1000.0, 4.0, 10),
        ("R4", "R1", 1000.0, 4.0, 10),
        # Redundant Cross-Links (Mesh)
        ("R1", "R3", 1000.0, 6.0, 15),
        ("R2", "R4", 1000.0, 6.0, 15),
        # Router to Switch Uplinks
        ("R1", "SW-ECC", 1000.0, 2.0, 5),
        ("R2", "SW-POLICE", 1000.0, 2.0, 5),
        ("R2", "SW-FIRE", 1000.0, 2.0, 5),
        ("R3", "SW-HOSPITAL", 1000.0, 2.0, 5),
        ("R3", "SW-AMBULANCE", 1000.0, 2.0, 5),
        ("R4", "SW-RELIEF", 1000.0, 2.0, 5),
        ("R4", "SW-BACKUP", 1000.0, 2.0, 5),
        # Emergency Inter-Switch Redundancy (Direct medical emergency link)
        ("SW-HOSPITAL", "SW-AMBULANCE", 500.0, 3.0, 8),
        # Switch to Endpoints
        ("SW-ECC", "SRV-ECC", 1000.0, 1.0, 1),
        ("SW-ECC", "EP-ECC-01", 100.0, 1.0, 1),
        ("SW-POLICE", "EP-POLICE-01", 100.0, 1.0, 1),
        ("SW-FIRE", "EP-FIRE-01", 100.0, 1.0, 1),
        ("SW-HOSPITAL", "SRV-HOSP", 1000.0, 1.0, 1),
        ("SW-HOSPITAL", "EP-HOSP-01", 100.0, 1.0, 1),
        ("SW-AMBULANCE", "EP-AMB-DISPATCH", 100.0, 1.0, 1),
        ("SW-RELIEF", "EP-RELIEF-01", 100.0, 1.0, 1),
        ("SW-BACKUP", "SRV-BACKUP", 1000.0, 1.0, 1),
    ]

    for src, dst, bw, lat, cost in raw_links:
        # Link A -> B
        link_id_ab = f"L-{src}-{dst}"
        if not db.query(NetworkLink).filter(NetworkLink.link_id == link_id_ab).first():
            db.add(
                NetworkLink(
                    link_id=link_id_ab,
                    source_id=src,
                    target_id=dst,
                    bandwidth=bw,
                    latency=lat,
                    cost=cost,
                    status="up",
                )
            )
        # Link B -> A (Symmetric Return Path)
        link_id_ba = f"L-{dst}-{src}"
        if not db.query(NetworkLink).filter(NetworkLink.link_id == link_id_ba).first():
            db.add(
                NetworkLink(
                    link_id=link_id_ba,
                    source_id=dst,
                    target_id=src,
                    bandwidth=bw,
                    latency=lat,
                    cost=cost,
                    status="up",
                )
            )
    db.commit()

    # 5. Seed Scenarios
    default_scenarios = [
        {
            "scenario_key": "primary_link_failure",
            "title": "Primary Link Failure (R1 <-> R2 Outage)",
            "description": "Simulates fiber cut on the high-speed link connecting Core Router 1 and Core Router 2 during extreme flooding.",
            "initial_conditions": "All 4 core routers and links are fully operational. Primary shortest path between ECC and Police uses R1-R2 directly.",
            "injected_event": "Physical link L-R1-R2 and L-R2-R1 severed.",
            "expected_behavior": "Routing engine detects link failure, recalculates OSPF metric tables via Dijkstra, and redirects traffic along alternate redundant paths (R1 -> R4 -> R2 or R1 -> R3 -> R2).",
            "success_criteria": "Re-routing completed within simulated tolerance; no permanent department disconnection.",
        },
        {
            "scenario_key": "main_router_outage",
            "title": "Main Router Outage (Core Router 1 Offline)",
            "description": "Simulates catastrophic power failure at Core Router 1 hosting the primary Emergency Control Center uplinks.",
            "initial_conditions": "Network operating at baseline capacity.",
            "injected_event": "Core Router R1 is marked failed. All connected links go down.",
            "expected_behavior": "Remaining routers (R2, R3, R4) isolate R1. Emergency traffic to Command shifts to Backup Control Center (connected to R4).",
            "success_criteria": "Remaining 6 departments maintain mutual reachability via ring survivors; alerts logged.",
        },
        {
            "scenario_key": "main_control_center_outage",
            "title": "Main Control Center Outage (ECC Isolated)",
            "description": "Simulates physical damage to the primary Emergency Control Center switch and servers.",
            "initial_conditions": "Normal baseline operations.",
            "injected_event": "SW-ECC and SRV-ECC go offline.",
            "expected_behavior": "Primary command servers become unreachable. System promotes Backup Control Center (VLAN 70) as active command authority.",
            "success_criteria": "Backup Control Center reachable by all operational field units.",
        },
        {
            "scenario_key": "hospital_connectivity_failure",
            "title": "Hospital Connectivity Failure (Uplink Cut)",
            "description": "Simulates primary link failure between Core Router 3 and Hospital Switch during an earthquake.",
            "initial_conditions": "Hospital and Ambulance services communicating over primary router link.",
            "injected_event": "Link L-R3-SW-HOSPITAL severed.",
            "expected_behavior": "Dijkstra routing engine identifies direct secondary emergency cross-link (SW-HOSPITAL <-> SW-AMBULANCE) to maintain hospital reachability via Ambulance switch.",
            "success_criteria": "Hospital remains reachable via alternate departmental bypass.",
        },
        {
            "scenario_key": "high_traffic_congestion",
            "title": "High Traffic Congestion & Priority Scheduling",
            "description": "Massive influx of traffic (150% link capacity) during city-wide emergency. Tests QoS priority queue scheduler.",
            "initial_conditions": "Normal network load.",
            "injected_event": "High-volume burst offered across core transit links.",
            "expected_behavior": "Scheduler prioritizes Critical (Ambulance/Hospital) packets with near-100% delivery ratio while Low/Normal priority background traffic experiences queuing delay and intentional packet drops.",
            "success_criteria": "Critical class maintains >=98% delivery ratio while Low priority absorbs drops.",
        },
        {
            "scenario_key": "unauthorized_access",
            "title": "Unauthorized Access Attempt (ACL Violation)",
            "description": "Tests departmental segmentation and Access Control List (ACL) enforcement.",
            "initial_conditions": "Access control rules active in firewall engine.",
            "injected_event": "Relief Camp endpoint attempts unauthorized TCP access to Main ECC Command Database (192.168.10.50:5432).",
            "expected_behavior": "ACL engine matches Rule 50 (DENY Relief -> ECC Server), drops packets, and persists security alert and forensic event.",
            "success_criteria": "Packet dropped; security incident logged with timestamp and source IP.",
        },
    ]

    for sc in default_scenarios:
        if not db.query(Scenario).filter(Scenario.scenario_key == sc["scenario_key"]).first():
            db.add(Scenario(**sc))
    db.commit()

    # 6. Seed Access Rules (ACL)
    default_rules = [
        {
            "rule_id": "ACL-10",
            "rule_order": 10,
            "description": "Permit Emergency Control Center to All Departments (Full Admin Command)",
            "source_department": "Emergency Control Center",
            "destination_department": "ANY",
            "source_ip": "192.168.10.0/24",
            "destination_ip": "ANY",
            "protocol": "ANY",
            "action": "PERMIT",
            "is_enabled": True,
        },
        {
            "rule_id": "ACL-20",
            "rule_order": 20,
            "description": "Permit Hospital Telemetry to Ambulance Services",
            "source_department": "Hospital",
            "destination_department": "Ambulance Services",
            "source_ip": "192.168.40.0/24",
            "destination_ip": "192.168.50.0/24",
            "protocol": "ANY",
            "action": "PERMIT",
            "is_enabled": True,
        },
        {
            "rule_id": "ACL-21",
            "rule_order": 21,
            "description": "Permit Ambulance Dispatch to Hospital Emergency Room",
            "source_department": "Ambulance Services",
            "destination_department": "Hospital",
            "source_ip": "192.168.50.0/24",
            "destination_ip": "192.168.40.0/24",
            "protocol": "ANY",
            "action": "PERMIT",
            "is_enabled": True,
        },
        {
            "rule_id": "ACL-30",
            "rule_order": 30,
            "description": "Permit Police Emergency Coordination to Command Centers",
            "source_department": "Police",
            "destination_department": "Emergency Control Center",
            "source_ip": "192.168.20.0/24",
            "destination_ip": "192.168.10.0/24",
            "protocol": "ANY",
            "action": "PERMIT",
            "is_enabled": True,
        },
        {
            "rule_id": "ACL-31",
            "rule_order": 31,
            "description": "Permit Fire Department Coordination to Command Centers",
            "source_department": "Fire Department",
            "destination_department": "Emergency Control Center",
            "source_ip": "192.168.30.0/24",
            "destination_ip": "192.168.10.0/24",
            "protocol": "ANY",
            "action": "PERMIT",
            "is_enabled": True,
        },
        {
            "rule_id": "ACL-50",
            "rule_order": 50,
            "description": "DENY Relief Camp from Direct Access to ECC Core Command Server",
            "source_department": "Relief Camp",
            "destination_department": "Emergency Control Center",
            "source_ip": "192.168.60.0/24",
            "destination_ip": "192.168.10.50/32",
            "protocol": "ANY",
            "action": "DENY",
            "is_enabled": True,
        },
        {
            "rule_id": "ACL-999",
            "rule_order": 999,
            "description": "Default Inter-Department Emergency Communication Baseline",
            "source_department": "ANY",
            "destination_department": "ANY",
            "source_ip": "ANY",
            "destination_ip": "ANY",
            "protocol": "ANY",
            "action": "PERMIT",
            "is_enabled": True,
        },
    ]

    for rule in default_rules:
        if not db.query(AccessRule).filter(AccessRule.rule_id == rule["rule_id"]).first():
            db.add(AccessRule(**rule))
    db.commit()

    # 7. Seed Initial Baseline Event and Alert if none exist
    if db.query(NetworkEvent).count() == 0:
        db.add(
            NetworkEvent(
                event_id="EVT-INIT-001",
                timestamp=datetime.utcnow(),
                event_type="SYSTEM_INITIALIZED",
                severity="info",
                resource_id="ALL",
                description="Emergency Communication Network initialized with 4-core router ring topology and 7 departmental subnets.",
                event_metadata=json.dumps({"subnets_active": 7, "routers": 4}),
            )
        )
        db.commit()
