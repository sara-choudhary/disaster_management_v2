import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Network,
  Activity,
  Layers,
  BarChart3,
  ShieldAlert,
  FileSpreadsheet,
  X,
  Radio,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Network Topology', path: '/topology', icon: Network },
  { name: 'Scenarios', path: '/scenarios', icon: Activity },
  { name: 'Traffic & QoS', path: '/traffic', icon: Layers },
  { name: 'Telemetry', path: '/telemetry', icon: BarChart3 },
  { name: 'Alerts & Security', path: '/alerts', icon: ShieldAlert },
  { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-coastal-text/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 left-0 bottom-0 w-72 bg-coastal-cream border-r border-coastal-border z-50 transform transition-transform duration-200 ease-in-out shadow-lg flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Application Navigation"
      >
        {/* Header */}
        <div className="p-5 border-b border-coastal-border flex items-center justify-between bg-white/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-coastal-cerulean/15 flex items-center justify-center text-coastal-cerulean">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-coastal-text">
                Emergency Net
              </h2>
              <p className="text-xs text-coastal-secondary">
                Redundant Mesh v2.0
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-coastal-secondary hover:text-coastal-text hover:bg-coastal-border/30 focus:outline-none focus:ring-2 focus:ring-coastal-cerulean"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-coastal-cerulean/15 text-coastal-cerulean font-semibold border-l-4 border-coastal-cerulean'
                      : 'text-coastal-text hover:bg-coastal-powder/60 hover:text-coastal-text'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info (Academic Project details) */}
        <div className="p-4 border-t border-coastal-border bg-white/30 text-xs text-coastal-secondary space-y-1">
          <p className="font-medium text-coastal-text">Project Team:</p>
          <p>Aahaan Kothari — 24BDS0273</p>
          <p>Sara Choudhary — 24BCT0219</p>
          <p>Aryan Verma — 24BCT0223</p>
          <div className="pt-2 text-[10px] text-coastal-secondary/80">
            Educational Network Simulation
          </div>
        </div>
      </aside>
    </>
  );
};
