import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { TopologyPage } from './pages/TopologyPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { TrafficQoSPage } from './pages/TrafficQoSPage';
import { TelemetryPage } from './pages/TelemetryPage';
import { AlertsSecurityPage } from './pages/AlertsSecurityPage';
import { ReportsPage } from './pages/ReportsPage';
import { AppLayout } from './components/layout/AppLayout';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page is strictly the first page visitors see */}
        <Route path="/" element={<LandingPage />} />

        {/* Dashboard and Core Functional Pages under Shared AppLayout */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/topology" element={<TopologyPage />} />
          <Route path="/scenarios" element={<ScenariosPage />} />
          <Route path="/traffic" element={<TrafficQoSPage />} />
          <Route path="/telemetry" element={<TelemetryPage />} />
          <Route path="/alerts" element={<AlertsSecurityPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
