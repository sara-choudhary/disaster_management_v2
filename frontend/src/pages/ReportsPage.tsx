import React, { useState, useEffect } from 'react';
import {
  Download,
  Search,
  FileText,
  Eye,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { SimulationRun, ReportSummary } from '../types';

export const ReportsPage: React.FC = () => {
  const [runs, setRuns] = useState<SimulationRun[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRun, setSelectedRun] = useState<any | null>(null);
  const [, setLoading] = useState<boolean>(true);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [sumData, allRuns] = await Promise.all([
        api.getReportsSummary(),
        api.getSimulations(),
      ]);
      setSummary(sumData);
      setRuns(allRuns);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleInspectRun = async (runId: string) => {
    try {
      const detailed = await api.getDetailedRunReport(runId);
      setSelectedRun(detailed);
    } catch (err) {
      console.error('Failed to load detailed run:', err);
    }
  };

  // Filtered runs
  const filteredRuns = runs.filter(
    (r) =>
      r.run_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.scenario_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.outcome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Analytics Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded bg-coastal-cream border border-coastal-border shadow-xs">
            <span className="text-xs text-coastal-secondary uppercase tracking-wider font-medium">
              Total Executions
            </span>
            <div className="text-2xl font-bold text-coastal-text mt-1">
              {summary.total_runs}
            </div>
            <p className="text-[11px] text-coastal-secondary mt-0.5">
              Historical scenario runs
            </p>
          </div>

          <div className="p-4 rounded bg-coastal-cream border border-coastal-border shadow-xs">
            <span className="text-xs text-coastal-secondary uppercase tracking-wider font-medium">
              Successful
            </span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {summary.successful_runs}
            </div>
            <p className="text-[11px] text-coastal-secondary mt-0.5">
              Converged within criteria
            </p>
          </div>

          <div className="p-4 rounded bg-coastal-cream border border-coastal-border shadow-xs">
            <span className="text-xs text-coastal-secondary uppercase tracking-wider font-medium">
              Avg Recovery Time
            </span>
            <div className="text-2xl font-bold text-coastal-cerulean mt-1">
              {summary.average_recovery_time_ms !== null && summary.average_recovery_time_ms !== undefined
                ? `${summary.average_recovery_time_ms} ms`
                : 'N/A'}
            </div>
            <p className="text-[11px] text-coastal-secondary mt-0.5">
              Measured Dijkstra hold-down
            </p>
          </div>

          <div className="p-4 rounded bg-coastal-cream border border-coastal-border shadow-xs">
            <span className="text-xs text-coastal-secondary uppercase tracking-wider font-medium">
              Avg Delivery Ratio
            </span>
            <div className="text-2xl font-bold text-coastal-mauve mt-1">
              {summary.average_delivery_ratio !== null && summary.average_delivery_ratio !== undefined
                ? `${(summary.average_delivery_ratio * 100).toFixed(1)}%`
                : 'N/A'}
            </div>
            <p className="text-[11px] text-coastal-secondary mt-0.5">
              Under modeled load
            </p>
          </div>
        </div>
      )}

      {/* Toolbar: Search & Export buttons */}
      <div className="p-4 rounded bg-coastal-cream border border-coastal-border flex flex-wrap items-center justify-between gap-4 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-coastal-secondary absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Run ID, scenario, or outcome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-coastal-border bg-white text-coastal-text focus:outline-none focus:ring-2 focus:ring-coastal-cerulean"
          />
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <a
            href={api.getExportCsvUrl()}
            download="emergency_simulation_runs.csv"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-white border border-coastal-border hover:bg-coastal-powder/60 text-coastal-text shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-coastal-cerulean" />
            <span>Export CSV</span>
          </a>

          <a
            href={api.getExportJsonUrl()}
            download="emergency_simulation_runs.json"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-white border border-coastal-border hover:bg-coastal-powder/60 text-coastal-text shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-coastal-mauve" />
            <span>Export JSON</span>
          </a>
        </div>
      </div>

      {/* Simulation History Table */}
      <div className="bg-white rounded border border-coastal-border overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-coastal-cream/70 border-b border-coastal-border text-coastal-secondary uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-4">Run ID</th>
              <th className="py-2.5 px-4">Scenario Name</th>
              <th className="py-2.5 px-4">Start Time (UTC)</th>
              <th className="py-2.5 px-4">Recovery Time</th>
              <th className="py-2.5 px-4">Packets (S/D/L)</th>
              <th className="py-2.5 px-4">Delivery Ratio</th>
              <th className="py-2.5 px-4">Outcome</th>
              <th className="py-2.5 px-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-coastal-border/60">
            {filteredRuns.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-coastal-secondary">
                  No simulation runs found.
                </td>
              </tr>
            ) : (
              filteredRuns.map((r) => {
                let packetInfo = 'N/A';
                let deliveryRatio = 'N/A';
                if (r.packet_stats) {
                  try {
                    const ps = JSON.parse(r.packet_stats);
                    packetInfo = `${ps.sent ?? '-'} / ${ps.delivered ?? '-'} / ${ps.lost ?? '-'}`;
                    if (ps.delivery_ratio !== undefined) {
                      deliveryRatio = `${(ps.delivery_ratio * 100).toFixed(1)}%`;
                    }
                  } catch {
                    // ignore
                  }
                }

                return (
                  <tr key={r.run_id} className="hover:bg-coastal-cream/30">
                    <td className="py-2.5 px-4 font-mono font-bold text-coastal-cerulean">
                      {r.run_id}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-coastal-text">
                      {r.scenario_name}
                    </td>
                    <td className="py-2.5 px-4 text-coastal-secondary font-mono">
                      {new Date(r.start_time).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-coastal-text">
                      {r.recovery_duration_ms ? `${r.recovery_duration_ms} ms` : 'N/A'}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-coastal-secondary">
                      {packetInfo}
                    </td>
                    <td className="py-2.5 px-4 font-bold">
                      {deliveryRatio}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.outcome === 'success'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-coastal-rose/20 text-coastal-rose'
                        }`}
                      >
                        {r.outcome}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <button
                        onClick={() => handleInspectRun(r.run_id)}
                        className="flex items-center gap-1 text-xs text-coastal-cerulean hover:underline font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal / Drawer */}
      {selectedRun && (
        <div className="fixed inset-0 bg-coastal-text/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-coastal-cream border border-coastal-border rounded-lg max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-coastal-border pb-3">
              <div>
                <h3 className="text-base font-bold text-coastal-text flex items-center gap-2">
                  <FileText className="w-4 h-4 text-coastal-cerulean" />
                  <span>Simulation Dossier: {selectedRun.run.run_id}</span>
                </h3>
                <p className="text-xs text-coastal-secondary">
                  {selectedRun.run.scenario_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedRun(null)}
                className="p-1.5 rounded hover:bg-coastal-border/40 text-coastal-secondary hover:text-coastal-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded bg-white border border-coastal-border">
                <span className="text-coastal-secondary">Status</span>
                <div className="font-bold uppercase text-coastal-text mt-0.5">{selectedRun.run.status}</div>
              </div>
              <div className="p-3 rounded bg-white border border-coastal-border">
                <span className="text-coastal-secondary">Outcome</span>
                <div className="font-bold uppercase text-emerald-700 mt-0.5">{selectedRun.run.outcome}</div>
              </div>
              <div className="p-3 rounded bg-white border border-coastal-border">
                <span className="text-coastal-secondary">Wall Duration</span>
                <div className="font-bold text-coastal-text mt-0.5">{selectedRun.run.duration_ms} ms</div>
              </div>
              <div className="p-3 rounded bg-white border border-coastal-border">
                <span className="text-coastal-secondary">Convergence Time</span>
                <div className="font-bold text-coastal-cerulean mt-0.5">{selectedRun.run.recovery_duration_ms} ms</div>
              </div>
            </div>

            <div className="p-3.5 rounded bg-white border border-coastal-border text-xs space-y-1">
              <span className="font-semibold text-coastal-text uppercase tracking-wider text-[10px]">
                Execution Log Summary
              </span>
              <p className="text-coastal-secondary">{selectedRun.run.details}</p>
            </div>

            {/* Run Events */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-coastal-secondary">
                Linked Forensic Events ({selectedRun.events.length})
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedRun.events.length === 0 ? (
                  <p className="text-xs text-coastal-secondary">No linked events found.</p>
                ) : (
                  selectedRun.events.map((ev: any) => (
                    <div
                      key={ev.event_id}
                      className="p-2.5 rounded bg-white border border-coastal-border text-xs flex justify-between items-center"
                    >
                      <div>
                        <span className="font-semibold text-coastal-text mr-2">{ev.event_type}</span>
                        <span className="text-coastal-secondary">{ev.description}</span>
                      </div>
                      <span className="text-[10px] font-mono text-coastal-secondary">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRun(null)}
                className="px-4 py-2 bg-coastal-text text-white text-xs font-semibold rounded hover:bg-coastal-text/90"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
