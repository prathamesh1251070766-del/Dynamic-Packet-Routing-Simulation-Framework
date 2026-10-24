import React, { useState, useRef, useEffect, useMemo } from 'react';
import './App.css';

import { Graph } from './dsa/Graph';
import { PriorityQueue } from './dsa/PriorityQueue';
import { DoublyLinkedList } from './dsa/DoublyLinkedList';
import { calculateDijkstraShortestPath, buildRoutingHashTableForNode } from './dsa/Dijkstra';
import type { Packet, PacketPriority, PacketHistoryItem } from './types/packet';
import { createSampleNetwork } from './data/sampleNetwork';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { RightSidebar } from './components/layout/RightSidebar';
import { NetworkCanvas, type ActiveTransmissionState } from './components/network/NetworkCanvas';
import { PacketQueuePanel } from './components/dashboard/PacketQueuePanel';
import { RoutingTablePanel } from './components/dashboard/RoutingTablePanel';
import { PacketHistoryPanel } from './components/dashboard/PacketHistoryPanel';
import { AnalyticsPanel } from './components/dashboard/AnalyticsPanel';
import { SendPacketModal } from './components/network/SendPacketModal';
import { LinkFailureModal } from './components/network/LinkFailureModal';
import { CreateNodeModal } from './components/network/CreateNodeModal';
import { CreateLinkModal } from './components/network/CreateLinkModal';
import type { LinkStatus, NodeType } from './dsa/Graph';

