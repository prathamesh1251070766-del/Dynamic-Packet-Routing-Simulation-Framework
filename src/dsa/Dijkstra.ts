/**
 * ============================================================================
 * REAL CUSTOM DIJKSTRA'S SHORTEST PATH ALGORITHM
 * Dynamic Packet Routing & Network Simulator
 * ============================================================================
 * 
 * Computes the minimum weight / lowest cost transmission path across the network
 * graph using an Adjacency List and custom Binary Min-Heap (PriorityQueue).
 * Populates custom HashTable for O(1) route lookups.
 * 
 * DSA Principles & Complexity:
 * - Time Complexity: O((V + E) log V) with Binary Min-Heap
 * - Space Complexity: O(V) for distance table, previous pointers, and min-heap
 * - Invariant: Greedily relaxes tentative distances using minimum priority extracts.
 * - Fault Tolerance: Automatically ignores failed/inactive links and inactive nodes.
 */

import { Graph } from './Graph';
import { PriorityQueue } from './PriorityQueue';
import { HashTable } from './HashTable';

export interface DijkstraResult {
  success: boolean;
  source: string;
  destination: string;
  path: string[];              // e.g. ["R1", "R3", "R5"]
  totalCost: number;           // Sum of edge weights along shortest path
  visitedNodes: string[];       // Order of evaluated nodes
  distances: Record<string, number>;
  previousMap: Record<string, string | null>;
  reason?: string;
}

export interface RoutingTableEntry {
  destinationId: string;
  destinationName: string;
  nextHop: string;
  cost: number | string;
  status: 'active' | 'unreachable';
  interfaceName: string;
  path: string[];
}

export interface CachedRouteRecord {
  destinationId: string;
  destinationName: string;
  nextHop: string;
  cost: number | string;
  path: string[];
  status: 'active' | 'unreachable';
  interfaceName: string;
  computedAt: string;
}

/**
 * Calculates the shortest path between a source and destination node using Dijkstra's algorithm.
 * 
 * @param graph Custom Graph instance containing network topology
 * @param source Origin node identifier
 * @param destination Target node identifier
 * @returns Complete DijkstraResult with shortest path and minimum total cost
 */
