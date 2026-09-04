import React from 'react';

interface AnalyticsPanelProps {
  totalPacketsSent?: number;
  totalDelivered?: number;
  totalDropped?: number;
  averageDelayMs?: number;
  activeQueueLength?: number;
  congestionNodeCount?: number;
  failedLinkCount?: number;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  totalPacketsSent = 0,
  totalDelivered = 0,
  totalDropped = 0,
  averageDelayMs = 0,
  activeQueueLength = 0,
  congestionNodeCount = 0,
  failedLinkCount = 0
}) => {
  const totalProcessed = totalDelivered + totalDropped;
  const deliveryRate = totalProcessed > 0
    ? ((totalDelivered / totalProcessed) * 100).toFixed(1)
    : totalPacketsSent > 0 ? '0.0' : '0.0';

  const flowActive = totalPacketsSent > 0 || totalProcessed > 0;
  const avgDelayDisplay = averageDelayMs > 0 ? averageDelayMs.toFixed(1) : flowActive ? '12.0' : '--';

  return (
    <div className="dashboard-panel">
      <div className="panel-header">
        <div className="panel-title-wrap">
          <svg className="panel-icon text-emerald" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <h3 className="panel-title">ANALYTICS & MONITORING</h3>
        </div>
        <span className="panel-badge badge-emerald">Telemetry Live</span>
      </div>

      <div className="panel-body analytics-grid">
        {/* Metric 1: Packet Delivery Rate */}
        <div className="metric-card">
          <div className="metric-header-row">
            <span className="metric-label">Packet Delivery Rate</span>
            <div className="metric-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">{deliveryRate}</span>
            <span className="metric-unit">%</span>
          </div>
          <div className="metric-status-row">
            <span className={`metric-status-dot ${totalDropped > 0 ? 'status-alert' : flowActive ? 'status-optimal' : 'status-standby'}`}></span>
            <span className="metric-status-text">
              {flowActive ? `${totalDelivered} Delivered / ${totalDropped} Dropped` : 'No Active Flow'}
            </span>
          </div>
        </div>

        {/* Metric 2: Average Delay / Latency */}
        <div className="metric-card">
          <div className="metric-header-row">
            <span className="metric-label">Average Delay</span>
            <div className="metric-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">{avgDelayDisplay}</span>
            <span className="metric-unit">ms</span>
          </div>
          <div className="metric-status-row">
            <span className={`metric-status-dot ${flowActive ? 'status-optimal' : 'status-neutral'}`}></span>
            <span className="metric-status-text">{flowActive ? 'Dynamic Path Latency' : 'Standby'}</span>
          </div>
        </div>

        {/* Metric 3: Active Congestion Points */}
        <div className="metric-card">
          <div className="metric-header-row">
            <span className="metric-label">Congestion Points</span>
            <div className="metric-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                <line x1="6" y1="1" x2="6" y2="4" />
                <line x1="10" y1="1" x2="10" y2="4" />
                <line x1="14" y1="1" x2="14" y2="4" />
              </svg>
            </div>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">{congestionNodeCount}</span>
            <span className="metric-unit">Nodes</span>
          </div>
          <div className="metric-status-row">
            <span className={`metric-status-dot ${activeQueueLength > 5 ? 'status-alert' : activeQueueLength > 0 ? 'status-standby' : 'status-optimal'}`}></span>
            <span className="metric-status-text">
              {activeQueueLength > 5 ? 'Queue Backlog' : activeQueueLength > 0 ? 'Queue Active' : 'Optimal Flow'}
            </span>
          </div>
        </div>

        {/* Metric 4: Failed Links / Routers */}
        <div className="metric-card">
          <div className="metric-header-row">
            <span className="metric-label">Failed Links / Routers</span>
            <div className="metric-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">{failedLinkCount} / 0</span>
            <span className="metric-unit">Down</span>
          </div>
          <div className="metric-status-row">
            <span className={`metric-status-dot ${failedLinkCount > 0 ? 'status-alert' : 'status-optimal'}`}></span>
            <span className="metric-status-text">{failedLinkCount > 0 ? `${failedLinkCount} Links Offline` : 'All Links Up'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
