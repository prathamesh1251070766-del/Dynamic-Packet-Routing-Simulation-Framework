import React from 'react';
import { Graph, type NetworkNode, type NetworkEdge, type LinkStatus } from '../../dsa/Graph';
import type { PacketPriority } from '../../types/packet';

// ============================================================================
// TYPES
// ============================================================================

export interface ActiveTransmissionState {
  packetId: string;
  source: string;
  destination: string;
  path: string[];
  currentHopIndex: number;
  status: 'transmitting' | 'delivered' | 'dropped' | 'rerouting';
  payload?: string;
  totalCost?: number;
  routingAlgorithm?: string;
  reason?: string;
  priority?: PacketPriority;
  wasRerouted?: boolean;
}

interface NetworkCanvasProps {
  graph: Graph;
  activeTransmission?: ActiveTransmissionState | null;
  graphVersion?: number;
  selectedNodeId?: string | null;
  selectedEdge?: {from: string, to: string} | null;
  onSelectNode?: (nodeId: string | null) => void;
  onSelectEdge?: (edge: {from: string, to: string} | null) => void;
  onNodePositionChange?: (nodeId: string, x: number, y: number) => void;
  onOpenFailureModal?: () => void;
  onToggleLink?: (from: string, to: string, currentStatus: LinkStatus) => void;
}

// ============================================================================
// DYNAMIC NODE ROLE DETECTION (No hardcoded IDs)
// ============================================================================

/**
 * Determines if a node is the "source" router by inspecting its roleDescription or name.
 * This approach is purely data-driven — no hardcoded node IDs.
 */
function isSourceNode(node: NetworkNode): boolean {
  const desc = (node.roleDescription || '').toLowerCase();
  const name = (node.name || '').toLowerCase();
  return (
    desc.includes('source') ||
    desc.includes('gateway') ||
    name.includes('source') ||
    name.includes('gateway')
  );
}

/**
 * Determines if a node is the "destination" device/host.
 */
function isDestinationNode(node: NetworkNode): boolean {
  const desc = (node.roleDescription || '').toLowerCase();
  const name = (node.name || '').toLowerCase();
  return (
    desc.includes('destination') ||
    desc.includes('target') ||
    desc.includes('host') ||
    name.includes('destination') ||
    name.includes('target')
  );
}

/**
 * Determines if a node is a "core hub" / transit router.
 */
function isCoreHubNode(node: NetworkNode): boolean {
  const desc = (node.roleDescription || '').toLowerCase();
  const name = (node.name || '').toLowerCase();
  return (
    desc.includes('hub') ||
    desc.includes('core') ||
    desc.includes('transit') ||
    desc.includes('optimal') ||
    name.includes('hub') ||
    name.includes('core')
  );
}

// ============================================================================
// FALLBACK LAYOUT: Used only when nodes have no position defined in the Graph
// ============================================================================

/**
 * Computes a circular fallback position for nodes that lack explicit coordinates.
 * This is purely a visual layout fallback — the Graph state remains the authority.
 */
