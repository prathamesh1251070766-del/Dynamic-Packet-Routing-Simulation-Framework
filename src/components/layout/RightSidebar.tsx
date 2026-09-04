import React from 'react';

interface OperationItem {
  id: string;
  label: string;
  category: 'topology' | 'traffic' | 'simulation' | 'inspect';
  tag: string;
  tagColor: string;
  icon: React.ReactNode;
}

const OPERATIONS: OperationItem[] = [
  {
    id: 'op-add-node',
    label: 'Add Router / Device',
    category: 'topology',
    tag: 'Graph Mutation',
    tagColor: 'cyan',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    )
  },
  {
    id: 'op-add-link',
    label: 'Add Link / Connection',
    category: 'topology',
    tag: 'Edge Weight',
    tagColor: 'cyan',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    )
  },
  {
    id: 'op-send-packet',
    label: 'Send Packet',
    category: 'traffic',
    tag: 'Queue Ingest',
    tagColor: 'emerald',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
    )
  },
  {
    id: 'op-set-priority',
    label: 'Set Packet Priority',
    category: 'traffic',
    tag: 'Heap / QoS',
    tagColor: 'amber',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    )
  },
  {
    id: 'op-link-failure',
    label: 'Simulate Link Failure',
    category: 'simulation',
    tag: 'Dynamic Fault',
    tagColor: 'rose',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    )
  },
  {
    id: 'op-recalc-route',
    label: 'Recalculate Route',
    category: 'simulation',
    tag: 'Dijkstra / BFS',
    tagColor: 'purple',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
    )
  },
  {
    id: 'op-view-table',
    label: 'View Routing Table',
    category: 'inspect',
    tag: 'Hash Table',
    tagColor: 'blue',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="9" y1="3" x2="9" y2="21" />
      </svg>
    )
  },
  {
    id: 'op-view-history',
    label: 'View Packet History',
    category: 'inspect',
    tag: 'Stack / Trace',
    tagColor: 'blue',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    )
  },
  {
    id: 'op-view-stats',
    label: 'View Statistics',
    category: 'inspect',
    tag: 'Telemetry',
    tagColor: 'blue',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    )
  }
];

interface RightSidebarProps {
  onSendPacketClick?: () => void;
  onProcessPacketClick?: () => void;
  onClearQueueClick?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  onSendPacketClick,
  onProcessPacketClick,
  onClearQueueClick
}) => {
  const handleOperationClick = (opId: string) => {
    if ((opId === 'op-send-packet' || opId === 'op-set-priority') && onSendPacketClick) {
      onSendPacketClick();
    } else if (opId === 'op-view-history' && onProcessPacketClick) {
      onProcessPacketClick();
    } else if (opId === 'op-recalc-route' && onClearQueueClick) {
      // reserved for future steps
    }
  };

  return (
    <aside className="sidebar right-sidebar">
      <div className="sidebar-section">
        <div className="section-header">
          <div className="section-title-wrap">
            <svg className="section-icon text-indigo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            <h2 className="section-title">TYPICAL OPERATIONS</h2>
          </div>
          <span className="section-tag">Actions</span>
        </div>

        <p className="operations-intro">
          Operations interface (interactive execution ready for DSA hookup):
        </p>

        <div className="operations-list">
          {OPERATIONS.map((op) => (
            <button
              key={op.id}
              className={`operation-card-btn ${op.id === 'op-send-packet' ? 'op-btn-highlight' : ''}`}
              type="button"
              onClick={() => handleOperationClick(op.id)}
              title={`Trigger ${op.label}`}
            >
              <div className="op-icon-container">
                {op.icon}
              </div>
              <div className="op-details">
                <span className="op-label">{op.label}</span>
                <div className="op-meta-row">
                  <span className={`op-tag tag-${op.tagColor}`}>{op.tag}</span>
                  <span className="op-status-ready">
                    {op.id === 'op-send-packet' ? 'Interactive' : 'Ready'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