export const App: React.FC = () => {
  // 1. Real custom Graph data structure instance
  const [graph] = useState<Graph>(() => createSampleNetwork());
  const [graphVersion, setGraphVersion] = useState<number>(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<{from: string, to: string} | null>(null);

  const forceGraphUpdate = () => setGraphVersion(v => v + 1);

  // 2. Real custom PriorityQueue data structure instance for packet ingestion
  const [packetQueue] = useState<PriorityQueue<Packet>>(() => new PriorityQueue<Packet>());

  // 3. Real custom Doubly Linked List data structure instance for packet history
  const [historyList] = useState<DoublyLinkedList<PacketHistoryItem>>(
    () => new DoublyLinkedList<PacketHistoryItem>()
  );

  // Selected source router for Routing Table view
  const [routingTableSource, setRoutingTableSource] = useState<string>('R1');

  // React state mirrors for reactive UI updates
  const [queuedPackets, setQueuedPackets] = useState<Packet[]>([]);
  const [historyRecords, setHistoryRecords] = useState<PacketHistoryItem[]>([]);
  const [packetCounter, setPacketCounter] = useState<number>(1001);
  const [totalPacketsSent, setTotalPacketsSent] = useState<number>(0);
  const [isSendModalOpen, setIsSendModalOpen] = useState<boolean>(false);
  const [isLinkFailureModalOpen, setIsLinkFailureModalOpen] = useState<boolean>(false);
  const [isCreateNodeModalOpen, setIsCreateNodeModalOpen] = useState<boolean>(false);
  const [isCreateLinkModalOpen, setIsCreateLinkModalOpen] = useState<boolean>(false);


  // Active transmission visualization state on the Network Canvas
  const [activeTransmission, setActiveTransmission] = useState<ActiveTransmissionState | null>(null);

  const animationTimerRef = useRef<number | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        window.clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  // 4. Real custom HashTable instance populated via Dijkstra
  const routingHashTable = useMemo(() => {
    return buildRoutingHashTableForNode(graph, routingTableSource);
  }, [graph, routingTableSource]);

  const availableRouters = useMemo(() => {
    // using graphVersion to trigger re-computation
    return graph.getAllNodes().map((n) => ({ id: n.id, name: n.name || n.id }));
  }, [graph, graphVersion]);

  // Phase 4 & Phase 12 Dynamic Topology Handlers
  const handleCreateNodeSubmit = (data: {
    id: string;
    name: string;
    type: NodeType;
    ipAddress: string;
  }) => {
    const currentNodes = graph.getAllNodes();
    const count = currentNodes.length;
    const angle = (count * 2 * Math.PI) / Math.max(1, count + 1);
    const radius = 160;
    const x = Math.round(400 + radius * Math.cos(angle));
    const y = Math.round(230 + radius * Math.sin(angle) * 0.8);

    graph.addNode({
      id: data.id,
      name: data.name,
      type: data.type,
      ipAddress: data.ipAddress,
      status: 'active',
      position: { x: Math.max(60, Math.min(740, x)), y: Math.max(60, Math.min(400, y)) }
    });
    forceGraphUpdate();
  };

  const handleCreateLinkSubmit = (data: {
    from: string;
    to: string;
    cost: number;
    bandwidth: number;
    bidirectional: boolean;
  }) => {
    graph.addEdge(data.from, data.to, {
      cost: data.cost,
      bandwidth: data.bandwidth,
      status: 'active'
    }, data.bidirectional);
    forceGraphUpdate();
  };

  const handleToggleLinkStatus = (from: string, to: string, currentStatus: LinkStatus) => {
    const newStatus: LinkStatus = currentStatus === 'active' ? 'failed' : 'active';
    graph.updateLinkStatus(from, to, newStatus, true);
    forceGraphUpdate();
  };

  const handleToggleFailure = () => {
    if (selectedNodeId) {
      const node = graph.getNode(selectedNodeId);
      if (node) {
        node.status = node.status === 'active' ? 'inactive' : 'active';
        forceGraphUpdate();
      }
    } else if (selectedEdge) {
      const edge = graph.getEdge(selectedEdge.from, selectedEdge.to);
      if (edge) {
        const newStatus: LinkStatus = edge.status === 'active' ? 'failed' : 'active';
        graph.updateLinkStatus(selectedEdge.from, selectedEdge.to, newStatus, true);
        forceGraphUpdate();
      }
    } else {
      setIsLinkFailureModalOpen(true);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedNodeId) {
      graph.removeNode(selectedNodeId);
      setSelectedNodeId(null);
      forceGraphUpdate();
    } else if (selectedEdge) {
      graph.removeEdge(selectedEdge.from, selectedEdge.to, true);
      setSelectedEdge(null);
      forceGraphUpdate();
    }
  };

  const handleClearGraph = () => {
    if (window.confirm('Are you sure you want to clear the entire network graph?')) {
      graph.clear();
      setSelectedNodeId(null);
      setSelectedEdge(null);
      forceGraphUpdate();
    }
  };

  const handleNodePositionChange = (nodeId: string, x: number, y: number) => {
    const node = graph.getNode(nodeId);
    if (node) {
      node.position = { x, y };
      forceGraphUpdate();
    }
  };

  /**
   * Inserts a newly generated packet into the custom Priority Queue (Min-Heap, O(log N))
   */
  const handleEnqueuePacket = (data: {
    source: string;
    destination: string;
    payload: string;
    priority: PacketPriority;
    sizeBytes: number;
  }) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    const newPacket: Packet = {
      packetId: `PKT-${packetCounter}`,
      source: data.source,
      destination: data.destination,
      payload: data.payload,
      timestamp: Date.now(),
      createdAt: timeStr,
      status: 'queued',
      priority: data.priority,
      sizeBytes: data.sizeBytes
    };

    // 1. Min-Heap insertion (lower number = higher priority)
    const priorityScore = 4 - data.priority;
    packetQueue.insert(newPacket, priorityScore);

    // 2. Sync UI state
    setQueuedPackets(packetQueue.toArray().map(node => node.element));
    setPacketCounter((prev) => prev + 1);
    setTotalPacketsSent((prev) => prev + 1);
  };

  /**
   * Processes and transmits the oldest packet from the front of the FIFO Queue.
   * Leverages Hash Table O(1) route lookup when applicable, combined with Dijkstra's algorithm.
   */
  const handleProcessNext = () => {
    // 1. Extract Min from Priority Queue (O(log N))
    const dequeuedPacket = packetQueue.extractMin();
    if (!dequeuedPacket) return;

    setQueuedPackets(packetQueue.toArray().map(node => node.element));

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    // 2. Fast Route Resolution: Query HashTable or calculate Dijkstra
    let path: string[] = [];
    let routeCost: number = Infinity;
    let isSuccess = false;
    let failureReason: string | undefined;

    if (dequeuedPacket.source === routingTableSource) {
      // Direct O(1) Hash Table Lookup
      const cached = routingHashTable.get(dequeuedPacket.destination);
      if (cached && cached.status === 'active' && cached.path.length > 0) {
        path = cached.path;
        routeCost = typeof cached.cost === 'number' ? cached.cost : Infinity;
        isSuccess = true;
      } else {
        failureReason = `Destination "${dequeuedPacket.destination}" unreachable in Hash Table.`;
      }
    } else {
      // Source differs from current table source: Compute Dijkstra
      const dijkstraResult = calculateDijkstraShortestPath(
        graph,
        dequeuedPacket.source,
        dequeuedPacket.destination
      );

      if (dijkstraResult.success && dijkstraResult.path.length > 0) {
        path = dijkstraResult.path;
        routeCost = dijkstraResult.totalCost;
        isSuccess = true;
      } else {
        failureReason = dijkstraResult.reason || 'Unreachable destination';
      }
    }

    if (isSuccess && path.length > 0) {

      // Mutable state for the hop animation — path and cost may change on reroute
      let activePath = [...path];
      let activeCost = routeCost;
      let rerouted = false;

      // 4. Trigger progressive hop animation across the shortest path
      setActiveTransmission({
        packetId: dequeuedPacket.packetId,
        source: dequeuedPacket.source,
        destination: dequeuedPacket.destination,
        path: activePath,
        currentHopIndex: 0,
        status: 'transmitting',
        payload: dequeuedPacket.payload,
        totalCost: activeCost,
        routingAlgorithm: 'Dijkstra + HashTable O(1)'
      });

      // Animate hop-by-hop traversal
      let currentHop = 0;
      const hopInterval = 450; // ms per router hop

      /**
       * Phase 13 — Dynamic Rerouting:
       * Before each hop, verify that the next link and next node are still
       * operational. If a failure is detected mid-flight, recalculate the
       * shortest path from the packet's current position using Dijkstra.
       */
      const advanceHop = () => {
        const currentNodeId = activePath[currentHop];
        const nextHopIndex = currentHop + 1;

        // ── Guard: have we already reached the final node? ──
        if (nextHopIndex >= activePath.length) {
          // Packet reached destination — write history and clear animation
          const finalLatency = Math.max(activeCost * 4, 4);
          const historyEntry: PacketHistoryItem = {
            recordId: `HIST-${Date.now()}-${dequeuedPacket.packetId}`,
            packetId: dequeuedPacket.packetId,
            source: dequeuedPacket.source,
            destination: dequeuedPacket.destination,
            payload: dequeuedPacket.payload,
            path: activePath,
            totalCost: activeCost,
            latencyMs: finalLatency,
            status: 'delivered',
            timestamp: timeStr,
            priority: dequeuedPacket.priority,
            wasRerouted: rerouted
          };
          historyList.insertHead(historyEntry);
          setHistoryRecords(historyList.toArray());

          setActiveTransmission({
            packetId: dequeuedPacket.packetId,
            source: dequeuedPacket.source,
            destination: dequeuedPacket.destination,
            path: activePath,
            currentHopIndex: activePath.length - 1,
            status: 'delivered',
            payload: dequeuedPacket.payload,
            totalCost: activeCost,
            routingAlgorithm: 'Dijkstra + HashTable O(1)',
            wasRerouted: rerouted
          });

          animationTimerRef.current = window.setTimeout(() => {
            setActiveTransmission(null);
          }, 2400);
          return;
        }

        const nextNodeId = activePath[nextHopIndex];

        // ── Phase 13: Mid-flight link / node failure check ──
        const nextEdge = graph.getEdge(currentNodeId, nextNodeId);
        const nextNode = graph.getNode(nextNodeId);
        const linkFailed = !nextEdge || nextEdge.status !== 'active';
        const nodeFailed = !nextNode || nextNode.status === 'inactive';

        if (linkFailed || nodeFailed) {
          // ── Reroute: recalculate Dijkstra from current node ──
          rerouted = true;

          // Brief visual flash showing rerouting state
          setActiveTransmission({
            packetId: dequeuedPacket.packetId,
            source: dequeuedPacket.source,
            destination: dequeuedPacket.destination,
            path: activePath,
            currentHopIndex: currentHop,
            status: 'rerouting',
            payload: dequeuedPacket.payload,
            totalCost: activeCost,
            routingAlgorithm: 'Dijkstra Reroute',
            wasRerouted: true,
            reason: linkFailed
              ? `Link ${currentNodeId}→${nextNodeId} failed mid-flight`
              : `Node ${nextNodeId} went inactive mid-flight`
          });

          // Allow the rerouting visual to display briefly, then compute new path
          animationTimerRef.current = window.setTimeout(() => {
            const rerouteResult = calculateDijkstraShortestPath(
              graph,
              currentNodeId,
              dequeuedPacket.destination
            );

            if (rerouteResult.success && rerouteResult.path.length >= 2) {
              // Splice: keep the already-traversed prefix, append the new sub-path
              const traversedPrefix = activePath.slice(0, currentHop); // nodes visited before current
              const newSubPath = rerouteResult.path; // starts with currentNodeId
              activePath = [...traversedPrefix, ...newSubPath];
              activeCost = activeCost + rerouteResult.totalCost; // cumulative cost

              // Reset currentHop to point at currentNodeId within the merged path
              currentHop = traversedPrefix.length;

              // Update animation with the new merged path
              setActiveTransmission({
                packetId: dequeuedPacket.packetId,
                source: dequeuedPacket.source,
                destination: dequeuedPacket.destination,
                path: activePath,
                currentHopIndex: currentHop,
                status: 'transmitting',
                payload: dequeuedPacket.payload,
                totalCost: activeCost,
                routingAlgorithm: 'Dijkstra Reroute',
                wasRerouted: true
              });

              // Continue hop animation on the new path
              animationTimerRef.current = window.setTimeout(advanceHop, hopInterval);
            } else {
              // No alternate path — drop the packet
              const failReason = linkFailed
                ? `Link ${currentNodeId}→${nextNodeId} failed; no alternate route to ${dequeuedPacket.destination}`
                : `Node ${nextNodeId} inactive; no alternate route to ${dequeuedPacket.destination}`;

              const historyEntry: PacketHistoryItem = {
                recordId: `HIST-${Date.now()}-${dequeuedPacket.packetId}`,
                packetId: dequeuedPacket.packetId,
                source: dequeuedPacket.source,
                destination: dequeuedPacket.destination,
                payload: dequeuedPacket.payload,
                path: activePath.slice(0, currentHop + 1),
                totalCost: Infinity,
                latencyMs: 0,
                status: 'dropped',
                timestamp: timeStr,
                priority: dequeuedPacket.priority,
                failureReason: failReason,
                wasRerouted: true
              };
              historyList.insertHead(historyEntry);
              setHistoryRecords(historyList.toArray());

              setActiveTransmission({
                packetId: dequeuedPacket.packetId,
                source: dequeuedPacket.source,
                destination: dequeuedPacket.destination,
                path: activePath.slice(0, currentHop + 1),
                currentHopIndex: currentHop,
                status: 'dropped',
                payload: dequeuedPacket.payload,
                totalCost: 0,
                reason: failReason,
                wasRerouted: true
              });

              animationTimerRef.current = window.setTimeout(() => {
                setActiveTransmission(null);
              }, 2200);
            }
          }, 600); // 600ms rerouting flash duration
          return;
        }

        // ── Normal hop advance (link and node are healthy) ──
        currentHop++;
        setActiveTransmission({
          packetId: dequeuedPacket.packetId,
          source: dequeuedPacket.source,
          destination: dequeuedPacket.destination,
          path: activePath,
          currentHopIndex: currentHop,
          status: 'transmitting',
          payload: dequeuedPacket.payload,
          totalCost: activeCost,
          routingAlgorithm: rerouted ? 'Dijkstra Reroute' : 'Dijkstra + HashTable O(1)',
          wasRerouted: rerouted
        });
        animationTimerRef.current = window.setTimeout(advanceHop, hopInterval);
      };

      animationTimerRef.current = window.setTimeout(advanceHop, hopInterval);
    } else {
      // Transmission Failed (no initial route found)
      const historyEntry: PacketHistoryItem = {
        recordId: `HIST-${Date.now()}-${dequeuedPacket.packetId}`,
        packetId: dequeuedPacket.packetId,
        source: dequeuedPacket.source,
        destination: dequeuedPacket.destination,
        payload: dequeuedPacket.payload,
        path: [],
        totalCost: Infinity,
        latencyMs: 0,
        status: 'dropped',
        timestamp: timeStr,
        priority: dequeuedPacket.priority,
        failureReason: failureReason || 'Unreachable destination'
      };

      historyList.insertHead(historyEntry);
      setHistoryRecords(historyList.toArray());

      setActiveTransmission({
        packetId: dequeuedPacket.packetId,
        source: dequeuedPacket.source,
        destination: dequeuedPacket.destination,
        path: [dequeuedPacket.source],
        currentHopIndex: 0,
        status: 'dropped',
        payload: dequeuedPacket.payload,
        totalCost: 0,
        reason: failureReason
      });

      animationTimerRef.current = window.setTimeout(() => {
        setActiveTransmission(null);
      }, 2200);
    }
  };

  /**
   * Clears the Priority Queue
   */
  const handleClearQueue = () => {
    packetQueue.clear();
    setQueuedPackets([]);
  };

  /**
   * Clears the Doubly Linked List history timeline
   */
  const handleClearHistory = () => {
    historyList.clear();
    setHistoryRecords([]);
  };

  // Telemetry metric calculations from Doubly Linked List history
  const deliveredList = historyRecords.filter((h) => h.status === 'delivered');
  const droppedList = historyRecords.filter((h) => h.status === 'dropped');
  const totalDelivered = deliveredList.length;
  const totalDropped = droppedList.length;

  const averageDelayMs = totalDelivered > 0
    ? deliveredList.reduce((sum, h) => sum + h.latencyMs, 0) / totalDelivered
    : 0;

  // Congestion node tracking
  const hopFrequencyMap: Record<string, number> = {};
  for (const record of deliveredList) {
    if (record.path && record.path.length > 2) {
      for (let i = 1; i < record.path.length - 1; i++) {
        const node = record.path[i];
        hopFrequencyMap[node] = (hopFrequencyMap[node] || 0) + 1;
      }
    }
  }
  const congestionNodeCount = Object.values(hopFrequencyMap).filter((freq) => freq >= 2).length;
  const failedLinkCount = graph.getAllEdges(true).filter((e) => e.status === 'failed').length;

  return (
    <div className="app-container">
      {/* DASHBOARD BODY */}
      <main className="dashboard-body">
        {/* UPPER ROW: Left Sidebar | Main Topology Area | Right Sidebar */}
        <div className="dashboard-main-grid">
          {/* B. LEFT SIDEBAR: Network Controls & Topology Management */}
          <LeftSidebar
            onAddRouter={() => setIsCreateNodeModalOpen(true)}
            onAddDevice={() => setIsCreateNodeModalOpen(true)}
            onAddConnection={() => setIsCreateLinkModalOpen(true)}
            onOpenFailureModal={() => setIsLinkFailureModalOpen(true)}
            selectedNodeId={selectedNodeId}
            selectedEdge={selectedEdge}
            selectedNode={selectedNodeId ? graph.getNode(selectedNodeId) : null}
            selectedEdgeData={selectedEdge ? graph.getEdge(selectedEdge.from, selectedEdge.to) : null}
            onToggleFailure={handleToggleFailure}
            onDeleteSelected={handleDeleteSelected}
            onClearGraph={handleClearGraph}
            totalNodes={graph.getAllNodes().length}
            totalEdges={graph.getAllEdges(true).length}
          />

          {/* C. CENTER MAIN AREA: Network Topology (Dijkstra Shortest Path Animation) */}
          <NetworkCanvas
            graph={graph}
            graphVersion={graphVersion}
            activeTransmission={activeTransmission}
            selectedNodeId={selectedNodeId}
            selectedEdge={selectedEdge}
            onSelectNode={setSelectedNodeId}
            onSelectEdge={setSelectedEdge}
            onNodePositionChange={handleNodePositionChange}
            onOpenFailureModal={() => setIsLinkFailureModalOpen(true)}
            onToggleLink={handleToggleLinkStatus}
          />

          {/* D. RIGHT SIDEBAR: Typical Operations */}
          <RightSidebar
            onSendPacketClick={() => setIsSendModalOpen(true)}
            onProcessPacketClick={handleProcessNext}
            onClearQueueClick={handleClearQueue}
            onOpenFailureModal={() => setIsLinkFailureModalOpen(true)}
            onAddNodeClick={() => setIsCreateNodeModalOpen(true)}
            onAddLinkClick={() => setIsCreateLinkModalOpen(true)}
            selectedNodeId={selectedNodeId}
            selectedEdge={selectedEdge}
            onToggleFailure={handleToggleFailure}
            onDeleteSelected={handleDeleteSelected}
            onClearGraph={handleClearGraph}
          />
        </div>

        {/* E. BOTTOM DASHBOARD SECTION: 4 Information Panels */}
        <section className="dashboard-bottom-grid" aria-label="Simulation Status Panels">
          {/* 1. Packet Queue (Powered by custom Priority Queue DSA) */}
          <PacketQueuePanel
            packets={queuedPackets}
            onOpenSendModal={() => setIsSendModalOpen(true)}
            onProcessNext={handleProcessNext}
            onClearQueue={handleClearQueue}
          />

          {/* 2. Routing Table (Powered by custom HashTable O(1) & Dijkstra) */}
          <RoutingTablePanel
            routingHashTable={routingHashTable}
            sourceRouter={routingTableSource}
            onSelectRouter={setRoutingTableSource}
            availableRouters={availableRouters}
          />

          {/* 3. Packet History (Powered by custom Doubly Linked List DSA) */}
          <PacketHistoryPanel
            historyRecords={historyRecords}
            onClearHistory={handleClearHistory}
          />

          {/* 4. Analytics & Monitoring (Live telemetry metrics) */}
          <AnalyticsPanel
            totalPacketsSent={totalPacketsSent}
            totalDelivered={totalDelivered}
            totalDropped={totalDropped}
            averageDelayMs={averageDelayMs}
            activeQueueLength={queuedPackets.length}
            congestionNodeCount={congestionNodeCount}
            failedLinkCount={failedLinkCount}
          />
        </section>
      </main>

      {/* Send / Enqueue Packet Modal */}
      <SendPacketModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        nodes={graph.getAllNodes()}
        onSendPacket={handleEnqueuePacket}
      />

      {/* Link Failure Simulation Modal */}
      <LinkFailureModal
        isOpen={isLinkFailureModalOpen}
        onClose={() => setIsLinkFailureModalOpen(false)}
        edges={graph.getAllEdges(true)}
        onToggleLink={handleToggleLinkStatus}
      />

      {/* Dynamic Node Creation Modal (Router / Device) */}
      <CreateNodeModal
        isOpen={isCreateNodeModalOpen}
        onClose={() => setIsCreateNodeModalOpen(false)}
        existingNodeIds={graph.getAllNodes().map((n) => n.id)}
        onCreateNode={handleCreateNodeSubmit}
      />

      {/* Dynamic Link Creation Modal (Weighted Edge) */}
      <CreateLinkModal
        isOpen={isCreateLinkModalOpen}
        onClose={() => setIsCreateLinkModalOpen(false)}
        nodes={graph.getAllNodes()}
        existingEdges={graph.getAllEdges(true).map((e) => ({ from: e.from, to: e.to }))}
        onCreateLink={handleCreateLinkSubmit}
      />
    </div>
  );
};

export default App;
