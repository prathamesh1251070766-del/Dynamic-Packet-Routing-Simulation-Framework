import React from 'react';

interface DSAItem {
  id: string;
  name: string;
  role: string;
  complexity: string;
  colorClass: string;
  icon: string;
}

interface LeftSidebarProps {
  hashTableStats?: {
    storedRoutes: number;
    lastLookupKey?: string;
    isHit?: boolean;
  };
  onAddRouter?: () => void;
  onAddDevice?: () => void;
  onAddConnection?: () => void;
}

const DSA_STRUCTURES: DSAItem[] = [
  {
    id: 'graph',
    name: 'Graph',
    role: 'Adjacency List topology & network mesh',
    complexity: 'V + E',
    colorClass: 'cyan',
    icon: '🕸️'
  },
  {
    id: 'queue',
    name: 'Queue',
    role: 'FIFO router packet ingestion buffers',
    complexity: 'O(1) Enqueue',
    colorClass: 'blue',
    icon: '📥'
  },
  {
    id: 'dll',
    name: 'Doubly Linked List',
    role: 'Dynamic packet timeline & buffer manipulation',
    complexity: 'O(1) Insert/Del',
    colorClass: 'indigo',
    icon: '🔗'
  },
  {
    id: 'hash_table',
    name: 'Hash Table',
    role: 'O(1) Routing table & destination lookup dictionary',
    complexity: 'O(1) Avg',
    colorClass: 'purple',
    icon: '⚡'
  },
  {
    id: 'priority_queue',
    name: 'Priority Queue / Heap',
    role: 'Dijkstra shortest path & QoS packet priority',
    complexity: 'O(log N)',
    colorClass: 'emerald',
    icon: '🏔️'
  },
  {
    id: 'stack',
    name: 'Stack',
    role: 'Route backtracking, undo operations & packet trace',
    complexity: 'O(1) LIFO',
    colorClass: 'amber',
    icon: '📚'
  },
  {
    id: 'set',
    name: 'Set',
    role: 'Visited node tracking & cycle avoidance',
    complexity: 'O(1) Lookup',
    colorClass: 'rose',
    icon: '🎯'
  },
  {
    id: 'sorting_searching',
    name: 'Sorting & Searching',
    role: 'Link cost optimization & metric lookup',
    complexity: 'O(N log N)',
    colorClass: 'blue',
    icon: '🔍'
  }
];

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
  hashTableStats,
  onAddRouter,
  onAddDevice,
  onAddConnection
}) => {
  return (
    <aside className="sidebar left-sidebar">
      {/* SECTION 1: NETWORK CONTROLS */}
      <div className="sidebar-section">
        <div className="section-header">
          <div className="section-title-wrap">
            <svg className="section-icon text-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <h2 className="section-title">NETWORK CONTROLS</h2>
          </div>
          <span className="section-tag">Topology</span>
        </div>

        <div className="control-button-group">
          <button className="control-btn" type="button" onClick={onAddRouter} title="Add a routing node to topology">
            <div className="btn-icon-box bg-cyan-subtle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <div className="btn-text-content">
              <span className="btn-label">Add Router</span>
              <span className="btn-subtext">Insert routing node (Rx)</span>
            </div>
          </button>

          <button className="control-btn" type="button" onClick={onAddDevice} title="Add end-user terminal or server">
            <div className="btn-icon-box bg-emerald-subtle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="12" rx="2" />
                <line x1="6" y1="20" x2="18" y2="20" />
                <line x1="12" y1="16" x2="12" y2="20" />
              </svg>
            </div>
            <div className="btn-text-content">
              <span className="btn-label">Add Device</span>
              <span className="btn-subtext">Host / Terminal endpoint</span>
            </div>
          </button>

          <button className="control-btn" type="button" onClick={onAddConnection} title="Create weighted edge between nodes">
            <div className="btn-icon-box bg-indigo-subtle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="6" cy="6" r="3" />
                <circle cx="18" cy="18" r="3" />
                <line x1="8.59" y1="8.59" x2="15.42" y2="15.41" />
              </svg>
            </div>
            <div className="btn-text-content">
              <span className="btn-label">Add Connection</span>
              <span className="btn-subtext">Weighted link / transmission edge</span>
            </div>
          </button>
        </div>
      </div>

      {/* SECTION 2: DSA STRUCTURES USED */}
      <div className="sidebar-section dsa-section">
        <div className="section-header">
          <div className="section-title-wrap">
            <svg className="section-icon text-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <h2 className="section-title">DSA STRUCTURES USED</h2>
          </div>
          <span className="section-tag">8 Core</span>
        </div>

        <p className="dsa-intro-text">
          Fundamental data structures powering the network simulation engine:
        </p>

        <div className="dsa-list">
          {DSA_STRUCTURES.map((item) => {
            const isHashTable = item.id === 'hash_table';

            return (
              <div key={item.id} className={`dsa-card dsa-${item.colorClass}`}>
                <div className="dsa-header-row">
                  <div className="dsa-name-wrap">
                    <span className="dsa-icon">{item.icon}</span>
                    <span className="dsa-name">{item.name}</span>
                  </div>
                  <span className="dsa-complexity">
                    {isHashTable && hashTableStats
                      ? `${hashTableStats.storedRoutes} Keys | O(1)`
                      : item.complexity}
                  </span>
                </div>
                <p className="dsa-role">{item.role}</p>

                {isHashTable && hashTableStats && (
                  <div className="dsa-live-tag">
                    <span className="live-dot-purple"></span>
                    <span>
                      {hashTableStats.lastLookupKey
                        ? `Last Probe: "${hashTableStats.lastLookupKey}" (${hashTableStats.isHit ? '✓ Hit' : '✖ Miss'})`
                        : `${hashTableStats.storedRoutes} Active Routes Loaded`}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
