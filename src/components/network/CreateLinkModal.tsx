import React, { useState } from 'react';
import type { NetworkNode } from '../../dsa/Graph';

interface CreateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: NetworkNode[];
  existingEdges: { from: string; to: string }[];
  onCreateLink: (data: {
    from: string;
    to: string;
    cost: number;
    bandwidth: number;
    bidirectional: boolean;
  }) => void;
}

export const CreateLinkModal: React.FC<CreateLinkModalProps> = ({
  isOpen,
  onClose,
  nodes,
  existingEdges,
  onCreateLink
}) => {
  const [from, setFrom] = useState<string>(nodes[0]?.id || '');
  const [to, setTo] = useState<string>(nodes[1]?.id || '');
  const [cost, setCost] = useState<number>(5);
  const [bandwidth, setBandwidth] = useState<number>(1000);
  const [bidirectional, setBidirectional] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to) {
      setError('Both source and destination nodes must be selected.');
      return;
    }
    if (from === to) {
      setError('Cannot create a link between a node and itself.');
      return;
    }

    const alreadyExists = existingEdges.some(
      (edge) =>
        (edge.from === from && edge.to === to) ||
        (bidirectional && edge.from === to && edge.to === from)
    );

    if (alreadyExists) {
      setError(`A link between ${from} and ${to} already exists.`);
      return;
    }

    onCreateLink({
      from,
      to,
      cost: Math.max(1, cost),
      bandwidth: Math.max(10, bandwidth),
      bidirectional
    });

    setError(null);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-box bg-emerald-subtle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald">
                <circle cx="6" cy="6" r="3" />
                <circle cx="18" cy="18" r="3" />
                <line x1="8.59" y1="8.59" x2="15.42" y2="15.41" />
              </svg>
            </div>
            <div>
              <h3 className="modal-title">Connect Nodes (Weighted Link)</h3>
              <span className="modal-subtitle">Adjacency List Edge with Latency Weight / Cost</span>
            </div>
          </div>
          <button className="modal-close-btn" type="button" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* Modal Form */}
        <form className="modal-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '0.8rem'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Node Selection Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="link-from-select">
                Source Node (From)
              </label>
              <select
                id="link-from-select"
                className="form-select"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setError(null);
                }}
              >
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.name || node.id} ({node.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="link-to-select">
                Target Node (To)
              </label>
              <select
                id="link-to-select"
                className="form-select"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setError(null);
                }}
              >
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.name || node.id} ({node.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cost and Bandwidth Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="link-cost-input">
                Link Weight / Cost (Delay ms)
              </label>
              <input
                id="link-cost-input"
                type="number"
                min="1"
                max="100"
                className="form-input"
                value={cost}
                onChange={(e) => setCost(parseInt(e.target.value, 10) || 1)}
                required
              />
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '3px' }}>
                Dijkstra path metric (lower = faster)
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="link-bandwidth-input">
                Bandwidth (Mbps)
              </label>
              <input
                id="link-bandwidth-input"
                type="number"
                min="10"
                step="50"
                className="form-input"
                value={bandwidth}
                onChange={(e) => setBandwidth(parseInt(e.target.value, 10) || 100)}
                required
              />
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '3px' }}>
                Channel capacity limit
              </span>
            </div>
          </div>

          {/* Bidirectional Option */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
            <input
              type="checkbox"
              id="bidir-checkbox"
              checked={bidirectional}
              onChange={(e) => setBidirectional(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }}
            />
            <label htmlFor="bidir-checkbox" style={{ fontSize: '0.8rem', color: '#e2e8f0', cursor: 'pointer' }}>
              Bidirectional Transmission Link (From ⟷ To)
            </label>
          </div>

          <div className="modal-dsa-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>
              Inserts weighted edge into <code>Graph.ts</code> adjacency list. Dijkstra immediately re-evaluates all network shortest paths.
            </span>
          </div>

          {/* Modal Actions */}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Establish Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
