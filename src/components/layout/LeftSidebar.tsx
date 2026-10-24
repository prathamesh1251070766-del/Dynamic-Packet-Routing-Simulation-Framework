import React from 'react';

export interface LeftSidebarProps {
  onAddRouter?: () => void;
  onAddDevice?: () => void;
  onAddConnection?: () => void;
  onOpenFailureModal?: () => void;
  selectedNodeId?: string | null;
  selectedEdge?: { from: string; to: string } | null;
  selectedNode?: { id: string; name?: string; type: string; status: string; ipAddress?: string } | null;
  selectedEdgeData?: { from: string; to: string; cost: number; status: string } | null;
  onToggleFailure?: () => void;
  onDeleteSelected?: () => void;
  onClearGraph?: () => void;
  totalNodes?: number;
  totalEdges?: number;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
  onAddRouter,
  onAddDevice,
  onAddConnection,
  onOpenFailureModal,
  selectedNodeId,
  selectedEdge,
  selectedNode,
  selectedEdgeData,
  onToggleFailure,
  onDeleteSelected,
  onClearGraph,
  totalNodes = 0,
  totalEdges = 0
}) => {
  const hasSelection = Boolean(selectedNodeId || selectedEdge);

  return (
    <aside className="sidebar left-sidebar">
      {/* SECTION 1: NETWORK CONTROLS */}
      <div className="sidebar-section">
        <div className="section-header">
          <div className="section-title-wrap">
            <svg className="section-icon text-neutral" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            <div className="btn-icon-box bg-neutral-subtle">
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
            <div className="btn-icon-box bg-neutral-subtle">
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
            <div className="btn-icon-box bg-neutral-subtle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="6" cy="6" r="3" />
                <circle cx="18" cy="18" r="3" />
                <line x1="8.59" y1="8.59" x2="15.42" y2="15.41" />
              </svg>
            </div>
            <div className="btn-text-content">
              <span className="btn-label">Add Connection</span>
              <span className="btn-subtext">Weighted transmission link</span>
            </div>
          </button>

          <button className="control-btn" type="button" onClick={onOpenFailureModal} title="Simulate link failures in network">
            <div className="btn-icon-box bg-rose-subtle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div className="btn-text-content">
              <span className="btn-label">Simulate Failure</span>
              <span className="btn-subtext">Toggle links down/up</span>
            </div>
          </button>
        </div>
      </div>

      {/* SECTION 2: ELEMENT INSPECTOR & ACTIONS */}
      <div className="sidebar-section inspector-section">
        <div className="section-header">
          <div className="section-title-wrap">
            <svg className="section-icon text-neutral" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <h2 className="section-title">INSPECTOR &amp; ACTIONS</h2>
          </div>
          <span className={`section-tag ${hasSelection ? 'tag-amber' : ''}`}>
            {hasSelection ? 'Selected' : 'Idle'}
          </span>
        </div>

        {selectedNodeId && selectedNode ? (
          <div className="inspector-card">
            <div className="inspector-meta-row">
              <span className="inspector-title">{selectedNode.name || selectedNode.id}</span>
              <span className={`inspector-status-pill ${selectedNode.status === 'active' ? 'pill-status-active' : 'pill-status-failed'}`}>
                {selectedNode.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="inspector-details-list">
              <div className="inspector-detail-item">
                <span className="detail-key">Node Type:</span>
                <span className="detail-val">{selectedNode.type === 'device' ? 'Host Device' : 'Network Router'}</span>
              </div>
              {selectedNode.ipAddress && (
                <div className="inspector-detail-item">
                  <span className="detail-key">IP Address:</span>
                  <span className="detail-val font-mono">{selectedNode.ipAddress}</span>
                </div>
              )}
            </div>

            <div className="inspector-actions">
              <button 
                type="button" 
                className={`action-btn ${selectedNode.status === 'active' ? 'btn-warn' : 'btn-success'}`}
                onClick={onToggleFailure}
                title="Toggle node active or inactive state"
              >
                {selectedNode.status === 'active' ? 'Disable Node' : 'Enable Node'}
              </button>
              <button 
                type="button" 
                className="action-btn btn-danger"
                onClick={onDeleteSelected}
                title="Remove node from network topology"
              >
                Delete Node
              </button>
            </div>
          </div>
        ) : selectedEdge && selectedEdgeData ? (
          <div className="inspector-card">
            <div className="inspector-meta-row">
              <span className="inspector-title font-mono">{selectedEdge.from} ⟷ {selectedEdge.to}</span>
              <span className={`inspector-status-pill ${selectedEdgeData.status === 'active' ? 'pill-status-active' : 'pill-status-failed'}`}>
                {selectedEdgeData.status === 'active' ? 'Link Up' : 'Link Down'}
              </span>
            </div>

            <div className="inspector-details-list">
              <div className="inspector-detail-item">
                <span className="detail-key">Link Cost:</span>
                <span className="detail-val font-mono">{selectedEdgeData.cost}</span>
              </div>
              <div className="inspector-detail-item">
                <span className="detail-key">Routing State:</span>
                <span className="detail-val">{selectedEdgeData.status === 'active' ? 'Operational' : 'Simulated Fault'}</span>
              </div>
            </div>

            <div className="inspector-actions">
              <button 
                type="button" 
                className={`action-btn ${selectedEdgeData.status === 'active' ? 'btn-warn' : 'btn-success'}`}
                onClick={onToggleFailure}
                title="Toggle link active or failed status"
              >
                {selectedEdgeData.status === 'active' ? 'Sever Link' : 'Restore Link'}
              </button>
              <button 
                type="button" 
                className="action-btn btn-danger"
                onClick={onDeleteSelected}
                title="Delete this link from topology"
              >
                Delete Link
              </button>
            </div>
          </div>
        ) : (
          <div className="inspector-empty-card">
            <p className="inspector-empty-text">
              Select any node or link on the canvas to inspect its properties, reposition it, or simulate link/node failure.
            </p>
            {onClearGraph && (
              <button 
                type="button" 
                className="action-btn btn-clear-topology" 
                onClick={onClearGraph}
                title="Reset network graph"
              >
                Clear Network Graph
              </button>
            )}
          </div>
        )}
      </div>

      {/* SECTION 3: TOPOLOGY SUMMARY */}
      <div className="sidebar-section summary-section">
        <div className="section-header">
          <div className="section-title-wrap">
            <svg className="section-icon text-neutral" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            <h2 className="section-title">TOPOLOGY OVERVIEW</h2>
          </div>
          <span className="section-tag">Stats</span>
        </div>

        <div className="topology-stats-grid">
          <div className="stat-box">
            <span className="stat-box-label">Vertices</span>
            <span className="stat-box-number">{totalNodes}</span>
          </div>
          <div className="stat-box">
            <span className="stat-box-label">Links</span>
            <span className="stat-box-number">{totalEdges}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
