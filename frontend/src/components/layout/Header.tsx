import React from 'react';
import { Menu, RotateCcw } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../../services/api';

interface HeaderProps {
  onToggleSidebar: () => void;
  connectionMode?: 'websocket' | 'polling' | 'disconnected';
  onNetworkReset?: () => void;
}

const routeTitles: Record<string, string> = {
  '/dashboard': 'Overview Dashboard',
  '/topology': 'Interactive Network Topology',
  '/scenarios': 'Disaster Scenario Runner',
  '/traffic': 'Traffic Priority & QoS Scheduler',
  '/telemetry': 'Telemetry & Performance Analytics',
  '/alerts': 'Alerts, Forensics & Access Control',
  '/reports': 'Simulation Reports & Audit Exports',
};

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  connectionMode = 'websocket',
  onNetworkReset,
}) => {
  const location = useLocation();
  const currentTitle = routeTitles[location.pathname] || 'Emergency Response Network';

  const handleReset = async () => {
    if (window.confirm('Restore baseline network topology (re-enables all core routers & redundant links)?')) {
      try {
        await api.resetBaseline();
        if (onNetworkReset) onNetworkReset();
      } catch (err) {
        console.error('Failed to reset network baseline:', err);
      }
    }
  };

  return (
    <header className="h-16 bg-coastal-cream/90 backdrop-blur border-b border-coastal-border px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3.5">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded hover:bg-coastal-powder/60 text-coastal-text focus:outline-none focus:ring-2 focus:ring-coastal-cerulean transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="text-xs uppercase tracking-wider text-coastal-secondary hover:text-coastal-text transition-colors font-medium hidden sm:inline"
          >
            Emergency Net
          </Link>
          <span className="text-coastal-secondary/50 hidden sm:inline">/</span>
          <h1 className="text-sm font-semibold text-coastal-text tracking-tight">
            {currentTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Connection status indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/70 border border-coastal-border text-xs text-coastal-secondary">
          <span
            className={`w-2 h-2 rounded-full ${
              connectionMode === 'websocket'
                ? 'bg-emerald-500 animate-pulse'
                : connectionMode === 'polling'
                ? 'bg-amber-500'
                : 'bg-coastal-critical'
            }`}
          />
          <span className="capitalize hidden md:inline">
            {connectionMode === 'websocket'
              ? 'Live Sync (WS)'
              : connectionMode === 'polling'
              ? 'Sync (HTTP Poll)'
              : 'Disconnected'}
          </span>
        </div>

        {/* Restore baseline button */}
        <button
          onClick={handleReset}
          title="Restore baseline topology"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-white border border-coastal-border hover:bg-coastal-powder/60 text-coastal-text shadow-xs transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-coastal-secondary" />
          <span className="hidden sm:inline">Restore Baseline</span>
        </button>
      </div>
    </header>
  );
};
