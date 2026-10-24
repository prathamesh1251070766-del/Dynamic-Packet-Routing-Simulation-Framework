import React, { useState } from 'react';
import type { NodeType } from '../../dsa/Graph';

interface CreateNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingNodeIds: string[];
  onCreateNode: (data: {
    id: string;
    name: string;
    type: NodeType;
    ipAddress: string;
  }) => void;
}

export const CreateNodeModal: React.FC<CreateNodeModalProps> = ({
  isOpen,
  onClose,
  existingNodeIds,
  onCreateNode
}) => {
  const [nodeType, setNodeType] = useState<NodeType>('router');
  const [id, setId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [ipAddress, setIpAddress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-generate suggested ID
  const handleTypeChange = (type: NodeType) => {
    setNodeType(type);
    setError(null);
    let prefix = type === 'router' ? 'R' : 'PC-';
    let counter = 1;
    while (existingNodeIds.includes(`${prefix}${counter}`)) {
      counter++;
    }
    const suggestedId = `${prefix}${counter}`;
    setId(suggestedId);
    setName(type === 'router' ? `Core Router ${suggestedId}` : `Workstation ${suggestedId}`);
    setIpAddress(type === 'router' ? `10.0.${counter}.1` : `192.168.1.${counter + 10}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = id.trim().toUpperCase();
    if (!cleanId) {
      setError('Node ID is required.');
      return;
    }
    if (existingNodeIds.includes(cleanId)) {
      setError(`Node ID "${cleanId}" already exists in the graph.`);
      return;
    }

    onCreateNode({
      id: cleanId,
      name: name.trim() || cleanId,
      type: nodeType,
      ipAddress: ipAddress.trim() || `10.0.0.${Math.floor(Math.random() * 250) + 1}`
    });

    // Reset & Close
    setId('');
    setName('');
    setIpAddress('');
    setError(null);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-box bg-cyan-subtle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan">
                <circle cx="12" cy="12" r="9" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <div>
              <h3 className="modal-title">Add Network Topology Node</h3>
              <span className="modal-subtitle">Dynamic Graph Adjacency List Expansion (O(1) addVertex)</span>
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

          {/* Node Classification Selector */}
          <div className="form-group">
            <label className="form-label">Node Classification</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleTypeChange('router')}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: nodeType === 'router' ? '1px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: nodeType === 'router' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: nodeType === 'router' ? '#06b6d4' : '#94a3b8',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>🌐</span> Router Node
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('device')}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: nodeType === 'device' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: nodeType === 'device' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: nodeType === 'device' ? '#10b981' : '#94a3b8',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>💻</span> Host Device / Server
              </button>
            </div>
          </div>

          {/* Node ID */}
          <div className="form-group">
            <label className="form-label" htmlFor="node-id-input">
              Node ID <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="node-id-input"
              type="text"
              className="form-input"
              placeholder={nodeType === 'router' ? 'e.g., R6' : 'e.g., PC-3'}
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                setError(null);
              }}
              required
            />
          </div>

          {/* Node Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="node-name-input">
              Display Name / Role
            </label>
            <input
              id="node-name-input"
              type="text"
              className="form-input"
              placeholder="e.g., Core Router West, Edge Switch"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* IP Address */}
          <div className="form-group">
            <label className="form-label" htmlFor="node-ip-input">
              IP Address
            </label>
            <input
              id="node-ip-input"
              type="text"
              className="form-input"
              placeholder="e.g., 10.0.1.1"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
            />
          </div>

          <div className="modal-dsa-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>
              Adds vertex to <code>Graph.ts</code> adjacency map in <code>O(1)</code> time and automatically calculates Dijkstra routing tables.
            </span>
          </div>

          {/* Modal Actions */}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Node to Topology
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
