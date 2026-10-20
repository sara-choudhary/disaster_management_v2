from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


# Network Node Schemas
class NetworkNodeBase(BaseModel):
    device_id: str
    name: str
    node_type: str
    department: Optional[str] = None
    ip_address: str
    status: str = "healthy"
    is_active: bool = True
    node_metadata: Optional[str] = None


class NetworkNodeResponse(NetworkNodeBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# Network Link Schemas
class NetworkLinkBase(BaseModel):
    link_id: str
    source_id: str
    target_id: str
    bandwidth: float = 1000.0
    latency: float = 5.0
    cost: int = 10
    status: str = "up"
    is_active: bool = True


class NetworkLinkResponse(NetworkLinkBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# Department Schemas
class DepartmentBase(BaseModel):
    name: str
    department_code: str
    department_type: str
    subnet: str
    gateway: str
    vlan_id: int
    priority: int = 1


class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# Traffic Class Schemas
class TrafficClassBase(BaseModel):
    name: str
    description: str
    priority_level: int
    weight: int = 40
    guaranteed_bandwidth: float = 50.0


class TrafficClassResponse(TrafficClassBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# Scenario Schemas
class ScenarioBase(BaseModel):
    scenario_key: str
    title: str
    description: str
    initial_conditions: str
    injected_event: str
    expected_behavior: str
    success_criteria: str


class ScenarioCreate(ScenarioBase):
    pass


class ScenarioResponse(ScenarioBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# Simulation Run Schemas
class SimulationRunCreate(BaseModel):
    scenario_key: str


class SimulationRunResponse(BaseModel):
    id: int
    run_id: str
    scenario_id: Optional[int] = None
    scenario_name: str
    status: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_ms: Optional[float] = None
    recovery_duration_ms: Optional[float] = None
    initial_state: Optional[str] = None
    final_state: Optional[str] = None
    route_changes: Optional[str] = None
    packet_stats: Optional[str] = None
    outcome: str
    details: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# Network Event Schemas
class NetworkEventResponse(BaseModel):
    id: int
    event_id: str
    timestamp: datetime
    event_type: str
    severity: str
    resource_id: Optional[str] = None
    description: str
    simulation_run_id: Optional[str] = None
    event_metadata: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# Alert Schemas
class AlertResponse(BaseModel):
    id: int
    alert_id: str
    timestamp: datetime
    severity: str
    category: str
    affected_resource: str
    description: str
    status: str
    resolved_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class AlertUpdate(BaseModel):
    status: str = Field(..., pattern="^(open|acknowledged|resolved)$")


# Access Rule Schemas
class AccessRuleBase(BaseModel):
    rule_id: str
    rule_order: int = 100
    description: str
    source_department: str
    destination_department: str
    source_ip: str = "ANY"
    destination_ip: str = "ANY"
    protocol: str = "ANY"
    port: Optional[int] = None
    action: str = Field(..., pattern="^(PERMIT|DENY)$")
    is_enabled: bool = True


class AccessRuleCreate(AccessRuleBase):
    pass


class AccessRuleUpdate(BaseModel):
    rule_order: Optional[int] = None
    description: Optional[str] = None
    source_department: Optional[str] = None
    destination_department: Optional[str] = None
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    protocol: Optional[str] = None
    port: Optional[int] = None
    action: Optional[str] = Field(None, pattern="^(PERMIT|DENY)$")
    is_enabled: Optional[bool] = None


class AccessRuleResponse(AccessRuleBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# Routing Schemas
class RouteQuery(BaseModel):
    source: str
    destination: str


class RouteResult(BaseModel):
    source: str
    destination: str
    reachable: bool
    path: List[str]
    hops: int
    total_cost: int
    total_latency: float
    is_alternate_path: bool = False
    details: str


# Traffic & QoS Schemas
class TrafficSimulationRequest(BaseModel):
    source_department: str
    destination_department: str
    traffic_class: str = "critical"  # critical, high, normal, low
    packet_count: int = 1000
    offered_load_mbps: float = 100.0
    duration_seconds: float = 5.0


class TrafficClassResult(BaseModel):
    traffic_class: str
    packets_sent: int
    packets_delivered: int
    packets_lost: int
    delivery_ratio: float
    estimated_latency_ms: float
    queue_delay_ms: float
    link_utilization_pct: float


class TrafficSimulationResponse(BaseModel):
    simulation_id: str
    timestamp: datetime
    source_department: str
    destination_department: str
    path_used: List[str]
    overall_sent: int
    overall_delivered: int
    overall_lost: int
    overall_delivery_ratio: float
    classes: List[TrafficClassResult]
    congestion_detected: bool
    details: str


# Topology Response
class TopologyResponse(BaseModel):
    nodes: List[NetworkNodeResponse]
    links: List[NetworkLinkResponse]
    departments: List[DepartmentResponse]
    metrics: Dict[str, Any]


# Reports Summary
class ReportSummary(BaseModel):
    total_runs: int
    successful_runs: int
    failed_runs: int
    degraded_runs: int
    average_recovery_time_ms: Optional[float] = None
    average_delivery_ratio: Optional[float] = None
    total_alerts: int
    critical_alerts: int
    recent_runs: List[SimulationRunResponse]


# Security / Educational Test Schemas
class AccessTestRequest(BaseModel):
    source_department: str
    destination_department: str
    source_ip: str
    destination_ip: str
    protocol: str = "TCP"
    port: int = 80


class AccessTestResponse(BaseModel):
    allowed: bool
    matched_rule: Optional[AccessRuleResponse] = None
    action: str
    reason: str
    security_event_logged: bool


class DHCPAllocationRequest(BaseModel):
    department: str
    client_hostname: str
    client_mac: str


class DHCPAllocationResponse(BaseModel):
    success: bool
    department: str
    allocated_ip: Optional[str] = None
    subnet: str
    gateway: str
    dns: str
    message: str


class PortSecurityTestRequest(BaseModel):
    switch_id: str
    port_number: int
    mac_address: str


class PortSecurityTestResponse(BaseModel):
    allowed: bool
    switch_id: str
    port_number: int
    mac_address: str
    action_taken: str
    security_event_id: Optional[str] = None
    message: str


class SSHTestRequest(BaseModel):
    target_device: str
    username: str
    source_ip: str


class SSHTestResponse(BaseModel):
    success: bool
    target_device: str
    session_allowed: bool
    reason: str
    message: str
