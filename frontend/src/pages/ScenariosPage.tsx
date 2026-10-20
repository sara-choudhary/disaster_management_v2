import React, { useState, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  Activity,
} from 'lucide-react';
import { api } from '../services/api';
import { Scenario, SimulationRun } from '../types';

export const ScenariosPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [currentRun, setCurrentRun] = useState<SimulationRun | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadScenarios = async () => {
      try {
        const data = await api.getScenarios();
        setScenarios(data);
        if (data.length > 0) setSelectedScenario(data[0]);
      } catch (err) {
        console.error('Failed to load scenarios:', err);
      }
    };
    loadScenarios();
  }, []);

  const handleRunScenario = async () => {
    if (!selectedScenario) return;
    setIsRunning(true);
    setFeedbackMsg(`Initiating scenario: ${selectedScenario.title}...`);

    try {
      const run = await api.runScenario(selectedScenario.scenario_key);
      setCurrentRun(run);
      setFeedbackMsg(`Scenario completed with outcome: ${run.outcome.toUpperCase()}`);
    } catch (err: any) {
      setFeedbackMsg(`Execution failed: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleResetBaseline = async () => {
    try {
      await api.resetBaseline();
      setFeedbackMsg('Network baseline restored successfully.');
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      setFeedbackMsg(`Reset failed: ${err.message}`);
    }
  };

  // Parse JSON snapshots if present
  let routeChanges: any[] = [];
  let packetStats: any = null;
  if (currentRun?.route_changes) {
    try {
      routeChanges = JSON.parse(currentRun.route_changes);
    } catch {
      // ignore
    }
  }
  if (currentRun?.packet_stats) {
    try {
      packetStats = JSON.parse(currentRun.packet_stats);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
      {feedbackMsg && (
        <div className="p-3.5 bg-coastal-cerulean/15 border border-coastal-cerulean/40 rounded text-xs text-coastal-text flex items-center justify-between">
          <span>{feedbackMsg}</span>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-coastal-secondary hover:text-coastal-text font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Scenario Selector & Runner Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: 6 Scenarios List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase text-coastal-secondary tracking-wider">
            Predefined Disaster Scenarios
          </h2>

          <div className="space-y-2">
            {scenarios.map((sc) => {
              const isSelected = selectedScenario?.id === sc.id;
              return (
                <div
                  key={sc.id}
                  onClick={() => setSelectedScenario(sc)}
                  className={`p-4 rounded border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-coastal-cream border-coastal-cerulean shadow-xs'
                      : 'bg-white/80 border-coastal-border hover:bg-coastal-cream/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-coastal-text">
                      {sc.title}
                    </h3>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-coastal-cerulean" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-coastal-secondary line-clamp-2">
                    {sc.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Scenario Detail & Execution Console */}
        <div className="lg:col-span-2 space-y-6">
          {selectedScenario ? (
            <div className="p-6 rounded bg-coastal-cream border border-coastal-border space-y-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-coastal-border pb-4">
                <div>
                  <h3 className="text-lg font-bold text-coastal-text">
                    {selectedScenario.title}
                  </h3>
                  <p className="text-xs text-coastal-secondary">
                    Scenario Key: <code className="font-mono">{selectedScenario.scenario_key}</code>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetBaseline}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded bg-white border border-coastal-border hover:bg-coastal-powder/60 text-coastal-text shadow-xs transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-coastal-secondary" />
                    <span>Reset Baseline</span>
                  </button>

                  <button
                    onClick={handleRunScenario}
                    disabled={isRunning}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded bg-coastal-cerulean text-white hover:bg-coastal-cerulean/90 shadow-xs transition-colors disabled:opacity-50"
                  >
                    {isRunning ? (
                      <>
                        <Activity className="w-4 h-4 animate-spin" />
                        <span>Simulating...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>Run Scenario</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Scenario Conditions Dossier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded bg-white/70 border border-coastal-border space-y-1">
                  <span className="font-semibold text-coastal-text uppercase tracking-wider text-[10px]">
                    Initial Conditions
                  </span>
                  <p className="text-coastal-secondary">{selectedScenario.initial_conditions}</p>
                </div>

                <div className="p-3.5 rounded bg-white/70 border border-coastal-border space-y-1">
                  <span className="font-semibold text-coastal-text uppercase tracking-wider text-[10px]">
                    Injected Event
                  </span>
                  <p className="text-coastal-rose font-medium">{selectedScenario.injected_event}</p>
                </div>

                <div className="p-3.5 rounded bg-white/70 border border-coastal-border space-y-1">
                  <span className="font-semibold text-coastal-text uppercase tracking-wider text-[10px]">
                    Expected Behavior
                  </span>
                  <p className="text-coastal-secondary">{selectedScenario.expected_behavior}</p>
                </div>

                <div className="p-3.5 rounded bg-white/70 border border-coastal-border space-y-1">
                  <span className="font-semibold text-coastal-text uppercase tracking-wider text-[10px]">
                    Success Criteria
                  </span>
                  <p className="text-emerald-800 font-medium">{selectedScenario.success_criteria}</p>
                </div>
              </div>

              {/* Simulation Result Box */}
              {currentRun && (
                <div className="p-4 rounded bg-white border border-coastal-border space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-coastal-border pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase text-coastal-secondary">
                        Run Output
                      </span>
                      <code className="text-xs font-mono font-bold text-coastal-cerulean">
                        {currentRun.run_id}
                      </code>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        currentRun.outcome === 'success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-coastal-rose/20 text-coastal-rose'
                      }`}
                    >
                      {currentRun.outcome}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-coastal-secondary">Measured Time:</span>{' '}
                      <strong>{currentRun.duration_ms} ms</strong>
                    </div>
                    <div>
                      <span className="text-coastal-secondary">Convergence:</span>{' '}
                      <strong>{currentRun.recovery_duration_ms} ms</strong>
                    </div>
                    <div>
                      <span className="text-coastal-secondary">Status:</span>{' '}
                      <strong className="capitalize">{currentRun.status}</strong>
                    </div>
                  </div>

                  <p className="text-xs text-coastal-secondary bg-coastal-powder/40 p-2.5 rounded">
                    {currentRun.details}
                  </p>

                  {/* Route Changes Breakdown */}
                  {routeChanges.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-xs font-semibold text-coastal-text">
                        Dynamic Route Convergence:
                      </span>
                      {routeChanges.map((rc, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded bg-coastal-cream border border-coastal-border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div>
                            <span className="font-semibold text-coastal-text">
                              {rc.source} ➔ {rc.destination}:
                            </span>{' '}
                            <span className="font-mono text-coastal-cerulean">
                              {rc.new_path?.join(' ➔ ') || 'Unreachable'}
                            </span>
                          </div>
                          {rc.cost && (
                            <span className="text-coastal-secondary shrink-0">
                              Metric Cost: <strong>{rc.cost}</strong>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Packet Statistics Breakdown */}
                  {packetStats && (
                    <div className="p-3 rounded bg-coastal-cream border border-coastal-border text-xs space-y-1">
                      <span className="font-semibold text-coastal-text">Traffic Delivery Metrics:</span>
                      <div className="flex items-center gap-4 text-coastal-secondary">
                        <span>Offered: <strong>{packetStats.sent}</strong></span>
                        <span>Delivered: <strong>{packetStats.delivered}</strong></span>
                        <span>Lost: <strong>{packetStats.lost}</strong></span>
                        <span>Ratio: <strong>{(packetStats.delivery_ratio * 100).toFixed(1)}%</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-coastal-secondary">
              Select a disaster scenario from the left to view conditions and run simulation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