export function calculateDijkstraShortestPath(
  graph: Graph,
  source: string,
  destination: string
): DijkstraResult {
  const src = source.trim();
  const dst = destination.trim();

  // 1. Initial validations
  if (!graph.hasNode(src)) {
    return {
      success: false,
      source: src,
      destination: dst,
      path: [],
      totalCost: Infinity,
      visitedNodes: [],
      distances: {},
      previousMap: {},
      reason: `Source node "${src}" does not exist in graph.`
    };
  }

  if (!graph.hasNode(dst)) {
    return {
      success: false,
      source: src,
      destination: dst,
      path: [],
      totalCost: Infinity,
      visitedNodes: [],
      distances: {},
      previousMap: {},
      reason: `Destination node "${dst}" does not exist in graph.`
    };
  }

  if (src === dst) {
    return {
      success: true,
      source: src,
      destination: dst,
      path: [src],
      totalCost: 0,
      visitedNodes: [src],
      distances: { [src]: 0 },
      previousMap: { [src]: null }
    };
  }

  // 2. Data Structure Initialization
  const allNodes = graph.getAllNodes();
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const visitedSet = new Set<string>();
  const visitedOrder: string[] = [];

  // Initialize tentative distances to Infinity
  for (const node of allNodes) {
    distances.set(node.id, Infinity);
    previous.set(node.id, null);
  }

  // Distance from source to itself is 0
  distances.set(src, 0);

  // Initialize custom Binary Min-Heap Priority Queue
  const minHeap = new PriorityQueue<string>();
  minHeap.insert(src, 0);

  // 3. Dijkstra Greedy Relaxation Loop
  while (!minHeap.isEmpty()) {
    // Extract node with the current minimum tentative distance: O(log V)
    const current = minHeap.extractMin()!;

    // If we've already finalized the shortest path to this node, skip
    if (visitedSet.has(current)) {
      continue;
    }

    visitedSet.add(current);
    visitedOrder.push(current);

    const currentDist = distances.get(current)!;

    // Early termination optimization: If destination extracted, optimal path found
    if (current === dst) {
      break;
    }

    // Inspect all outgoing links from current node via Adjacency List: O(deg(V))
    const neighbors = graph.getNeighbors(current);
    for (const edge of neighbors) {
      // Dynamic Failure Check: Skip inactive or failed links
      if (edge.status !== 'active') {
        continue;
      }

      // Check target node operational status
      const targetNode = graph.getNode(edge.to);
      if (!targetNode || targetNode.status === 'inactive') {
        continue;
      }

      const neighborId = edge.to;
      const tentativeDistance = currentDist + edge.cost;
      const existingDistance = distances.get(neighborId) ?? Infinity;

      // Relaxation Step: If a shorter path to neighbor is discovered
      if (tentativeDistance < existingDistance) {
        distances.set(neighborId, tentativeDistance);
        previous.set(neighborId, current);

        // Insert / update neighbor in Min-Heap with relaxed distance: O(log V)
        minHeap.insert(neighborId, tentativeDistance);
      }
    }
  }

  // 4. Path Reconstruction
  const finalDstDist = distances.get(dst) ?? Infinity;
  if (finalDstDist === Infinity) {
    return {
      success: false,
      source: src,
      destination: dst,
      path: [],
      totalCost: Infinity,
      visitedNodes: visitedOrder,
      distances: Object.fromEntries(distances),
      previousMap: Object.fromEntries(previous),
      reason: `No active path exists from "${src}" to "${dst}" (Network disconnected or link failed).`
    };
  }

  const path: string[] = [];
  let currNode: string | null = dst;

  while (currNode !== null) {
    path.unshift(currNode);
    if (currNode === src) break;
    currNode = previous.get(currNode) ?? null;
  }

  return {
    success: true,
    source: src,
    destination: dst,
    path,
    totalCost: finalDstDist,
    visitedNodes: visitedOrder,
    distances: Object.fromEntries(distances),
    previousMap: Object.fromEntries(previous)
  };
}

/**
 * Computes all single-source shortest paths to generate the complete Routing Table for a node.
 * 
 * @param graph Custom Graph instance
 * @param sourceNodeId Router for which the routing table is calculated
 * @returns Array of RoutingTableEntry objects
 */
export function computeRoutingTableForNode(
  graph: Graph,
  sourceNodeId: string
): RoutingTableEntry[] {
  const allNodes = graph.getAllNodes();
  const entries: RoutingTableEntry[] = [];

  for (const node of allNodes) {
    if (node.id === sourceNodeId) continue;

    const result = calculateDijkstraShortestPath(graph, sourceNodeId, node.id);

    if (result.success && result.path.length >= 2) {
      const nextHop = result.path[1]; // First hop after source
      entries.push({
        destinationId: node.id,
        destinationName: node.name || node.id,
        nextHop: nextHop === node.id ? `${nextHop} (Direct)` : `${nextHop} (Transit)`,
        cost: result.totalCost,
        status: 'active',
        interfaceName: `eth-${nextHop.toLowerCase()}`,
        path: result.path
      });
    } else {
      entries.push({
        destinationId: node.id,
        destinationName: node.name || node.id,
        nextHop: 'Unreachable',
        cost: '∞',
        status: 'unreachable',
        interfaceName: 'none',
        path: []
      });
    }
  }

  return entries;
}

/**
 * Builds and populates a custom HashTable mapping DestinationId -> CachedRouteRecord
 * for O(1) average-case routing table lookups.
 * 
 * @param graph Custom Graph instance
 * @param sourceNodeId Origin router ID
 * @returns Populated HashTable instance
 */
export function buildRoutingHashTableForNode(
  graph: Graph,
  sourceNodeId: string
): HashTable<CachedRouteRecord> {
  const routingTable = new HashTable<CachedRouteRecord>(16);
  const entries = computeRoutingTableForNode(graph, sourceNodeId);
  const now = new Date().toTimeString().split(' ')[0];

  for (const entry of entries) {
    const record: CachedRouteRecord = {
      ...entry,
      computedAt: now
    };
    routingTable.set(entry.destinationId, record);
  }

  return routingTable;
}
