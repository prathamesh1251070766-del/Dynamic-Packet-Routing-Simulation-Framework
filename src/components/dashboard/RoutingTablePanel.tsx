import React, { useState } from 'react';
import type { CachedRouteRecord } from '../../dsa/Dijkstra';
import { HashTable, type HashTableDiagnostics } from '../../dsa/HashTable';

interface RoutingTablePanelProps {
  routingHashTable: HashTable<CachedRouteRecord>;
  sourceRouter?: string;
  onSelectRouter?: (routerId: string) => void;
  availableRouters?: Array<{ id: string; name: string }>;
  onLookupRoute?: (destinationId: string) => void;
}

export const RoutingTablePanel: React.FC<RoutingTablePanelProps> = ({
  routingHashTable,
  sourceRouter = 'R1',
  onSelectRouter,
  availableRouters = []
}) => {
  // Sourced directly from custom HashTable data structure
  const entries: CachedRouteRecord[] = routingHashTable.values();
  const diagnostics: HashTableDiagnostics = routingHashTable.getDiagnostics();

  // Interactive Route Lookup State
  const defaultTarget = availableRouters.find((r) => r.id !== sourceRouter)?.id || 'R5';
  const [lookupTarget, setLookupTarget] = useState<string>(defaultTarget);
  const [activeLookupResult, setActiveLookupResult] = useState<CachedRouteRecord | null | 'not_found'>(null);
  const [lastLookupKey, setLastLookupKey] = useState<string>('');

  const handlePerformLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupTarget) return;

    // Direct O(1) Hash Table Lookup
    const route = routingHashTable.get(lookupTarget);
    setLastLookupKey(lookupTarget);

    if (route) {
      setActiveLookupResult(route);
    } else {
      setActiveLookupResult('not_found');
    }
  };

  return (
    <div className="dashboard-panel routing-panel-enhanced">
      {/* Header */}
      <div className="panel-header">
        <div className="panel-title-wrap">
          <svg className="panel-icon text-indigo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          <h3 className="panel-title">ROUTING TABLE</h3>
        </div>

        <div className="routing-header-actions">
          {availableRouters.length > 0 && onSelectRouter && (
            <select
              className="router-table-select"
              value={sourceRouter}
              onChange={(e) => {
                onSelectRouter(e.target.value);
                setActiveLookupResult(null);
              }}
              title="Select Source Router to inspect Forwarding Hash Table"
            >
              {availableRouters.map((r) => (
                <option key={r.id} value={r.id}>
                  Node {r.id}
                </option>
              ))}
            </select>
          )}
          <span className="panel-badge badge-purple">Hash Table O(1)</span>
        </div>
      </div>

      {/* Interactive O(1) Route Lookup Bar */}
      <form onSubmit={handlePerformLookup} className="route-lookup-bar">
        <div className="lookup-input-group">
          <span className="lookup-label">O(1) Route Lookup:</span>
          <select
            className="lookup-select"
            value={lookupTarget}
            onChange={(e) => setLookupTarget(e.target.value)}
          >
            {availableRouters
              .filter((r) => r.id !== sourceRouter)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  Target {r.id} ({r.name || r.id})
                </option>
              ))}
          </select>
          <button type="submit" className="btn-lookup">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Query
          </button>
        </div>

        {/* Live Lookup Result Display */}
        {activeLookupResult && (
          <div className={`lookup-result-card ${activeLookupResult === 'not_found' ? 'result-miss' : 'result-hit'}`}>
            {activeLookupResult === 'not_found' ? (
              <div className="result-miss-content">
                <span className="miss-tag">⚠️ Route Not Found</span>
                <span className="miss-text">No path in Hash Table for destination "{lastLookupKey}"</span>
              </div>
            ) : (
              <div className="result-hit-content">
                <div className="hit-header">
                  <span className="hit-badge">✓ Hash Table Hit (O(1))</span>
                  <span className="hit-dest">Destination: <strong>{activeLookupResult.destinationId}</strong></span>
                  <span className="hit-cost">Cost: <strong>{activeLookupResult.cost}</strong></span>
                  <span className="hit-next">Next Hop: <strong>{activeLookupResult.nextHop}</strong></span>
                </div>
                {activeLookupResult.path && activeLookupResult.path.length > 0 && (
                  <div className="hit-path-row">
                    <span className="hit-path-label">Dijkstra Path:</span>
                    <span className="hit-path-val">{activeLookupResult.path.join(' ➔ ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </form>

      {/* Main Table Body (Sourced from HashTable) */}
      <div className="panel-body table-container">
        {entries.length === 0 ? (
          <div className="empty-state-container">
            <p className="empty-state-message">No routing table entries</p>
          </div>
        ) : (
          <table className="routing-table">
            <thead>
              <tr>
                <th>Destination</th>
                <th>Next Hop</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((row) => {
                const isUnreachable = row.status === 'unreachable';

                return (
                  <tr key={row.destinationId} className={`table-row-live ${isUnreachable ? 'row-unreachable' : ''}`}>
                    <td className="cell-destination">
                      <span className={`node-indicator ${isUnreachable ? 'indicator-red' : 'indicator-green'}`}></span>
                      <span className="dest-name">{row.destinationName}</span>
                    </td>
                    <td className="cell-nexthop">
                      <span className={isUnreachable ? 'text-rose' : 'text-cyan'}>
                        {row.nextHop}
                      </span>
                    </td>
                    <td className="cell-cost">
                      <span className={`cost-tag ${isUnreachable ? 'cost-infinite' : 'cost-optimal'}`}>
                        {row.cost}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Footer Note with Real HashTable Diagnostics */}
        <div className="table-caption-note">
          <div className="caption-stats-row">
            <span>* Hash Table: <strong>{diagnostics.size} Keys</strong></span>
            <span>Capacity: <strong>{diagnostics.capacity} Buckets</strong></span>
            <span>Collisions: <strong>{diagnostics.collisions}</strong></span>
            <span>Lookup: <strong>O(1) Avg</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