function computeFallbackPositions(
  nodes: NetworkNode[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const total = nodes.length;

  nodes.forEach((node, index) => {
    if (node.position) {
      positions.set(node.id, node.position);
    } else {
      const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
      positions.set(node.id, {
        x: 400 + 200 * Math.cos(angle),
        y: 235 + 140 * Math.sin(angle),
      });
    }
  });

  return positions;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const NetworkCanvas: React.FC<NetworkCanvasProps> = ({
  graph,
  activeTransmission,
  // @ts-ignore - graphVersion is only used to trigger re-renders
  graphVersion,
  selectedNodeId,
  selectedEdge,
  onSelectNode,
  onSelectEdge,
  onNodePositionChange,
  onOpenFailureModal,
  onToggleLink
}) => {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [draggingNode, setDraggingNode] = React.useState<string | null>(null);

  // ──────────────────────────────────────────────────────────────────────────
  // 1. READ EXCLUSIVELY FROM THE GRAPH DATA STRUCTURE (single source of truth)
  // ──────────────────────────────────────────────────────────────────────────

  /** All network nodes from the adjacency-list-backed Graph */
  const nodes = graph.getAllNodes();

  /**
   * All directed edges — used to determine bidirectionality.
   * getAllEdges(false) returns EVERY directed edge including both (A→B) and (B→A).
   */
  const allDirectedEdges: NetworkEdge[] = graph.getAllEdges(false);

  /**
   * Unique undirected edge set — each physical link appears once.
   * Used for rendering link lines and cost badges.
   */
  const uniqueEdges: NetworkEdge[] = graph.getAllEdges(true);

  // Build a Set of directed-edge keys for O(1) bidirectionality lookup
  const directedEdgeSet = new Set<string>(
    allDirectedEdges.map((e) => `${e.from}->${e.to}`)
  );

  /** Checks whether a link between two nodes is truly bidirectional in the Graph */
  const isBidirectional = (from: string, to: string): boolean =>
    directedEdgeSet.has(`${from}->${to}`) &&
    directedEdgeSet.has(`${to}->${from}`);

  // ──────────────────────────────────────────────────────────────────────────
  // 2. DERIVE LAYOUT POSITIONS FROM GRAPH STATE
  // ──────────────────────────────────────────────────────────────────────────

  const positionMap = computeFallbackPositions(nodes);

  const getNodeCoord = (nodeId: string): { x: number; y: number } => {
    return positionMap.get(nodeId) ?? { x: 400, y: 235 };
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 3. ACTIVE TRANSMISSION HELPERS
  // ──────────────────────────────────────────────────────────────────────────

  const isEdgeInActivePath = (from: string, to: string): boolean => {
    if (!activeTransmission?.path || activeTransmission.path.length < 2) {
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

  const currentHopNodeId =
    activeTransmission && activeTransmission.path.length > 0
      ? activeTransmission.path[
          Math.min(
            activeTransmission.currentHopIndex,
            activeTransmission.path.length - 1
          )
        ]
      : null;

  const activePacketCoord = currentHopNodeId
    ? getNodeCoord(currentHopNodeId)
    : null;

  // ──────────────────────────────────────────────────────────────────────────
  // 4. DERIVED STATISTICS (all from Graph)
  // ──────────────────────────────────────────────────────────────────────────

  const routerCount = nodes.filter((n) => n.type === 'router').length;
  const deviceCount = nodes.filter((n) => n.type === 'device').length;
  const linkCount = uniqueEdges.length;

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────

  const handlePointerDown = (e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation();
    if (onSelectNode) onSelectNode(nodeId);
    if (onSelectEdge) onSelectEdge(null);
    setDraggingNode(nodeId);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingNode || !svgRef.current || !onNodePositionChange) return;
    const CTM = svgRef.current.getScreenCTM();
    if (CTM) {
      const x = (e.clientX - CTM.e) / CTM.a;
      const y = (e.clientY - CTM.f) / CTM.d;
      onNodePositionChange(draggingNode, x, y);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingNode) {
      (e.target as Element).releasePointerCapture(e.pointerId);
      setDraggingNode(null);
    }
  };

  const handleEdgeClick = (e: React.MouseEvent, from: string, to: string) => {
    e.stopPropagation();
    if (onSelectEdge) onSelectEdge({ from, to });
    if (onSelectNode) onSelectNode(null);
  };

  const handleBackgroundClick = () => {
    if (onSelectNode) onSelectNode(null);
    if (onSelectEdge) onSelectEdge(null);
  };

  return (
    <section className="network-topology-card">
      {/* ── Card Header ── */}
      <div className="topology-card-header">
        <div className="topology-title-wrap">
          <svg
            className="topology-header-icon text-neutral"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <div>
            <h2 className="topology-title">NETWORK TOPOLOGY</h2>
            <span className="topology-subtitle">
              Shortest-Path Visualization &amp; Mesh Canvas
            </span>
          </div>
        </div>

        <div className="topology-header-controls">
          <div className="topology-badge-group">
            <span className="topology-pill">
              {routerCount} {routerCount === 1 ? 'Router' : 'Routers'}
              {deviceCount > 0 ? ` + ${deviceCount} Devices` : ''}
            </span>
            <span className="topology-pill">
              {linkCount} {linkCount === 1 ? 'Bidirectional Link' : 'Bidirectional Links'}
            </span>
            <span className="topology-pill pill-active">
              <span className="mini-dot bg-emerald" /> Dijkstra Active
            </span>
            {onOpenFailureModal && (
              <button
                type="button"
                className="topology-failure-btn"
                onClick={onOpenFailureModal}
                title="Open Link & Router Failure Simulator"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#f87171',
                  borderRadius: '20px',
                  padding: '3px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>⚡</span> Simulate Failure
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Canvas Wrapper ── */}
      <div className="canvas-wrapper">
        {/* Transmission / Status Banner */}
        <div className="canvas-placeholder-banner">
          {activeTransmission ? (
            activeTransmission.status === 'dropped' ? (
              <div className="banner-badge banner-dropped">
                <span className="status-dot-inline bg-rose" />
                <span>
                  <strong>UNREACHABLE:</strong> {activeTransmission.packetId} (
                  {activeTransmission.source} ✖ {activeTransmission.destination}
                  ) — {activeTransmission.wasRerouted ? 'Reroute failed — ' : ''}No active path via Dijkstra
                </span>
              </div>
            ) : activeTransmission.status === 'rerouting' ? (
              <div className="banner-badge banner-rerouting" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.08))', borderColor: '#f59e0b' }}>
                <span className="pulse-indicator status-dot-inline" style={{ background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }} />
                <span>
                  <strong>⚡ REROUTING:</strong>{' '}
                  {activeTransmission.packetId} — Link failure detected at hop{' '}
                  {activeTransmission.path[activeTransmission.currentHopIndex]} | Recalculating Dijkstra...
                </span>
              </div>
            ) : (
              <div
                className={`banner-badge ${
                  activeTransmission.status === 'delivered'
                    ? 'banner-delivered'
                    : 'banner-transmitting'
                }`}
              >
                <span className="pulse-indicator status-dot-inline" />
                <span>
                  <strong>{activeTransmission.wasRerouted ? 'DIJKSTRA REROUTED:' : 'DIJKSTRA OPTIMAL:'}</strong>{' '}
                  {activeTransmission.packetId} [{activeTransmission.source} ➜{' '}
                  {activeTransmission.destination}] | Route:{' '}
                  {activeTransmission.path.join(' ➔ ')} | Cost:{' '}
                  {activeTransmission.totalCost ?? 0}
                </span>
              </div>
            )
          ) : (
            <div className="banner-badge">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="banner-icon"
              >
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              <span>
                LIVE CUSTOM GRAPH MODEL — ADJACENCY LIST (V: {nodes.length}, E:{' '}
                {allDirectedEdges.length} DIRECTED)
              </span>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SVG NETWORK CANVAS
            All rendering is driven 100% by graph.getAllNodes() /
            graph.getAllEdges() — no hardcoded topology.
        ══════════════════════════════════════════════════════════════════ */}
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {nodes.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', pointerEvents: 'none' }}>
              <svg viewBox="0 0 24 24" width="64" height="64" stroke="currentColor" fill="none" strokeWidth="1" style={{ marginBottom: '16px', opacity: 0.5 }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#94a3b8' }}>Empty Network Graph</h3>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>Use the Left Sidebar controls to add Routers, Devices, and Connections.</p>
            </div>
          )}
          <svg 
            ref={svgRef}
            className="topology-svg-canvas" 
            viewBox="0 0 800 460"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={handleBackgroundClick}
          >
          <defs>
            {/* ── Grid Background Pattern ── */}
            <pattern
              id="canvas-grid-major"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              {/* Major grid lines */}
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(255, 255, 255, 0.04)"
                strokeWidth="0.8"
              />
              {/* Grid corner accent dots */}
              <circle cx="0" cy="0" r="1" fill="rgba(255, 255, 255, 0.08)" />
            </pattern>
            <pattern
              id="canvas-grid-minor"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              {/* Sub-grid lines */}
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="rgba(255, 255, 255, 0.015)"
                strokeWidth="0.5"
              />
            </pattern>

            {/* ── Status Glow Filters (Green for active, Red for error) ── */}
            <filter id="glow-emerald" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-rose" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* ── Arrow Markers for Directed / Bidirectional Edges ── */}

            {/* Standard inactive link arrow (light gray) */}
            <marker
              id="arrow-normal"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L8,3 z" fill="#a3a3a3" />
            </marker>

            {/* Active path link arrow (active green) */}
            <marker
              id="arrow-active"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L8,3 z" fill="#10b981" />
            </marker>

            {/* Failed link arrow (failed red) */}
            <marker
              id="arrow-failed"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L8,3 z" fill="#ef4444" />
            </marker>

            {/* Core hub link arrow (light gray) */}
            <marker
              id="arrow-core"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L8,3 z" fill="#e5e5e5" />
            </marker>

            {/* Bidirectional reverse arrow */}
            <marker
              id="arrow-bidir-start"
              markerWidth="8"
              markerHeight="8"
              refX="2"
              refY="3"
              orient="auto-start-reverse"
              markerUnits="strokeWidth"
            >
              <path d="M8,0 L8,6 L0,3 z" fill="#737373" />
            </marker>
          </defs>

          {/* ── Canvas Background: Sub-grid + Major grid ── */}
          <rect width="100%" height="100%" fill="url(#canvas-grid-minor)" />
          <rect width="100%" height="100%" fill="url(#canvas-grid-major)" />

          {/* ── Edge Glow Layer (underlays for active path) ── */}
          <g>
            {uniqueEdges.map((edge) => {
              const src = getNodeCoord(edge.from);
              const dst = getNodeCoord(edge.to);
              const isInActivePath = isEdgeInActivePath(edge.from, edge.to);
              if (!isInActivePath) return null;
              return (
                <line
                  key={`glow-${edge.from}-${edge.to}`}
                  x1={src.x}
                  y1={src.y}
                  x2={dst.x}
                  y2={dst.y}
                  stroke="#10b981"
                  strokeWidth={8}
                  strokeOpacity={0.25}
                />
              );
            })}
          </g>

          {/* ── Links / Edges (dynamically from graph.getAllEdges) ── */}
          <g className="graph-links" strokeLinecap="round">
            {uniqueEdges.map((edge) => {
              const src = getNodeCoord(edge.from);
              const dst = getNodeCoord(edge.to);
              const isFailed = edge.status === 'failed';
              const isInActivePath = isEdgeInActivePath(edge.from, edge.to);
              const isSelected = selectedEdge?.from === edge.from && selectedEdge?.to === edge.to || selectedEdge?.from === edge.to && selectedEdge?.to === edge.from;

              // Detect if this is a core hub link by checking connected nodes
              const fromNode = graph.getNode(edge.from);
              const toNode = graph.getNode(edge.to);
              const isCoreLink =
                (fromNode && isCoreHubNode(fromNode)) ||
                (toNode && isCoreHubNode(toNode));

              // Determine arrow marker
              const markerEnd = isFailed
                ? 'url(#arrow-failed)'
                : isInActivePath
                ? 'url(#arrow-active)'
                : isCoreLink
                ? 'url(#arrow-core)'
                : 'url(#arrow-normal)';

              // Determine stroke
              const strokeColor = isSelected
                ? '#f59e0b' // amber for selected
                : isFailed
                ? '#ef4444' // red for failed
                : isInActivePath
                ? '#10b981' // green for active path
                : isCoreLink
                ? '#e5e5e5' // crisp light-gray for core
                : '#737373'; // soft gray for normal links

              const strokeOpacity = isFailed
                ? 0.4
                : isInActivePath
                ? 1
                : isCoreLink
                ? 0.85
                : 0.7;

              const strokeWidth = isSelected ? 4 : isInActivePath ? 3.5 : isCoreLink ? 2.5 : 2;
              const strokeDash = isFailed
                ? '4 4'
                : isInActivePath
                ? 'none'
                : isCoreLink
                ? 'none'
                : '6 3';

              // Shorten line endpoints to avoid overlapping node circles
              const nodeRadius = 34;
              const dx = dst.x - src.x;
              const dy = dst.y - src.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const ux = dx / dist;
              const uy = dy / dist;
              const x1 = src.x + ux * nodeRadius;
              const y1 = src.y + uy * nodeRadius;
              const x2 = dst.x - ux * nodeRadius;
              const y2 = dst.y - uy * nodeRadius;

              return (
                <g 
                  key={`${edge.from}-${edge.to}`} 
                  onClick={(e) => handleEdgeClick(e, edge.from, edge.to)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (onToggleLink) {
                      onToggleLink(edge.from, edge.to, edge.status);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <title>
                    {isFailed
                      ? `Link ${edge.from} ⟷ ${edge.to} is FAILED. Double-click to restore.`
                      : `Link ${edge.from} ⟷ ${edge.to} is ACTIVE (cost ${edge.cost}). Double-click to sever.`}
                  </title>
                  {/* Invisible broad stroke for effortless click/double-click hit testing */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="transparent"
                    strokeWidth={16}
                  />
                  {/* Underlay glow for active Dijkstra shortest path link */}
                  {isInActivePath && (
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#10b981"
                      strokeWidth={strokeWidth - 0.5}
                      strokeOpacity={0.4}
                      strokeDasharray={isCoreLink ? 'none' : strokeDash}
                      markerStart="url(#arrow-bidir-start)"
                    />
                  )}
                  {/* Primary directed link */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeOpacity={strokeOpacity}
                    strokeDasharray={strokeDash}
                    markerEnd={markerEnd}
                  />
                </g>
              );
            })}
          </g>

          {/* ── Link Cost Badges (dynamically from graph.getAllEdges) ── */}
          <g
            className="link-costs"
            fontSize="11"
            fontFamily="'JetBrains Mono', monospace"
            textAnchor="middle"
          >
            {uniqueEdges.map((edge) => {
              const src = getNodeCoord(edge.from);
              const dst = getNodeCoord(edge.to);
              // Offset the badge slightly perpendicular so it doesn't sit on the line
              const midX = (src.x + dst.x) / 2;
              const midY = (src.y + dst.y) / 2;
              const isFailed = edge.status === 'failed';
              const isInActivePath = isEdgeInActivePath(edge.from, edge.to);
              const bidir = isBidirectional(edge.from, edge.to);

              // Perpendicular offset to avoid overlapping the line
              const dx = dst.x - src.x;
              const dy = dst.y - src.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              // Small perpendicular nudge so badge floats above the line
              const perpX = (-dy / dist) * 12;
              const perpY = (dx / dist) * 12;

              return (
                <g
                  key={`cost-${edge.from}-${edge.to}`}
                  transform={`translate(${midX + perpX}, ${midY + perpY})`}
                  style={{ pointerEvents: 'none' }}
                >
                  {/* Badge background */}
                  <rect
                    x="-28"
                    y="-11"
                    width="56"
                    height="22"
                    rx="5"
                    fill="#151515"
                    stroke={
                      isFailed
                        ? '#ef4444'
                        : isInActivePath
                        ? '#10b981'
                        : '#333333'
                    }
                    strokeWidth={isInActivePath ? 1.5 : 0.8}
                  />
                  {/* Bidirectional indicator pill */}
                  {bidir && !isFailed && (
                    <text
                      y="-14"
                      x="0"
                      textAnchor="middle"
                      fontSize="7"
                      fill={isInActivePath ? '#10b981' : '#737373'}
                      fontWeight="600"
                    >
                      ⇄
                    </text>
                  )}
                  {/* Cost value */}
                  <text
                    y="4"
                    fill={
                      isFailed
                        ? '#ef4444'
                        : isInActivePath
                        ? '#10b981'
                        : '#e5e5e5'
                    }
                    fontWeight={isInActivePath ? '700' : '500'}
                  >
                    cost: {edge.cost}
                  </text>
                </g>
              );
            })}
          </g>

          {/* ══════════════════════════════════════════════════════════════
              NODE RENDERING
              All node properties are read from graph.getAllNodes().
              Roles (source / destination / core hub) are derived from
              node.roleDescription and node.name — NOT from hardcoded IDs.
          ══════════════════════════════════════════════════════════════ */}
          <g className="graph-nodes">
            {nodes.map((node) => {
              const coord = getNodeCoord(node.id);
              const isRouter = node.type === 'router';
              const isSource = isSourceNode(node);
              const isDestination = isDestinationNode(node);
              const isCoreHub = isCoreHubNode(node);
              const isDevice = node.type === 'device';
              const isInactive = node.status === 'inactive';

              const isInActivePath =
                activeTransmission?.path?.includes(node.id) ?? false;
              const isCurrentPacketHop = currentHopNodeId === node.id;
              const isDroppedSource =
                activeTransmission?.status === 'dropped' &&
                node.id === activeTransmission.source;
              const isSelected = selectedNodeId === node.id;

              // ── Node stroke color ──────────────────────────────────
              const strokeColor = isSelected
                ? '#f59e0b'
                : isInactive
                ? '#525252'
                : isDroppedSource
                ? '#ef4444'
                : isCurrentPacketHop
                ? '#10b981'
                : isInActivePath
                ? '#10b981'
                : isSource
                ? '#ffffff'
                : isDestination
                ? '#10b981'
                : isCoreHub
                ? '#e5e5e5'
                : isDevice
                ? '#d4d4d4'
                : '#a3a3a3';

              // ── Glow filter ────────────────────────────────────────
              const filterUrl = isDroppedSource
                ? 'url(#glow-rose)'
                : isCurrentPacketHop || isInActivePath
                ? 'url(#glow-emerald)'
                : undefined;

              // ── Node sizing by role ────────────────────────────────
              const radius = isCoreHub ? 36 : isSource || isDestination ? 34 : 32;

              // ── Inner fill color by state ──────────────────────────
              const innerFill = isDroppedSource
                ? '#280c12'
                : isCurrentPacketHop
                ? '#0a241a'
                : isInActivePath
                ? '#0c1c14'
                : '#151515';

              // ── Outer ring stroke ──────────────────────────────────
              const outerStroke = isCurrentPacketHop
                ? '#10b981'
                : isDroppedSource
                ? '#ef4444'
                : isInactive
                ? '#525252'
                : strokeColor;

              const outerStrokeWidth =
                isCurrentPacketHop || isDroppedSource ? 2.5 : 1.8;

              // ── Role badge label ───────────────────────────────────
              const roleBadge = isSource
                ? 'SRC'
                : isDestination
                ? 'DST'
                : isCoreHub
                ? 'HUB'
                : isDevice
                ? 'DEV'
                : 'RTR';

              const roleBadgeFill = isDestination
                ? 'rgba(16,185,129,0.15)'
                : isSource
                ? 'rgba(255,255,255,0.1)'
                : 'rgba(255,255,255,0.06)';

              const roleBadgeStroke = isDestination
                ? 'rgba(16,185,129,0.5)'
                : isSource
                ? 'rgba(255,255,255,0.3)'
                : '#333333';

              return (
                <g
                  key={node.id}
                  transform={`translate(${coord.x}, ${coord.y})`}
                  className="node-group"
                  aria-label={`Node ${node.name || node.id}`}
                  onPointerDown={(e) => handlePointerDown(e, node.id)}
                  style={{ cursor: draggingNode === node.id ? 'grabbing' : 'grab' }}
                >
                  {/* ── Outer glow ring ── */}
                  <circle
                    r={radius}
                    fill="#0d0d0d"
                    stroke={outerStroke}
                    strokeWidth={outerStrokeWidth}
                    filter={filterUrl}
                    opacity={isInactive ? 0.4 : 1}
                  />

                  {/* ── Inner container ── */}
                  <circle
                    r={radius - 8}
                    fill={innerFill}
                    opacity={isInactive ? 0.5 : 1}
                  />

                  {/* ── Node-type icon (derived from node.type + role) ── */}
                  {isCoreHub ? (
                    /* Hexagon for core hub */
                    <>
                      <polygon
                        points="0,-10 9,-5 9,5 0,10 -9,5 -9,-5"
                        fill="none"
                        stroke="#e5e5e5"
                        strokeWidth="1.5"
                        opacity={isInactive ? 0.4 : 1}
                      />
                      <circle cx="0" cy="0" r="2" fill="#e5e5e5" opacity={isInactive ? 0.4 : 0.9} />
                    </>
                  ) : isDevice ? (
                    /* Monitor icon for devices */
                    <>
                      <rect
                        x="-9"
                        y="-7"
                        width="18"
                        height="12"
                        rx="1.5"
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="1.5"
                        opacity={isInactive ? 0.4 : 1}
                      />
                      <line
                        x1="-4"
                        y1="8"
                        x2="4"
                        y2="8"
                        stroke={strokeColor}
                        strokeWidth="1.5"
                        opacity={isInactive ? 0.4 : 1}
                      />
                      <line
                        x1="0"
                        y1="5"
                        x2="0"
                        y2="8"
                        stroke={strokeColor}
                        strokeWidth="1.5"
                        opacity={isInactive ? 0.4 : 1}
                      />
                    </>
                  ) : isSource ? (
                    /* Uplink arrow for source */
                    <>
                      <path
                        d="M-8,-4 L0,-10 L8,-4 L5,-4 L5,6 L-5,6 L-5,-4 Z"
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="1.5"
                        opacity={isInactive ? 0.4 : 1}
                      />
                    </>
                  ) : isDestination ? (
                    /* Downlink arrow for destination */
                    <>
                      <path
                        d="M-8,4 L0,10 L8,4 L5,4 L5,-6 L-5,-6 L-5,4 Z"
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="1.5"
                        opacity={isInactive ? 0.4 : 1}
                      />
                    </>
                  ) : isRouter ? (
                    /* Router chip icon */
                    <>
                      <rect
                        x="-8"
                        y="-5"
                        width="16"
                        height="10"
                        rx="1.5"
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="1.5"
                        opacity={isInactive ? 0.4 : 1}
                      />
                      <circle cx="-4" cy="0" r="1.2" fill={strokeColor} opacity={isInactive ? 0.4 : 0.9} />
                      <circle cx="0" cy="0" r="1.2" fill={strokeColor} opacity={isInactive ? 0.4 : 0.9} />
                      <circle cx="4" cy="0" r="1.2" fill={strokeColor} opacity={isInactive ? 0.4 : 0.9} />
                    </>
                  ) : null}

                  {/* ── Role badge (top-right of node) ── */}
                  <g transform={`translate(${radius - 4}, ${-radius + 4})`}>
                    <rect
                      x="-14"
                      y="-8"
                      width="28"
                      height="14"
                      rx="3"
                      fill={roleBadgeFill}
                      stroke={roleBadgeStroke}
                      strokeWidth="0.8"
                    />
                    <text
                      x="0"
                      y="3"
                      textAnchor="middle"
                      fontSize="7"
                      fontWeight="700"
                      fill={isDestination ? '#10b981' : '#e5e5e5'}
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      {roleBadge}
                    </text>
                  </g>

                  {/* ── Inactive overlay indicator ── */}
                  {isInactive && (
                    <text
                      y="1"
                      textAnchor="middle"
                      fontSize="12"
                      fill="#64748b"
                    >
                      ✕
                    </text>
                  )}

                  {/* ── Node name label ── */}
                  <text
                    y={radius + 16}
                    textAnchor="middle"
                    fill={isInactive ? '#525252' : '#ffffff'}
                    fontWeight="700"
                    fontSize="13"
                    fontFamily="'Inter', sans-serif"
                  >
                    {node.name || node.id}
                  </text>

                  {/* ── IP / Role sub-label ── */}
                  <text
                    y={radius + 30}
                    textAnchor="middle"
                    fill={isInActivePath ? '#10b981' : '#a3a3a3'}
                    fontSize="10"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    {isInActivePath
                      ? 'Dijkstra Hop'
                      : node.roleDescription || node.ipAddress || node.id}
                  </text>
                </g>
              );
            })}
          </g>

          {/* ── Active Packet Beacon (traveling hop indicator) ── */}
          {activePacketCoord && (
            <g
              transform={`translate(${activePacketCoord.x}, ${
                activePacketCoord.y - 48
              })`}
            >
              <rect
                x="-42"
                y="-12"
                width="84"
                height="22"
                rx="11"
                fill={
                  activeTransmission?.status === 'dropped'
                    ? '#ef4444'
                    : activeTransmission?.status === 'delivered'
                    ? '#10b981'
                    : activeTransmission?.status === 'rerouting'
                    ? '#f59e0b'
                    : activeTransmission?.wasRerouted
                    ? '#fb923c'
                    : activeTransmission?.priority === 2 ||
                      activeTransmission?.priority === 3
                    ? '#f59e0b'
                    : '#ffffff'
                }
                filter={
                  activeTransmission?.status === 'dropped'
                    ? 'url(#glow-rose)'
                    : activeTransmission?.status === 'delivered'
                    ? 'url(#glow-emerald)'
                    : activeTransmission?.status === 'rerouting' || activeTransmission?.wasRerouted
                    ? 'url(#glow-purple)'
                    : undefined
                }
              />
              <text
                x="0"
                y="3"
                textAnchor="middle"
                fill={
                  activeTransmission?.status === 'dropped' ||
                  activeTransmission?.status === 'delivered' ||
                  activeTransmission?.status === 'rerouting' ||
                  activeTransmission?.wasRerouted
                    ? '#ffffff'
                    : '#000000'
                }
                fontWeight="800"
                fontSize="10"
                fontFamily="'JetBrains Mono', monospace"
              >
                {activeTransmission?.packetId || 'PKT'}
              </text>
            </g>
          )}
        </svg>
        </div>

        {/* ── Canvas Footer Bar (Graph statistics from live Graph state) ── */}
        <div className="canvas-footer-bar">
          <div className="canvas-stat">
            <span className="stat-bullet bg-emerald" />
            <span>
              Routing Core: <strong>Dijkstra (Binary Min-Heap)</strong>
            </span>
          </div>
          <div className="canvas-stat">
            <span className="stat-bullet bg-neutral" />
            <span>
              Total Vertices (|V|): <strong>{nodes.length}</strong> | Total Directed
              Edges: <strong>{allDirectedEdges.length}</strong>
            </span>
          </div>
          <div className="canvas-stat">
            <span className="stat-bullet bg-emerald" />
            <span>
              Optimal Path State:{' '}
              <strong>
                {activeTransmission
                  ? activeTransmission.status === 'dropped'
                    ? 'Unreachable'
                    : activeTransmission.status === 'rerouting'
                    ? 'Rerouting — Recalculating Dijkstra...'
                    : `${activeTransmission.wasRerouted ? '(Rerouted) ' : ''}${activeTransmission.path.join(' ➔ ')} (Cost: ${
                        activeTransmission.totalCost ?? 0
                      })`
                  : 'Ready'}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
