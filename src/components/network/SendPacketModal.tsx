import React, { useState } from 'react';
import type { NetworkNode } from '../../dsa/Graph';
import type { PacketPriority } from '../../types/packet';

interface SendPacketModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: NetworkNode[];
  onSendPacket: (data: {
    source: string;
    destination: string;
    payload: string;
    priority: PacketPriority;
    sizeBytes: number;
  }) => void;
}

const PRESET_PAYLOADS: string[] = [
  'HTTP GET /api/telemetry',
  'VoIP Audio Packet (RTP)',
  'Sensor Data (Temp & Latency)',
  'Database Query SELECT *',
  'DNS Resolve request.org',
  'Video Stream Chunk #104'
];

const FALLBACK_NODES: NetworkNode[] = [
  { id: 'R1', name: 'R1 (Source)', type: 'router', ipAddress: '10.0.1.1', status: 'active' },
  { id: 'R5', name: 'R5 (Destination)', type: 'router', ipAddress: '10.0.1.5', status: 'active' }
];

export const SendPacketModal: React.FC<SendPacketModalProps> = ({
  isOpen,
  onClose,
  nodes,
  onSendPacket
}) => {
  const routerAndDeviceNodes = nodes.length > 0 ? nodes : FALLBACK_NODES;

  const [source, setSource] = useState<string>(routerAndDeviceNodes[0]?.id || 'R1');
  const [destination, setDestination] = useState<string>(
    routerAndDeviceNodes.length > 1 ? routerAndDeviceNodes[routerAndDeviceNodes.length - 1].id : 'R5'
  );
  const [payload, setPayload] = useState<string>('HTTP GET /api/telemetry');
  const [priority, setPriority] = useState<PacketPriority>(1);
  const [sizeBytes, setSizeBytes] = useState<number>(512);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!source || !destination) return;

    onSendPacket({
      source,
      destination,
      payload: payload.trim() || 'Generic Packet Payload',
      priority,
      sizeBytes
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </div>
            <div>
              <h3 className="modal-title">Create & Enqueue Packet</h3>
              <span className="modal-subtitle">Direct FIFO Packet Ingestion</span>
            </div>
          </div>
          <button className="modal-close-btn" type="button" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Source & Destination Row */}
          <div className="form-grid-row">
            <div className="form-group">
              <label className="form-label" htmlFor="source-node">
                SOURCE NODE:
              </label>
              <select
                id="source-node"
                className="form-select"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                {routerAndDeviceNodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.name || node.id} ({node.ipAddress || '10.0.1.x'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="destination-node">
                DESTINATION NODE:
              </label>
              <select
                id="destination-node"
                className="form-select"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              >
                {routerAndDeviceNodes.map((node) => (
                  <option key={node.id} value={node.id} disabled={node.id === source}>
                    {node.name || node.id} ({node.ipAddress || '10.0.1.x'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payload / Label */}
          <div className="form-group">
            <label className="form-label" htmlFor="payload-input">
              PACKET PAYLOAD / DESCRIPTION:
            </label>
            <input
              id="payload-input"
              type="text"
              className="form-input"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              placeholder="e.g., Sensor Telemetry Stream"
              required
            />
            {/* Preset quick pills */}
            <div className="preset-pills">
              <span className="preset-label">Presets:</span>
              {PRESET_PAYLOADS.slice(0, 3).map((item) => (
                <button
                  key={item}
                  type="button"
                  className="preset-pill"
                  onClick={() => setPayload(item)}
                >
                  {item.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Priority & Size */}
          <div className="form-grid-row">
            <div className="form-group">
              <label className="form-label">PACKET PRIORITY:</label>
              <div className="priority-options">
                <button
                  type="button"
                  className={`priority-btn ${priority === 1 ? 'active-priority-1' : ''}`}
                  onClick={() => setPriority(1)}
                >
                  Normal (P1)
                </button>
                <button
                  type="button"
                  className={`priority-btn ${priority === 2 ? 'active-priority-2' : ''}`}
                  onClick={() => setPriority(2)}
                >
                  High (P2)
                </button>
                <button
                  type="button"
                  className={`priority-btn ${priority === 3 ? 'active-priority-3' : ''}`}
                  onClick={() => setPriority(3)}
                >
                  Critical (P3)
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">PACKET SIZE:</label>
              <div className="size-options">
                {[64, 512, 1500].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    className={`size-btn ${sizeBytes === sz ? 'active-size' : ''}`}
                    onClick={() => setSizeBytes(sz)}
                  >
                    {sz} B
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* DSA Architecture Note */}
          <div className="modal-dsa-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
            <span>
              Invokes <code>queue.enqueue(packet)</code> with <strong>O(1)</strong> rear insertion.
            </span>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Enqueue Packet (FIFO)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
