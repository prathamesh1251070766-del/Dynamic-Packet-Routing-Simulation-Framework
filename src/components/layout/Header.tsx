import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="dashboard-header">
      <div className="header-brand">
        <div className="header-icon-container">
          {/* High-tech network router icon */}
          <svg className="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="14" width="20" height="8" rx="2" />
            <path d="M6 18h.01" />
            <path d="M10 18h.01" />
            <path d="M14 18h.01" />
            <path d="M18 18h.01" />
            <path d="M6 14V9a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v5" />
            <circle cx="12" cy="5" r="2" />
          </svg>
          <span className="status-dot pulse-indicator"></span>
        </div>

        <div className="header-titles">
          <div className="header-title-row">
            <h1 className="header-title">Dynamic Packet Routing & Network Simulator</h1>
            <span className="badge badge-accent">CE DSA Project</span>
          </div>
          <p className="header-subtitle">
            DSA-Based Intelligent Routing, Queue Management & Failure Recovery
          </p>
        </div>
      </div>

      <div className="header-meta">
        <div className="meta-card">
          <span className="meta-label">SIM ENGINE</span>
          <span className="meta-value text-emerald">
            <span className="mini-dot bg-emerald"></span> STANDBY
          </span>
        </div>
        <div className="meta-card">
          <span className="meta-label">TOPOLOGY MODE</span>
          <span className="meta-value text-cyan">Weighted Graph</span>
        </div>
        <div className="meta-card">
          <span className="meta-label">CORE ARCHITECTURE</span>
          <span className="meta-value">Pure Custom DSA</span>
        </div>
      </div>
    </header>
  );
};
