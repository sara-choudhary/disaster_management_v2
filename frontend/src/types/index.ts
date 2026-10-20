export interface NetworkNode {
  id: number;
  device_id: string;
  name: string;
  node_type: 'router' | 'switch' | 'endpoint' | 'server';
  department?: string;
  ip_address: string;
  status: 'healthy' | 'failed' | 'degraded';
  is_active: boolean;
  node_metadata?: string;
  created_at: string;
}

export interface NetworkLink {
  id: number;
  link_id: string;
  source_id: string;
  target_id: string;
  bandwidth: number;
  latency: number;
  cost: number;
  status: 'up' | 'down' | 'congested';
  is_active: boolean;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  department_code: string;
  department_type: string;
  subnet: string;
  gateway: string;
  vlan_id: number;
  priority: number;
}

export interface RouteResult {
  source: string;
  destination: string;
  reachable: boolean;
  path: string[];
  hops: number;
  total_cost: number;
  total_latency: number;
  is_alternate_path: boolean;
  details: string;
}

export interface TopologyData {
  nodes: NetworkNode[];
  links: NetworkLink[];
  departments: Department[];
  metrics: {
    total_nodes: number;
    active_nodes: number;
    total_links: number;
    active_links: number;
    department_reachability_pct: number;
    is_fully_connected: boolean;
    unreachable_pairs: string[];
  };
}

export interface Scenario {
  id: number;
  scenario_key: string;
  title: string;
  description: string;
  initial_conditions: string;
  injected_event: string;
  expected_behavior: string;
  success_criteria: string;
}

export interface SimulationRun {
  id: number;
  run_id: string;
  scenario_id?: number;
  scenario_name: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  recovery_duration_ms?: number;
  initial_state?: string;
  final_state?: string;
  route_changes?: string;
  packet_stats?: string;
  outcome: string;
  details?: string;
}

export interface NetworkEvent {
  id: number;
  event_id: string;
  timestamp: string;
  event_type: string;
  severity: 'info' | 'warning' | 'suspicious' | 'critical';
  resource_id?: string;
  description: string;
  simulation_run_id?: string;
  event_metadata?: string;
}

export interface Alert {
  id: number;
  alert_id: string;
  timestamp: string;
  severity: 'warning' | 'suspicious' | 'critical';
  category: 'link' | 'router' | 'reachability' | 'security' | 'congestion';
  affected_resource: string;
  description: string;
  status: 'open' | 'acknowledged' | 'resolved';
  resolved_at?: string;
}

export interface AccessRule {
  id: number;
  rule_id: string;
  rule_order: number;
  description: string;
  source_department: string;
  destination_department: string;
  source_ip: string;
  destination_ip: string;
  protocol: string;
  port?: number;
  action: 'PERMIT' | 'DENY';
  is_enabled: boolean;
}

export interface TrafficClassResult {
  traffic_class: string;
  packets_sent: number;
  packets_delivered: number;
  packets_lost: number;
  delivery_ratio: number;
  estimated_latency_ms: number;
  queue_delay_ms: number;
  link_utilization_pct: number;
}

export interface TrafficSimulationResponse {
  simulation_id: string;
  timestamp: string;
  source_department: string;
  destination_department: string;
  path_used: string[];
  overall_sent: number;
  overall_delivered: number;
  overall_lost: number;
  overall_delivery_ratio: number;
  classes: TrafficClassResult[];
  congestion_detected: boolean;
  details: string;
}

export interface ReportSummary {
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  degraded_runs: number;
  average_recovery_time_ms?: number;
  average_delivery_ratio?: number;
  total_alerts: number;
  critical_alerts: number;
  recent_runs: SimulationRun[];
}
