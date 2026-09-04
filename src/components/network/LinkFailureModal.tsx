import React from 'react';
import type { NetworkEdge, LinkStatus } from '../../dsa/Graph';

interface LinkFailureModalProps {
  isOpen: boolean;
  onClose: () => void;
  edges: NetworkEdge[];
  onToggleLink: (from: string, to: string, currentStatus: LinkStatus) => void;
}

export const LinkFailureModal: React.FC<LinkFailureModalProps> = ({
  isOpen,
  onClose,
  edges,
  onToggleLink
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-box bg-rose-subtle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div>
              <h3 className="modal-title">Simulate Dynamic Link Failure</h3>
              <span className="modal-subtitle">Triggers Dijkstra Recalculation & Stack Backtracking</span>
            </div>
          </div>
          <button className="modal-close-btn" type="button" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="modal-form">
          <p className="link-failure-intro">
            Toggle links to simulate link down/up events. Active packets will dynamically <strong>backtrack via Stack.pop()</strong> and recalculate alternate paths via Dijkstra.
          </p>

          <div className="link-failure-list">
            {edges.map((edge) => {
              const isFailed = edge.status === 'failed';

              return (
                <div key={`${edge.from}-${edge.to}`} className={`link-failure-row ${isFailed ? 'link-is-failed' : 'link-is-active'}`}>
                  <div className="link-info-col">
                    <div className="link-nodes-title">
                      <span className="node-badge">{edge.from}</span>
                      <span className="link-arrow">⟷</span>
                      <span className="node-badge">{edge.to}</span>
                    </div>
                    <span className="link-metrics">Weight/Cost: {edge.cost} | Bandwidth: {edge.bandwidth} Mbps</span>
                  </div>

                  <div className="link-action-col">
                    <span className={`link-status-badge ${isFailed ? 'badge-failed' : 'badge-active'}`}>
                      {isFailed ? '🔴 DOWN / FAILED' : '🟢 ACTIVE'}
                    </span>
                    <button
                      type="button"
                      className={`btn-toggle-link ${isFailed ? 'btn-recover' : 'btn-fail'}`}
                      onClick={() => onToggleLink(edge.from, edge.to, edge.status)}
                    >
                      {isFailed ? 'Restore Link' : 'Sever Link'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="modal-dsa-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            <span>
              Link status changes are registered onto the <strong>LIFO Action Stack</strong> and can be reversed via <strong>Undo</strong>.
            </span>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
