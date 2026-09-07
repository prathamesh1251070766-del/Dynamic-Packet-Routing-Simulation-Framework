import React, { useState, useRef, useEffect, useMemo } from 'react';
import './App.css';

import { Graph } from './dsa/Graph';
import { PriorityQueue } from './dsa/PriorityQueue';
import { DoublyLinkedList } from './dsa/DoublyLinkedList';
import { calculateDijkstraShortestPath, buildRoutingHashTableForNode } from './dsa/Dijkstra';
import type { Packet, PacketPriority, PacketHistoryItem } from './types/packet';
import { createSampleNetwork } from './data/sampleNetwork';
import { Header } from './components/layout/Header';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { RightSidebar } from './components/layout/RightSidebar';
import { NetworkCanvas, type ActiveTransmissionState } from './components/network/NetworkCanvas';
import { PacketQueuePanel } from './components/dashboard/PacketQueuePanel';
import { RoutingTablePanel } from './components/dashboard/RoutingTablePanel';
import { PacketHistoryPanel } from './components/dashboard/PacketHistoryPanel';
import { AnalyticsPanel } from './components/dashboard/AnalyticsPanel';
import { SendPacketModal } from './components/network/SendPacketModal';

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

  // Hash table lookup telemetry for LeftSidebar
  const [lastLookupTelemetry, setLastLookupTelemetry] = useState<{
    lastLookupKey?: string;
    isHit?: boolean;
  }>({});

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

  // Phase 3 Handlers
  const handleAddNode = (type: 'router' | 'device') => {
    const id = prompt(`Enter ${type} ID (e.g., ${type === 'router' ? 'R6' : 'PC-2'}):`);
    if (!id) return;
    if (graph.hasNode(id)) {
      alert('Node ID already exists.');
      return;
    }
    const name = prompt(`Enter ${type} Name (optional):`) || id;
    graph.addNode({
      id,
      name,
      type,
      ipAddress: `10.0.0.${Math.floor(Math.random() * 255)}`,
      status: 'active',
      position: { x: 400 + (Math.random() * 100 - 50), y: 230 + (Math.random() * 100 - 50) }
    });
    forceGraphUpdate();
  };

  const handleAddConnection = () => {
    const from = prompt('Enter Source Node ID:');
    if (!from || !graph.hasNode(from)) return alert('Invalid source node.');
    const to = prompt('Enter Destination Node ID:');
    if (!to || !graph.hasNode(to)) return alert('Invalid destination node.');
    if (from === to) return alert('Cannot link a node to itself.');
    if (graph.getEdge(from, to)) return alert('Connection already exists.');

    const costStr = prompt('Enter Link Cost (e.g., 5):', '5');
    const cost = parseInt(costStr || '5', 10);
    graph.addEdge(from, to, { cost, status: 'active' }, true);
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
        const newStatus = edge.status === 'active' ? 'failed' : 'active';
        graph.updateLinkStatus(selectedEdge.from, selectedEdge.to, newStatus, true);
        forceGraphUpdate();
      }
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
        setLastLookupTelemetry({ lastLookupKey: dequeuedPacket.destination, isHit: true });
      } else {
        failureReason = `Destination "${dequeuedPacket.destination}" unreachable in Hash Table.`;
        setLastLookupTelemetry({ lastLookupKey: dequeuedPacket.destination, isHit: false });
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
      const latency = Math.max(routeCost * 4, 4);

      // Create history record for Doubly Linked List
      const historyEntry: PacketHistoryItem = {
        recordId: `HIST-${Date.now()}-${dequeuedPacket.packetId}`,
        packetId: dequeuedPacket.packetId,
        source: dequeuedPacket.source,
        destination: dequeuedPacket.destination,
        payload: dequeuedPacket.payload,
        path,
        totalCost: routeCost,
        latencyMs: latency,
        status: 'delivered',
        timestamp: timeStr,
        priority: dequeuedPacket.priority
      };

      // 3. Prepend into Doubly Linked List (O(1) at head)
      historyList.insertHead(historyEntry);
      setHistoryRecords(historyList.toArray());

      // 4. Trigger progressive hop animation across the shortest path
      setActiveTransmission({
        packetId: dequeuedPacket.packetId,
        source: dequeuedPacket.source,
        destination: dequeuedPacket.destination,
        path,
        currentHopIndex: 0,
        status: 'transmitting',
        payload: dequeuedPacket.payload,
        totalCost: routeCost,
        routingAlgorithm: 'Dijkstra + HashTable O(1)'
      });

      // Animate hop-by-hop traversal
      let currentHop = 0;
      const hopInterval = 450; // ms per router hop

      const advanceHop = () => {
        currentHop++;
        if (currentHop < path.length) {
          setActiveTransmission({
            packetId: dequeuedPacket.packetId,
            source: dequeuedPacket.source,
            destination: dequeuedPacket.destination,
            path,
            currentHopIndex: currentHop,
            status: 'transmitting',
            payload: dequeuedPacket.payload,
            totalCost: routeCost,
            routingAlgorithm: 'Dijkstra + HashTable O(1)'
          });
          animationTimerRef.current = window.setTimeout(advanceHop, hopInterval);
        } else {
          // Packet reached destination
          setActiveTransmission({
            packetId: dequeuedPacket.packetId,
            source: dequeuedPacket.source,
            destination: dequeuedPacket.destination,
            path,
            currentHopIndex: path.length - 1,
            status: 'delivered',
            payload: dequeuedPacket.payload,
            totalCost: routeCost,
            routingAlgorithm: 'Dijkstra + HashTable O(1)'
          });

          animationTimerRef.current = window.setTimeout(() => {
            setActiveTransmission(null);
          }, 2400);
        }
      };

      animationTimerRef.current = window.setTimeout(advanceHop, hopInterval);
    } else {
      // Transmission Failed
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
      {/* A. TOP HEADER */}
      <Header />

      {/* DASHBOARD BODY */}
      <main className="dashboard-body">
        {/* UPPER ROW: Left Sidebar | Main Topology Area | Right Sidebar */}
        <div className="dashboard-main-grid">
          {/* B. LEFT SIDEBAR: Network Controls + DSA Structures (With Live HashTable Telemetry) */}
          <LeftSidebar
            hashTableStats={{
              storedRoutes: routingHashTable.size(),
              lastLookupKey: lastLookupTelemetry.lastLookupKey,
              isHit: lastLookupTelemetry.isHit
            }}
            onAddRouter={() => handleAddNode('router')}
            onAddDevice={() => handleAddNode('device')}
            onAddConnection={handleAddConnection}
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
          />

          {/* D. RIGHT SIDEBAR: Typical Operations */}
          <RightSidebar
            onSendPacketClick={() => setIsSendModalOpen(true)}
            onProcessPacketClick={handleProcessNext}
            onClearQueueClick={handleClearQueue}
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
    </div>
  );
};

export default App;
