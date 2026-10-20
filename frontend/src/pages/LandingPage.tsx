import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-coastal-powder via-coastal-lavender to-coastal-peach">
      {/* Huge subtle shield outline watermark behind the title */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
        aria-hidden="true"
      >
        <ShieldCheck
          className="w-[580px] h-[580px] sm:w-[720px] sm:h-[720px] text-coastal-mauve/10 stroke-[0.8]"
        />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8 my-auto">
        {/* Complete Project Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-coastal-text tracking-tight leading-tight">
          Disaster-Resistant Emergency Communication Network with Priority Routing
        </h1>

        {/* Concise Project Explanation */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-coastal-secondary leading-relaxed">
          A full-stack network simulation demonstrating how emergency response
          departments maintain real-time mission-critical communication during
          severe infrastructure disruptions through redundant ring topology,
          Dijkstra alternate-path rerouting, strict QoS traffic prioritization,
          and departmental access control.
        </p>

        {/* One Prominent Rectangular Action Button */}
        <div className="pt-4 flex justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="group flex items-center gap-3 px-8 py-3.5 bg-coastal-cerulean text-white text-base font-semibold rounded hover:bg-coastal-cerulean/90 focus:outline-none focus:ring-4 focus:ring-coastal-cerulean/30 shadow-md transition-all active:scale-[0.99]"
          >
            <span>Explore Dashboard</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Team Credits */}
        <div className="pt-12 border-t border-coastal-border/60 max-w-md mx-auto text-xs text-coastal-secondary space-y-1">
          <p className="font-semibold text-coastal-text uppercase tracking-wider text-[11px]">
            Project Developers
          </p>
          <p>Aahaan Kothari — 24BDS0273</p>
          <p>Sara Choudhary — 24BCT0219</p>
          <p>Aryan Verma — 24BCT0223</p>
        </div>
      </div>
    </div>
  );
};
