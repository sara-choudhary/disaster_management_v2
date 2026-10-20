import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, Activity, RefreshCw, Clock } from 'lucide-react';
import { api } from '../services/api';
import { SimulationRun } from '../types';

export const TelemetryPage: React.FC = () => {
  const [runs, setRuns] = useState<SimulationRun[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<'all' | 'recent'>('all');

  const loadTelemetry = async () => {
    try {
      setLoading(true);
      const allRuns = await api.getSimulations();
      setRuns(allRuns);
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTelemetry();
  }, []);

  // Filter runs by selected timeRange
  const displayedRuns = timeRange === 'recent' ? runs.slice(0, 5) : runs;
  // Reverse chronological order for chart display (left to right = earlier to later)
  const chronologicalRuns = [...displayedRuns].reverse();

  // Extract Recovery & Duration Data
  const recoveryChartData = chronologicalRuns.map((r) => ({
    name: `Run #${r.id}`,
    scenario: r.scenario_name.split('(')[0],
    'Processing Time (ms)': r.duration_ms || 0,
    'Modeled Convergence (ms)': r.recovery_duration_ms || 0,
  }));

  // Extract Packet Accounting Data from runs that have packet stats
  const packetChartData = chronologicalRuns
    .filter((r) => r.packet_stats)
    .map((r) => {
      try {
        const stats = JSON.parse(r.packet_stats!);
        return {
          name: `Run #${r.id}`,
          'Delivery Ratio (%)': Math.round((stats.delivery_ratio || 0) * 100),
          'Packets Sent': stats.sent || 0,
          'Packets Lost': stats.lost || 0,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner */}
      <div className="p-3.5 rounded bg-coastal-cream border border-coastal-border text-xs text-coastal-secondary flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-coastal-cerulean shrink-0" />
          <span>
            Telemetry and convergence times represent simulated network estimates derived from Dijkstra execution and queueing models.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-2.5 py-1 text-xs rounded border border-coastal-border bg-white text-coastal-text"
          >
            <option value="all">All Persisted Runs</option>
            <option value="recent">Last 5 Runs</option>
          </select>
          <button
            onClick={loadTelemetry}
            className="p-1 rounded hover:bg-coastal-powder/60 text-coastal-secondary"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Dijkstra Route Recalculation & Convergence Duration */}
        <div className="p-5 rounded bg-coastal-cream border border-coastal-border space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-coastal-text flex items-center gap-2">
              <Clock className="w-4 h-4 text-coastal-cerulean" />
              <span>Dijkstra Convergence & Recovery Times</span>
            </h3>
            <span className="text-xs text-coastal-secondary">Per Simulation Run</span>
          </div>

          {recoveryChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-coastal-secondary">
              No simulation runs recorded yet. Execute scenarios to visualize recovery times.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recoveryChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2D9D5" />
                  <XAxis dataKey="name" stroke="#746E79" fontSize={11} />
                  <YAxis stroke="#746E79" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FBF8F2',
                      borderColor: '#E2D9D5',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Processing Time (ms)" fill="#6D9EBA" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Modeled Convergence (ms)" fill="#AA96B5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 2: Packet Delivery Ratio History */}
        <div className="p-5 rounded bg-coastal-cream border border-coastal-border space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-coastal-text flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Packet Delivery Performance</span>
            </h3>
            <span className="text-xs text-coastal-secondary">Across Congested Tests</span>
          </div>

          {packetChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-coastal-secondary">
              No QoS packet telemetry recorded. Execute scenario #5 or traffic simulations to view data.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={packetChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2D9D5" />
                  <XAxis dataKey="name" stroke="#746E79" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#746E79" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FBF8F2',
                      borderColor: '#E2D9D5',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Delivery Ratio (%)"
                    stroke="#B8D6BE"
                    strokeWidth={3}
                    dot={{ fill: '#B8D6BE', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
