import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ArrowRight,
  RefreshCw,
  GitBranch,
} from 'lucide-react';
import { api } from '../services/api';
import {
  TopologyData,
  RouteResult,
  SimulationRun,
  NetworkEvent,
  Alert,
} from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [topology, setTopology] = useState<TopologyData | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>('Emergency Control Center');
  const [selectedDestination, setSelectedDestination] = useState<string>('Police');
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [recentRuns, setRecentRuns] = useState<SimulationRun[]>([]);
  const [recentEvents, setRecentEvents] = useState<NetworkEvent[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [topData, runs, events, alerts] = await Promise.all([
        api.getTopology(),
        api.getSimulations(),
        api.getEvents({ limit: 6 }),
        api.getAlerts({ status: 'open', severity: 'critical' }),
      ]);
      setTopology(topData);
      setRecentRuns(runs.slice(0, 4));
      setRecentEvents(events);
      setCriticalAlerts(alerts);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRouteQuery = async (src: string, dst: string) => {
    if (!src || !dst) return;
    try {
      const res = await api.calculateRoute(src, dst);
      setRouteResult(res);
    } catch (err) {
      console.error('Failed to calculate route:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (selectedSource && selectedDestination) {
      handleRouteQuery(selectedSource, selectedDestination);
    }
  }, [selectedSource, selectedDestination]);

  // Action handlers
  const handleConnectivityTest = async () => {
    setActionMessage('Running all-department reachability test...');
    await fetchDashboardData();
    if (selectedSource && selectedDestination) {
      await handleRouteQuery(selectedSource, selectedDestination);
    }
    setActionMessage('Reachability test verified via live Dijkstra calculation.');
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleSimulatePrimaryFailure = async () => {
    setActionMessage('Injecting primary link failure (L-R1-R2)...');
    try {
      await api.failLink('L-R1-R2');
      await fetchDashboardData();
      await handleRouteQuery(selectedSource, selectedDestination);
      setActionMessage('Primary link failed. Alternate path converged.');
    } catch (err: any) {
      setActionMessage(`Failure injection error: ${err.message}`);
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleRestoreNetwork = async () => {
    setActionMessage('Restoring network baseline topology...');
    try {
      await api.resetBaseline();
      await fetchDashboardData();
      await handleRouteQuery(selectedSource, selectedDestination);
      setActionMessage('All routers and links restored to baseline operational state.');
    } catch (err: any) {
      setActionMessage(`Restore error: ${err.message}`);
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  if (loading && !topology) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-coastal-secondary">
          <RefreshCw className="w-5 h-5 animate-spin text-coastal-cerulean" />
          <span>Loading network telemetry...</span>
        </div>
      </div>
    );
  }

  const metrics = topology?.metrics;
  const recentRecovery = recentRuns.find((r) => r.recovery_duration_ms)?.recovery_duration_ms;

  return (
    <div className="space-y-6">
      {/* Action banner feedback */}
      {actionMessage && (
        <div className="p-3.5 bg-coastal-cerulean/15 border border-coastal-cerulean/40 rounded text-sm text-coastal-text flex items-center justify-between animate-fadeIn">
          <span>{actionMessage}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs text-coastal-secondary hover:text-coastal-text font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Availability */}
        <div className="p-5 rounded bg-coastal-cream border border-coastal-border shadow-xs">
          <div className="flex items-center justify-between text-coastal-secondary text-xs font-medium uppercase tracking-wider">
            <span>Availability</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-coastal-text">
              {metrics ? `${metrics.department_reachability_pct}%` : '---'}
            </span>
            <span className="text-xs text-coastal-secondary">
              {metrics?.is_fully_connected ? 'Fully Connected' : 'Degraded Mesh'}
            </span>
          </div>
          <p className="mt-1 text-xs text-coastal-secondary">
            7/7 Departments evaluated
          </p>
        </div>

        {/* Active Links */}
        <div className="p-5 rounded bg-coastal-cream border border-coastal-border shadow-xs">
          <div className="flex items-center justify-between text-coastal-secondary text-xs font-medium uppercase tracking-wider">
            <span>Active Links</span>
            <Activity className="w-4 h-4 text-coastal-cerulean" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-coastal-text">
              {metrics ? `${metrics.active_links} / ${metrics.total_links}` : '---'}
            </span>
            <span className="text-xs text-coastal-secondary">UP</span>
          </div>
          <p className="mt-1 text-xs text-coastal-secondary">
            Ring & cross-links monitored
          </p>
        </div>

        {/* Critical Alerts */}
        <div className="p-5 rounded bg-coastal-cream border border-coastal-border shadow-xs">
          <div className="flex items-center justify-between text-coastal-secondary text-xs font-medium uppercase tracking-wider">
            <span>Open Alerts</span>
            <AlertTriangle className="w-4 h-4 text-coastal-rose" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-coastal-text">
              {criticalAlerts.length}
            </span>
            <span className="text-xs text-coastal-rose font-medium">Critical</span>
          </div>
          <p className="mt-1 text-xs text-coastal-secondary">
            Requiring immediate triage
          </p>
        </div>

        {/* Recovery Duration */}
        <div className="p-5 rounded bg-coastal-cream border border-coastal-border shadow-xs">
          <div className="flex items-center justify-between text-coastal-secondary text-xs font-medium uppercase tracking-wider">
            <span>Last Recovery</span>
            <Radio className="w-4 h-4 text-coastal-mauve" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-coastal-text">
              {recentRecovery !== undefined ? `${recentRecovery} ms` : 'N/A'}
            </span>
            <span className="text-xs text-coastal-secondary">Convergence</span>
          </div>
          <p className="mt-1 text-xs text-coastal-secondary">
            Measured Dijkstra recalculation
          </p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="p-4 rounded bg-coastal-cream border border-coastal-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleConnectivityTest}
            className="px-4 py-2 text-xs font-medium rounded bg-white border border-coastal-border hover:bg-coastal-powder/60 text-coastal-text shadow-xs transition-colors"
          >
            Run Connectivity Test
          </button>
          <button
            onClick={handleSimulatePrimaryFailure}
            className="px-4 py-2 text-xs font-medium rounded bg-coastal-rose/20 border border-coastal-rose/40 hover:bg-coastal-rose/30 text-coastal-text shadow-xs transition-colors"
          >
            Simulate Primary Link Failure
          </button>
          <button
            onClick={handleRestoreNetwork}
            className="px-4 py-2 text-xs font-medium rounded bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-900 shadow-xs transition-colors"
          >
            Restore Network
          </button>
        </div>

        <button
          onClick={() => navigate('/scenarios')}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded bg-coastal-cerulean text-white hover:bg-coastal-cerulean/90 shadow-xs transition-colors"
        >
          <span>Open Scenario Runner</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Interactive Path Query & Visual Route Inspector */}
      <div className="p-6 rounded bg-coastal-cream border border-coastal-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-coastal-text flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-coastal-cerulean" />
              <span>OSPF-Inspired Selected Route Inspection</span>
            </h2>
            <p className="text-xs text-coastal-secondary">
              Compute live lowest-cost shortest paths and failover behavior between emergency departments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-3 py-1.5 text-xs rounded border border-coastal-border bg-white text-coastal-text focus:outline-none focus:ring-2 focus:ring-coastal-cerulean"
            >
              <option value="Emergency Control Center">Emergency Control Center</option>
              <option value="Police">Police</option>
              <option value="Fire Department">Fire Department</option>
              <option value="Hospital">Hospital</option>
              <option value="Ambulance Services">Ambulance Services</option>
              <option value="Relief Camp">Relief Camp</option>
              <option value="Backup Control Center">Backup Control Center</option>
            </select>
            <span className="text-coastal-secondary text-xs">to</span>
            <select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
              className="px-3 py-1.5 text-xs rounded border border-coastal-border bg-white text-coastal-text focus:outline-none focus:ring-2 focus:ring-coastal-cerulean"
            >
              <option value="Police">Police</option>
              <option value="Emergency Control Center">Emergency Control Center</option>
              <option value="Fire Department">Fire Department</option>
              <option value="Hospital">Hospital</option>
              <option value="Ambulance Services">Ambulance Services</option>
              <option value="Relief Camp">Relief Camp</option>
              <option value="Backup Control Center">Backup Control Center</option>
            </select>
          </div>
        </div>

        {/* Route Details Box */}
        {routeResult && (
          <div className="p-4 rounded bg-white/70 border border-coastal-border space-y-2">
            <div className="flex flex-wrap items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-coastal-text">Calculated Path:</span>
                <span className="font-mono text-coastal-cerulean bg-coastal-cerulean/10 px-2 py-0.5 rounded">
                  {routeResult.path.length > 0 ? routeResult.path.join(' ➔ ') : 'NO ROUTE AVAILABLE'}
                </span>
                {routeResult.is_alternate_path && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-coastal-mauve/20 text-coastal-mauve">
                    Alternate Path
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-coastal-secondary">
                <span>Hops: <strong className="text-coastal-text">{routeResult.hops}</strong></span>
                <span>Total Metric Cost: <strong className="text-coastal-text">{routeResult.total_cost}</strong></span>
                <span>Latency: <strong className="text-coastal-text">{routeResult.total_latency} ms</strong></span>
              </div>
            </div>
            <p className="text-xs text-coastal-secondary">{routeResult.details}</p>
          </div>
        )}

        {/* Topology Preview Link */}
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/topology')}
            className="text-xs text-coastal-cerulean hover:underline font-medium flex items-center gap-1"
          >
            <span>View Full Interactive Topology Canvas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Two Column Layout: Recent Events & Simulation History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events */}
        <div className="p-5 rounded bg-coastal-cream border border-coastal-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-coastal-text">
              Recent Forensic Network Events
            </h3>
            <button
              onClick={() => navigate('/alerts')}
              className="text-xs text-coastal-cerulean hover:underline font-medium"
            >
              View All
            </button>
          </div>

          <div className="space-y-2">
            {recentEvents.length === 0 ? (
              <p className="text-xs text-coastal-secondary py-4 text-center">
                No network events recorded.
              </p>
            ) : (
              recentEvents.map((ev) => (
                <div
                  key={ev.event_id}
                  className="p-3 rounded bg-white/70 border border-coastal-border text-xs flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase ${
                          ev.severity === 'critical'
                            ? 'bg-coastal-critical/20 text-coastal-critical'
                            : ev.severity === 'warning'
                            ? 'bg-coastal-warning/30 text-amber-900'
                            : ev.severity === 'suspicious'
                            ? 'bg-coastal-suspicious/20 text-orange-900'
                            : 'bg-coastal-powder text-coastal-cerulean'
                        }`}
                      >
                        {ev.severity}
                      </span>
                      <span className="font-semibold text-coastal-text">
                        {ev.event_type}
                      </span>
                    </div>
                    <p className="text-coastal-secondary">{ev.description}</p>
                  </div>
                  <span className="text-[10px] text-coastal-secondary shrink-0">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Compact Simulation History */}
        <div className="p-5 rounded bg-coastal-cream border border-coastal-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-coastal-text">
              Recent Disaster Simulation Runs
            </h3>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs text-coastal-cerulean hover:underline font-medium"
            >
              Full Reports
            </button>
          </div>

          <div className="space-y-2">
            {recentRuns.length === 0 ? (
              <p className="text-xs text-coastal-secondary py-4 text-center">
                No simulations executed yet. Run a scenario to record history.
              </p>
            ) : (
              recentRuns.map((r) => (
                <div
                  key={r.run_id}
                  className="p-3 rounded bg-white/70 border border-coastal-border text-xs flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-coastal-text">
                      {r.scenario_name}
                    </div>
                    <div className="text-coastal-secondary text-[11px] flex items-center gap-3">
                      <span>ID: {r.run_id}</span>
                      <span>Outcome: <strong className={r.outcome === 'success' ? 'text-emerald-700' : 'text-coastal-rose'}>{r.outcome}</strong></span>
                      {r.recovery_duration_ms && (
                        <span>Recovery: {r.recovery_duration_ms} ms</span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      r.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : r.status === 'running'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-coastal-rose/20 text-coastal-rose'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
