import React from 'react';
import type { PacketHistoryItem } from '../../types/packet';

interface PacketHistoryPanelProps {
  historyRecords: PacketHistoryItem[];
  onClearHistory?: () => void;
}

export const PacketHistoryPanel: React.FC<PacketHistoryPanelProps> = ({
  historyRecords = [],
  onClearHistory
}) => {
  const count = historyRecords.length;

  return (
    <div className="dashboard-panel history-panel-enhanced">
      <div className="panel-header">
        <div className="panel-title-wrap">
          <svg className="panel-icon text-neutral" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <h3 className="panel-title">PACKET HISTORY</h3>
        </div>
        <div className="panel-header-badges">
          <span className="history-counter-badge">{count} Logged</span>
          <span className="panel-badge badge-neutral">Doubly Linked List + Stack</span>
        </div>
      </div>

      <div className="panel-body history-panel-body">
        {count === 0 ? (
          <div className="empty-state-container">
            <div className="empty-state-visual">
              <div className="empty-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <line x1="10" y1="9" x2="8" y2="9" />
                </svg>
              </div>
              <p className="empty-state-message">No packet history available</p>
              <p className="empty-state-subtext">
                Transmissions recorded via Doubly Linked List with LIFO Stack traces.
              </p>
            </div>
          </div>
        ) : (
          <div className="history-list-container">
            {historyRecords.map((item) => {
              const isDelivered = item.status === 'delivered';

              return (
                <div key={item.recordId} className={`history-log-item ${isDelivered ? 'history-success' : 'history-dropped'}`}>
                  <div className="history-log-top">
                    <div className="history-id-wrap">
                      <span className="history-pkt-id">{item.packetId}</span>
                      <span className={`history-status-tag ${isDelivered ? 'tag-delivered' : 'tag-dropped'}`}>
                        {isDelivered ? 'DELIVERED' : 'DROPPED'}
                      </span>
                      {item.wasBacktracked && (
                        <span className="history-backtrack-tag" title="Recovered via Stack.pop() backtracking">
                          ↩ Backtracked
                        </span>
                      )}
                    </div>
                    <span className="history-time">{item.timestamp}</span>
                  </div>

                  <div className="history-route-row">
                    <span className="history-node-text">{item.source}</span>
                    <span className="route-arrow-txt">➜</span>
                    <span className="history-node-text">{item.destination}</span>
                    <span className="history-cost-tag">Cost: {item.totalCost}</span>
                    <span className="history-latency-tag">{item.latencyMs}ms</span>
                  </div>

                  {/* LIFO Stack Trace Section */}
                  {item.stackTrace && item.stackTrace.length > 0 && (
                    <div className="history-stack-trace">
                      <span className="stack-trace-label">Stack Trace (LIFO):</span>
                      <span className="stack-trace-nodes">
                        <strong className="stack-top-marker">TOP</strong> ➜ {item.stackTrace.join(' ➜ ')}
                      </span>
                    </div>
                  )}

                  {item.failureReason && (
                    <div className="history-failure-reason">
                      ⚠️ {item.failureReason}
                    </div>
                  )}

                  <div className="history-payload-row">
                    <span className="payload-snippet">Payload: {item.payload}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {count > 0 && onClearHistory && (
        <div className="history-footer-bar">
          <button type="button" className="btn-clear-history" onClick={onClearHistory}>
            Clear History Timeline
          </button>
        </div>
      )}
    </div>
  );
};
