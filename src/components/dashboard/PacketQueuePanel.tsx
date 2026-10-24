import React from 'react';
import type { Packet } from '../../types/packet';

interface PacketQueuePanelProps {
  packets: Packet[];
  onOpenSendModal: () => void;
  onProcessNext: () => void;
  onClearQueue: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  lastActionDescription?: string;
}

export const PacketQueuePanel: React.FC<PacketQueuePanelProps> = ({
  packets,
  onOpenSendModal,
  onProcessNext,
  onClearQueue,
  onUndo,
  canUndo = false,
  lastActionDescription
}) => {
  const queueSize = packets.length;

  return (
    <div className="dashboard-panel queue-panel-enhanced">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-title-wrap">
          <svg className="panel-icon text-neutral" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
          </svg>
          <h3 className="panel-title">PACKET QUEUE</h3>
        </div>
        <div className="panel-header-badges">
          <span className="queue-counter-badge">
            {queueSize} {queueSize === 1 ? 'Packet' : 'Packets'}
          </span>
          <span className="panel-badge badge-neutral">Min-Heap Priority Queue (O(log N))</span>
        </div>
      </div>

      {/* Queue Toolbar Controls */}
      <div className="queue-controls-bar">
        <button
          type="button"
          className="queue-action-btn btn-enqueue"
          onClick={onOpenSendModal}
          title="Insert a new packet into the Priority Queue"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Enqueue
        </button>

        <button
          type="button"
          className="queue-action-btn btn-process"
          onClick={onProcessNext}
          disabled={queueSize === 0}
          title="Extract Min priority packet (Min-Heap)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          Process (Dequeue)
        </button>

        {onUndo && (
          <button
            type="button"
            className="queue-action-btn btn-undo"
            onClick={onUndo}
            disabled={!canUndo}
            title={lastActionDescription ? `Undo: ${lastActionDescription}` : 'Undo last action (Stack.pop())'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            Undo (Stack LIFO)
          </button>
        )}

        <button
          type="button"
          className="queue-action-btn btn-clear"
          onClick={onClearQueue}
          disabled={queueSize === 0}
          title="Clear all packets from queue"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          Clear
        </button>
      </div>

      {/* Queue Items or Empty State */}
      <div className="panel-body queue-body">
        {queueSize === 0 ? (
          <div className="empty-state-container">
            <div className="empty-state-visual">
              <div className="empty-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="6" width="20" height="12" rx="2" strokeDasharray="3 3" />
                  <line x1="6" y1="12" x2="6.01" y2="12" strokeWidth="3" />
                  <line x1="12" y1="12" x2="12.01" y2="12" strokeWidth="3" />
                  <line x1="18" y1="12" x2="18.01" y2="12" strokeWidth="3" />
                </svg>
              </div>
              <p className="empty-state-message">No packets in queue</p>
              <p className="empty-state-subtext">
                Click <strong>"Enqueue"</strong> to insert packets into the Priority Queue.
              </p>
            </div>
          </div>
        ) : (
          <div className="queue-items-container">
            <div className="queue-flow-header">
              <span className="flow-label front-label">⬅ ROOT (Highest Priority)</span>
              <span className="flow-label rear-label">HEAP LEAVES (Lower Priority) ⬅</span>
            </div>

            <div className="queue-cards-list">
              {packets.map((pkt, index) => {
                const isFront = index === 0;
                const isRear = index === packets.length - 1;
                const priorityLabel = pkt.priority === 3 ? 'Critical' : pkt.priority === 2 ? 'High' : 'Normal';
                const priorityClass = pkt.priority === 3 ? 'priority-p3' : pkt.priority === 2 ? 'priority-p2' : 'priority-p1';

                return (
                  <div key={pkt.packetId} className={`packet-card ${isFront ? 'packet-card-front' : ''}`}>
                    <div className="packet-header-row">
                      <div className="packet-id-group">
                        <span className="packet-id">{pkt.packetId}</span>
                        {isFront && <span className="front-badge">FRONT</span>}
                        {isRear && queueSize > 1 && <span className="rear-badge">REAR</span>}
                      </div>
                      <span className={`priority-pill ${priorityClass}`}>{priorityLabel}</span>
                    </div>

                    <div className="packet-route-row">
                      <span className="node-tag src-tag">{pkt.source}</span>
                      <svg className="route-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                      <span className="node-tag dst-tag">{pkt.destination}</span>
                    </div>

                    <div className="packet-payload-text" title={pkt.payload}>
                      {pkt.payload}
                    </div>

                    <div className="packet-footer-row">
                      <span className="packet-meta">{pkt.sizeBytes} B</span>
                      <span className="packet-meta">{pkt.createdAt}</span>
                      <span className="packet-status-badge status-queued">QUEUED</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
