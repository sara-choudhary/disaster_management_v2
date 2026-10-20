import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useWebSocket } from '../../hooks/useWebSocket';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { connectionMode } = useWebSocket();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-coastal-powder/50 via-coastal-lavender/30 to-coastal-peach/40">
      <Header
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        connectionMode={connectionMode}
        onNetworkReset={() => window.location.reload()}
      />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
};
