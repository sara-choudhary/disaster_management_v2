import {
  TopologyData,
  RouteResult,
  Scenario,
  SimulationRun,
  NetworkEvent,
  Alert,
  AccessRule,
  TrafficSimulationResponse,
  ReportSummary,
} from '../types';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.port === '5173'
    ? 'http://localhost:8000/api/v1'
    : '/api/v1');

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const errJson = await res.json();
      if (errJson.detail) errorDetail = errJson.detail;
    } catch {
      // ignore JSON parse failure
    }
    throw new Error(errorDetail || `API request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Network & Topology
  getTopology: () => request<TopologyData>('/network/topology'),
  getNodes: () => request<any[]>('/network/nodes'),
  getLinks: () => request<any[]>('/network/links'),
  getDepartments: () => request<any[]>('/network/departments'),
  calculateRoute: (source: string, destination: string) =>
    request<RouteResult>(`/network/routes?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}`),
  getMetrics: () => request<any>('/network/metrics'),
  failLink: (linkId: string) =>
    request<any>(`/network/links/${encodeURIComponent(linkId)}/failure`, { method: 'POST' }),
  restoreLink: (linkId: string) =>
    request<any>(`/network/links/${encodeURIComponent(linkId)}/restore`, { method: 'POST' }),
  failNode: (nodeId: string) =>
    request<any>(`/network/nodes/${encodeURIComponent(nodeId)}/failure`, { method: 'POST' }),
  restoreNode: (nodeId: string) =>
    request<any>(`/network/nodes/${encodeURIComponent(nodeId)}/restore`, { method: 'POST' }),
  resetBaseline: () =>
    request<any>('/network/reset', { method: 'POST' }),

  // Scenarios & Simulations
  getScenarios: () => request<Scenario[]>('/scenarios'),
  runScenario: (scenarioKey: string) =>
    request<SimulationRun>('/simulations', {
      method: 'POST',
      body: JSON.stringify({ scenario_key: scenarioKey }),
    }),
  getSimulations: () => request<SimulationRun[]>('/simulations'),
  getSimulationRun: (runId: string) => request<SimulationRun>(`/simulations/${encodeURIComponent(runId)}`),
  stopSimulation: (runId: string) =>
    request<any>(`/simulations/${encodeURIComponent(runId)}/stop`, { method: 'POST' }),

  // Traffic & QoS
  simulateTraffic: (data: {
    source_department: string;
    destination_department: string;
    traffic_class: string;
    packet_count: number;
    offered_load_mbps: number;
    duration_seconds?: number;
  }) =>
    request<TrafficSimulationResponse>('/traffic/simulate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Access Control & Security
  getAccessRules: () => request<AccessRule[]>('/access-rules'),
  createAccessRule: (data: Partial<AccessRule>) =>
    request<AccessRule>('/access-rules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAccessRule: (ruleId: string, data: Partial<AccessRule>) =>
    request<AccessRule>(`/access-rules/${encodeURIComponent(ruleId)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  testAccess: (data: {
    source_department: string;
    destination_department: string;
    source_ip: string;
    destination_ip: string;
    protocol?: string;
    port?: number;
  }) =>
    request<any>('/security/test-access', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getDhcpPools: () => request<any[]>('/security/dhcp-pools'),
  allocateDhcp: (data: { department: string; client_hostname: string; client_mac: string }) =>
    request<any>('/security/dhcp-allocate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  testPortSecurity: (data: { switch_id: string; port_number: number; mac_address: string }) =>
    request<any>('/security/test-port-security', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  testSsh: (data: { target_device: string; username: string; source_ip: string }) =>
    request<any>('/security/test-ssh', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Events & Alerts
  getEvents: (params?: { limit?: number; severity?: string; event_type?: string }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.severity) q.append('severity', params.severity);
    if (params?.event_type) q.append('event_type', params.event_type);
    return request<NetworkEvent[]>(`/events?${q.toString()}`);
  },
  getAlerts: (params?: { status?: string; severity?: string; category?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.severity) q.append('severity', params.severity);
    if (params?.category) q.append('category', params.category);
    return request<Alert[]>(`/alerts?${q.toString()}`);
  },
  updateAlertStatus: (alertId: string, status: 'open' | 'acknowledged' | 'resolved') =>
    request<Alert>(`/alerts/${encodeURIComponent(alertId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Reports
  getReportsSummary: () => request<ReportSummary>('/reports/summary'),
  getDetailedRunReport: (runId: string) => request<any>(`/reports/simulations/${encodeURIComponent(runId)}`),
  getExportCsvUrl: () => `${API_BASE}/reports/export/csv`,
  getExportJsonUrl: () => `${API_BASE}/reports/export/json`,
};
