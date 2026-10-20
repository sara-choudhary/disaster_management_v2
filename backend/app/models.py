from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import relationship
from app.database import Base


class NetworkNode(Base):
    __tablename__ = "network_nodes"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    node_type = Column(String(50), nullable=False)  # router, switch, endpoint, server
    department = Column(String(100), nullable=True)
    ip_address = Column(String(50), nullable=False)
    status = Column(String(50), default="healthy")  # healthy, failed, degraded
    is_active = Column(Boolean, default=True)
    node_metadata = Column(Text, nullable=True)  # JSON string with coordinates/extra info
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    outgoing_links = relationship(
        "NetworkLink",
        foreign_keys="NetworkLink.source_id",
        back_populates="source_node",
        cascade="all, delete-orphan",
    )
    incoming_links = relationship(
        "NetworkLink",
        foreign_keys="NetworkLink.target_id",
        back_populates="target_node",
        cascade="all, delete-orphan",
    )


class NetworkLink(Base):
    __tablename__ = "network_links"

    id = Column(Integer, primary_key=True, index=True)
    link_id = Column(String(50), unique=True, index=True, nullable=False)
    source_id = Column(String(50), ForeignKey("network_nodes.device_id", ondelete="CASCADE"), nullable=False)
    target_id = Column(String(50), ForeignKey("network_nodes.device_id", ondelete="CASCADE"), nullable=False)
    bandwidth = Column(Float, default=1000.0)  # Mbps
    latency = Column(Float, default=5.0)  # ms
    cost = Column(Integer, default=10)  # OSPF metric cost
    status = Column(String(50), default="up")  # up, down, congested
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    source_node = relationship("NetworkNode", foreign_keys=[source_id], back_populates="outgoing_links")
    target_node = relationship("NetworkNode", foreign_keys=[target_id], back_populates="incoming_links")


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    department_code = Column(String(50), unique=True, nullable=False)
    department_type = Column(String(50), nullable=False)
    subnet = Column(String(50), nullable=False)
    gateway = Column(String(50), nullable=False)
    vlan_id = Column(Integer, unique=True, nullable=False)
    priority = Column(Integer, default=1)  # 1: Critical, 2: High, 3: Normal, 4: Low
    created_at = Column(DateTime, default=datetime.utcnow)


class TrafficClass(Base):
    __tablename__ = "traffic_classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # critical, high, normal, low
    description = Column(String(255), nullable=False)
    priority_level = Column(Integer, nullable=False)  # 1 is highest
    weight = Column(Integer, default=40)
    guaranteed_bandwidth = Column(Float, default=50.0)  # Mbps


class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(Integer, primary_key=True, index=True)
    scenario_key = Column(String(50), unique=True, nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    initial_conditions = Column(Text, nullable=False)
    injected_event = Column(Text, nullable=False)
    expected_behavior = Column(Text, nullable=False)
    success_criteria = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String(50), unique=True, index=True, nullable=False)
    scenario_id = Column(Integer, ForeignKey("scenarios.id", ondelete="SET NULL"), nullable=True)
    scenario_name = Column(String(100), nullable=False)
    status = Column(String(50), default="running")  # running, completed, failed, cancelled
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    duration_ms = Column(Float, nullable=True)
    recovery_duration_ms = Column(Float, nullable=True)
    initial_state = Column(Text, nullable=True)  # JSON snapshot
    final_state = Column(Text, nullable=True)  # JSON snapshot
    route_changes = Column(Text, nullable=True)  # JSON array
    packet_stats = Column(Text, nullable=True)  # JSON stats
    outcome = Column(String(50), default="pending")  # success, degraded, failed
    details = Column(Text, nullable=True)

    scenario = relationship("Scenario")


class NetworkEvent(Base):
    __tablename__ = "network_events"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(50), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    event_type = Column(String(50), index=True, nullable=False)
    severity = Column(String(50), default="info")  # info, warning, suspicious, critical
    resource_id = Column(String(50), nullable=True)
    description = Column(Text, nullable=False)
    simulation_run_id = Column(String(50), nullable=True, index=True)
    event_metadata = Column(Text, nullable=True)  # JSON


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(50), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    severity = Column(String(50), default="warning")  # warning, suspicious, critical
    category = Column(String(50), nullable=False)  # link, router, reachability, security, congestion
    affected_resource = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="open")  # open, acknowledged, resolved
    resolved_at = Column(DateTime, nullable=True)


class AccessRule(Base):
    __tablename__ = "access_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(String(50), unique=True, index=True, nullable=False)
    rule_order = Column(Integer, default=100, index=True)
    description = Column(String(255), nullable=False)
    source_department = Column(String(100), nullable=False)
    destination_department = Column(String(100), nullable=False)
    source_ip = Column(String(50), default="ANY")
    destination_ip = Column(String(50), default="ANY")
    protocol = Column(String(50), default="ANY")
    port = Column(Integer, nullable=True)
    action = Column(String(50), default="PERMIT")  # PERMIT, DENY
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
