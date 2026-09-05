import React from 'react';
import { Graph, type NetworkNode, type NetworkEdge } from '../../dsa/Graph';

export interface ActiveTransmissionState {
  packetId: string;
  source: string;
  destination: string;
  path: string[];
  currentHopIndex: number;
  status: 'transmitting' | 'delivered' | 'dropped';
  payload?: string;
  totalCost?: number;
  routingAlgorithm?: string;
  reason?: string;
}

interface NetworkCanvasProps {
  graph: Graph;
  activeTransmission?: ActiveTransmissionState | null;
}

// Fallback layout coordinates if a node has no explicit position
const DEFAULT_NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  R1: { x: 180, y: 120 },
  R2: { x: 620, y: 120 },
  R3: { x: 400, y: 230 },
  R4: { x: 180, y: 340 },
  R5: { x: 620, y: 340 }
};

export const NetworkCanvas: React.FC<NetworkCanvasProps> = ({ graph, activeTransmission }) => {
  // Dynamically obtain nodes and edges from the real Graph data structure
  const nodes: NetworkNode[] = graph.getAllNodes();
  const uniqueEdges: NetworkEdge[] = graph.getAllEdges(true);

  const routerCount = nodes.filter((n) => n.type === 'router').length;
  const deviceCount = nodes.filter((n) => n.type === 'device').length;
  const linkCount = uniqueEdges.length;

  // Helper to resolve node coordinates
  const getNodeCoord = (nodeId: string): { x: number; y: number } => {
    const node = graph.getNode(nodeId);
    if (node && node.position) {
      return node.position;
    }
    if (DEFAULT_NODE_POSITIONS[nodeId]) {
      return DEFAULT_NODE_POSITIONS[nodeId];
    }
    // Generic placement circle if custom nodes added
    const index = nodes.findIndex((n) => n.id === nodeId);
    const total = Math.max(nodes.length, 1);
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    return {
      x: 400 + 200 * Math.cos(angle),
      y: 230 + 130 * Math.sin(angle)
    };
  };

  // Helper to check if an edge is part of the active transmission path
  const isEdgeInActivePath = (from: string, to: string): boolean => {
    if (!activeTransmission || !activeTransmission.path || activeTransmission.path.length < 2) {
      return false;
    }
    const path = activeTransmission.path;
    for (let i = 0; i < path.length - 1; i++) {
      if (
        (path[i] === from && path[i + 1] === to) ||
        (path[i] === to && path[i + 1] === from)
      ) {
        return true;
      }
    }
    return false;
  };

  // Active packet coordinate if currently transmitting
  const currentHopNodeId = activeTransmission && activeTransmission.path.length > 0
    ? activeTransmission.path[Math.min(activeTransmission.currentHopIndex, activeTransmission.path.length - 1)]
    : null;
  const activePacketCoord = currentHopNodeId ? getNodeCoord(currentHopNodeId) : null;

  return (
    <section className="network-topology-card">
      <div className="topology-card-header">
        <div className="topology-title-wrap">
          <svg className="topology-header-icon text-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <div>
            <h2 className="topology-title">NETWORK TOPOLOGY</h2>
            <span className="topology-subtitle">Dijkstra Shortest-Path Visualization & Mesh Canvas</span>
          </div>
        </div>

        <div className="topology-header-controls">
          <div className="topology-badge-group">
            <span className="topology-pill pill-cyan">
              {routerCount} {routerCount === 1 ? 'Router' : 'Routers'}
              {deviceCount > 0 ? ` + ${deviceCount} Devices` : ''}
            </span>
            <span className="topology-pill pill-indigo">
              {linkCount} {linkCount === 1 ? 'Bidirectional Link' : 'Bidirectional Links'}
            </span>
            <span className="topology-pill pill-purple">Dijkstra Engine Active</span>
          </div>
        </div>
      </div>

      <div className="canvas-wrapper">
        {/* Graph Status / Transmission Banner */}
        <div className="canvas-placeholder-banner">
          {activeTransmission ? (
            activeTransmission.status === 'dropped' ? (
              <div className="banner-badge banner-dropped">
                <span className="status-dot-inline bg-rose"></span>
                <span>
                  <strong>UNREACHABLE:</strong> {activeTransmission.packetId} ({activeTransmission.source} ✖ {activeTransmission.destination}) — No active path via Dijkstra
                </span>
              </div>
            ) : (
              <div className={`banner-badge ${activeTransmission.status === 'delivered' ? 'banner-delivered' : 'banner-transmitting'}`}>
                <span className="pulse-indicator status-dot-inline"></span>
                <span>
                  <strong>DIJKSTRA OPTIMAL:</strong> {activeTransmission.packetId} [{activeTransmission.source} ➜ {activeTransmission.destination}] | Route: {activeTransmission.path.join(' ➔ ')} | Cost: {activeTransmission.totalCost ?? 0}
                </span>
              </div>
            )
          ) : (
            <div className="banner-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="banner-icon">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              <span>LIVE CUSTOM GRAPH MODEL — ADJACENCY LIST (V: {nodes.length}, E: {linkCount * 2} DIRECTED)</span>
            </div>
          )}
        </div>

        {/* SVG Network Graph Visualization Area */}
        <svg className="topology-svg-canvas" viewBox="0 0 800 460">
          <defs>
            {/* Background Grid Pattern */}
            <pattern id="canvas-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
              <circle cx="40" cy="40" r="1.5" fill="rgba(255, 255, 255, 0.1)" />
            </pattern>

            {/* Glowing filters for Nodes */}
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-rose" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Canvas Background */}
          <rect width="100%" height="100%" fill="url(#canvas-grid)" />

          {/* Dynamic Links / Edges Rendered from Graph */}
          <g className="graph-links" strokeLinecap="round">
            {uniqueEdges.map((edge) => {
              const src = getNodeCoord(edge.from);
              const dst = getNodeCoord(edge.to);
              const isFailed = edge.status === 'failed';
              const isInActivePath = isEdgeInActivePath(edge.from, edge.to);

              const isCoreLink = (edge.from === 'R1' && edge.to === 'R3') || (edge.from === 'R3' && edge.to === 'R5') ||
                                 (edge.from === 'R3' && edge.to === 'R1') || (edge.from === 'R5' && edge.to === 'R3');

              const strokeColor = isFailed
                ? '#f43f5e'
                : isInActivePath
                ? '#10b981'
                : isCoreLink
                ? '#3b82f6'
                : '#334e7a';

              const strokeWidth = isInActivePath ? 4 : isCoreLink ? 2.5 : 2;
              const strokeDash = isFailed ? '4 4' : isInActivePath ? 'none' : isCoreLink ? 'none' : '6 4';

              return (
                <g key={`${edge.from}-${edge.to}`}>
                  {/* Underlay glow for active Dijkstra shortest path link */}
                  {isInActivePath && (
                    <line
                      x1={src.x}
                      y1={src.y}
                      x2={dst.x}
                      y2={dst.y}
                      stroke="#00e5ff"
                      strokeWidth={8}
                      strokeOpacity={0.4}
                      filter="url(#glow-cyan)"
                    />
                  )}
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={dst.x}
                    y2={dst.y}
                    stroke={strokeColor === '#10b981' ? '#00e5ff' : strokeColor === '#334e7a' ? '#cbd5e1' : strokeColor === '#3b82f6' ? '#cbd5e1' : strokeColor}
                    strokeWidth={isInActivePath ? 3 : isCoreLink ? 2 : 1.5}
                    strokeDasharray={strokeDash}
                    strokeOpacity={isFailed ? 0.3 : 0.8}
                  />
                </g>
              );
            })}
          </g>

          {/* Dynamic Link Cost Badges Rendered from Graph */}
          <g className="link-costs" fontSize="11" fontFamily="'JetBrains Mono', monospace" textAnchor="middle">
            {uniqueEdges.map((edge) => {
              const src = getNodeCoord(edge.from);
              const dst = getNodeCoord(edge.to);
              const midX = (src.x + dst.x) / 2;
              const midY = (src.y + dst.y) / 2;
              const isFailed = edge.status === 'failed';
              const isInActivePath = isEdgeInActivePath(edge.from, edge.to);

              return (
                <g key={`cost-${edge.from}-${edge.to}`} transform={`translate(${midX}, ${midY})`}>
                  <rect
                    x="-28"
                    y="-11"
                    width="56"
                    height="22"
                    rx="4"
                    fill="#080B10"
                    stroke={isFailed ? '#f43f5e' : isInActivePath ? '#00e5ff' : '#475569'}
                    strokeWidth={isInActivePath ? 1.5 : 1}
                  />
                  <text y="4" fill={isFailed ? '#f43f5e' : isInActivePath ? '#00e5ff' : '#f8fafc'} fontWeight={isInActivePath ? '700' : '500'}>
                    cost: {edge.cost}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Dynamic Router & Device Nodes Rendered from Graph */}
          <g className="graph-nodes">
            {nodes.map((node) => {
              const coord = getNodeCoord(node.id);
              const isRouter = node.type === 'router';
              const isSource = node.id === 'R1';
              const isDestination = node.id === 'R5';
              const isCoreHub = node.id === 'R3';
              const isInactive = node.status === 'inactive';

              const isInActivePath = activeTransmission?.path?.includes(node.id) || false;
              const isCurrentPacketHop = currentHopNodeId === node.id;
              const isDroppedSource = activeTransmission?.status === 'dropped' && node.id === activeTransmission.source;

              const strokeColor = isInactive
                ? '#64748b'
                : isDroppedSource
                ? '#f43f5e'
                : isCurrentPacketHop
                ? '#10b981'
                : isInActivePath
                ? '#34d399'
                : isSource
                ? '#38bdf8'
                : isDestination
                ? '#10b981'
                : isCoreHub
                ? '#a855f7'
                : '#3b82f6';

              const filterUrl = isDroppedSource
                ? 'url(#glow-rose)'
                : isCurrentPacketHop
                ? 'url(#glow-emerald)'
                : isSource
                ? 'url(#glow-cyan)'
                : isDestination
                ? 'url(#glow-emerald)'
                : isCoreHub
                ? 'url(#glow-purple)'
                : undefined;

              const radius = isCoreHub ? 36 : (isSource || isDestination) ? 34 : 32;

              return (
                <g key={node.id} transform={`translate(${coord.x}, ${coord.y})`} className="node-group">
                  {/* Outer glow ring */}
                  <circle
                    r={radius}
                    fill="#151c27"
                    stroke={isCurrentPacketHop ? '#00e5ff' : isDroppedSource ? '#f43f5e' : '#f8fafc'}
                    strokeWidth={isCurrentPacketHop || isDroppedSource ? 3 : 2}
                    filter={filterUrl || 'url(#glow-cyan)'}
                  />
                  {/* Inner container */}
                  <circle r={radius - 8} fill={isDroppedSource ? '#31141a' : isCurrentPacketHop ? '#00333d' : '#10151f'} />

                  {/* Icon representation */}
                  {isCoreHub ? (
                    <>
                      <polygon points="0,-9 8,5 -8,5" fill="none" stroke="#c084fc" strokeWidth="1.5" />
                      <circle cx="0" cy="0" r="1.5" fill="#c084fc" />
                    </>
                  ) : isRouter ? (
                    <>
                      <path d="M-8 -5 L8 -5 L8 5 L-8 5 Z" fill="none" stroke={strokeColor} strokeWidth="1.5" />
                      <circle cx="-4" cy="0" r="1.2" fill={strokeColor} />
                      <circle cx="0" cy="0" r="1.2" fill={strokeColor} />
                      <circle cx="4" cy="0" r="1.2" fill={strokeColor} />
                    </>
                  ) : (
                    <>
                      <rect x="-8" y="-6" width="16" height="10" rx="1" fill="none" stroke={strokeColor} strokeWidth="1.5" />
                      <line x1="-5" y1="7" x2="5" y2="7" stroke={strokeColor} strokeWidth="1.5" />
                    </>
                  )}

                  {/* Node Name Label */}
                  <text y={radius + 16} textAnchor="middle" fill="#f8fafc" fontWeight="700" fontSize="13">
                    {node.name || node.id}
                  </text>
                  {/* Node IP / Role Subtext */}
                  <text y={radius + 30} textAnchor="middle" fill={isInActivePath ? '#00e5ff' : '#94a3b8'} fontSize="10">
                    {isInActivePath ? 'Dijkstra Hop' : (node.roleDescription || node.ipAddress)}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Active Animated Traveling Packet Beacon */}
          {activePacketCoord && (
            <g transform={`translate(${activePacketCoord.x}, ${activePacketCoord.y - 42})`}>
              <rect
                x="-42"
                y="-12"
                width="84"
                height="22"
                rx="11"
                fill={activeTransmission?.status === 'dropped' ? '#f43f5e' : activeTransmission?.status === 'delivered' ? '#10b981' : activeTransmission?.priority === 'high' ? '#fbbf24' : '#3b82f6'}
                filter={activeTransmission?.status === 'dropped' ? 'url(#glow-rose)' : activeTransmission?.status === 'delivered' ? 'url(#glow-emerald)' : activeTransmission?.priority === 'high' ? 'url(#glow-amber)' : 'url(#glow-cyan)'}
              />
              <text x="0" y="3" textAnchor="middle" fill="#090e1a" fontWeight="800" fontSize="10" fontFamily="'JetBrains Mono', monospace">
                {activeTransmission?.packetId || 'PKT'}
              </text>
            </g>
          )}
        </svg>

        {/* Canvas Footer Bar showing dynamic Graph stats */}
        <div className="canvas-footer-bar">
          <div className="canvas-stat">
            <span className="stat-bullet bg-cyan"></span>
            <span>Routing Core: <strong>Dijkstra (Binary Min-Heap)</strong></span>
          </div>
          <div className="canvas-stat">
            <span className="stat-bullet bg-indigo"></span>
            <span>Total Vertices (|V|): <strong>{nodes.length}</strong> | Total Directed Edges: <strong>{graph.getAllEdges(false).length}</strong></span>
          </div>
          <div className="canvas-stat">
            <span className="stat-bullet bg-emerald"></span>
            <span>
              Optimal Path State:{' '}
              <strong>
                {activeTransmission
                  ? activeTransmission.status === 'dropped'
                    ? 'Unreachable'
                    : `${activeTransmission.path.join(' ➔ ')} (Cost: ${activeTransmission.totalCost ?? 0})`
                  : 'Ready'}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
