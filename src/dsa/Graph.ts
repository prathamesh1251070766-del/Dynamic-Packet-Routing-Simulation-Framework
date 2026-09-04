/**
 * ============================================================================
 * REAL CUSTOM GRAPH DATA STRUCTURE
 * Dynamic Packet Routing & Network Simulator
 * ============================================================================
 * 
 * Custom weighted graph implementation utilizing an Adjacency List representation.
 * Represents network topology with Router/Device nodes and weighted transmission links.
 * 
 * DSA Concept:
 * - Adjacency List: Map<NodeId, NetworkEdge[]>
 * - Space Complexity: O(V + E)
 * - Neighbor Lookup: O(degree(V))
 * - Edge Insertion/Removal: O(degree(V))
 */

export type NodeType = 'router' | 'device';
export type NodeStatus = 'active' | 'inactive';
export type LinkStatus = 'active' | 'failed';

export interface NodePosition {
  x: number;
  y: number;
}

/**
 * Interface representing a network node (Router or End Device / Host)
 */
export interface NetworkNode {
  id: string;              // Unique identifier (e.g., "R1", "R2", "PC-1")
  name: string;            // Human-readable name (e.g., "R1 (Source Gateway)")
  type: NodeType;          // Node role ('router' | 'device')
  ipAddress: string;       // Simulated IP address (e.g., "10.0.1.1")
  status: NodeStatus;      // Current state ('active' | 'inactive')
  position?: NodePosition; // Visual 2D coordinate on canvas {x, y}
  roleDescription?: string;// Functional descriptor (e.g., "Core Hub", "Edge Node")
}

/**
 * Interface representing a weighted communication link / edge between two nodes
 */
export interface NetworkEdge {
  from: string;            // Origin node ID
  to: string;              // Destination node ID
  cost: number;            // Routing metric / link weight / latency (must be >= 0)
  bandwidth: number;       // Link capacity in Mbps (e.g., 1000 Mbps)
  capacity: number;        // Max queue/concurrent packet capacity
  status: LinkStatus;      // Link state ('active' | 'failed')
}

/**
 * Custom Weighted Graph class using an Adjacency List for network simulation
 */
export class Graph {
  // Primary node registry: NodeId -> NetworkNode
  private nodes: Map<string, NetworkNode>;

  // Adjacency list: NodeId -> Array of incident NetworkEdges
  private adjacencyList: Map<string, NetworkEdge[]>;

  constructor() {
    this.nodes = new Map<string, NetworkNode>();
    this.adjacencyList = new Map<string, NetworkEdge[]>();
  }

  /**
   * Adds a new node to the network graph.
   * @param node The NetworkNode object to insert
   * @returns true if added successfully, false if node with same ID already exists
   */
  public addNode(node: NetworkNode): boolean {
    if (!node || !node.id || typeof node.id !== 'string') {
      console.warn('[Graph.addNode] Invalid node or node ID provided.');
      return false;
    }

    const cleanId = node.id.trim();
    if (this.nodes.has(cleanId)) {
      console.warn(`[Graph.addNode] Node with ID "${cleanId}" already exists.`);
      return false;
    }

    // Clone node object to preserve immutability
    const nodeRecord: NetworkNode = {
      ...node,
      id: cleanId,
      status: node.status || 'active',
      type: node.type || 'router',
      ipAddress: node.ipAddress || '127.0.0.1'
    };

    this.nodes.set(cleanId, nodeRecord);
    this.adjacencyList.set(cleanId, []);
    return true;
  }

  /**
   * Retrieves a node by its unique identifier.
   * @param nodeId Unique identifier of the node
   */
  public getNode(nodeId: string): NetworkNode | undefined {
    if (!nodeId) return undefined;
    return this.nodes.get(nodeId.trim());
  }

  /**
   * Checks if a node exists in the graph.
   * @param nodeId Unique identifier of the node
   */
  public hasNode(nodeId: string): boolean {
    if (!nodeId) return false;
    return this.nodes.has(nodeId.trim());
  }

  /**
   * Returns an array of all nodes in the graph.
   */
  public getAllNodes(): NetworkNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Returns the total count of nodes in the graph |V|.
   */
  public getNodeCount(): number {
    return this.nodes.size;
  }

  /**
   * Removes a node and all incident edges connected to/from it.
   * @param nodeId Unique identifier of the node to remove
   * @returns true if removed, false if node did not exist
   */
  public removeNode(nodeId: string): boolean {
    if (!nodeId) return false;
    const cleanId = nodeId.trim();

    if (!this.nodes.has(cleanId)) {
      console.warn(`[Graph.removeNode] Cannot remove non-existent node "${cleanId}".`);
      return false;
    }

    // 1. Remove this node's own adjacency list
    this.adjacencyList.delete(cleanId);

    // 2. Remove all incoming edges pointing to this node from other nodes
    for (const [otherId, edges] of this.adjacencyList.entries()) {
      const filteredEdges = edges.filter((edge) => edge.to !== cleanId);
      this.adjacencyList.set(otherId, filteredEdges);
    }

    // 3. Remove from node registry
    this.nodes.delete(cleanId);
    return true;
  }

  /**
   * Adds a weighted edge between two existing nodes.
   * Handles bidirectional links by adding reciprocal edges in the adjacency list.
   * 
   * @param from Origin node ID
   * @param to Destination node ID
   * @param linkData Cost number OR partial edge configuration
   * @param bidirectional If true, inserts both (from -> to) and (to -> from)
   * @returns true if edge created successfully, false otherwise
   */
  public addEdge(
    from: string,
    to: string,
    linkData?: number | Partial<NetworkEdge>,
    bidirectional: boolean = true
  ): boolean {
    if (!from || !to) {
      console.warn('[Graph.addEdge] Missing "from" or "to" node ID.');
      return false;
    }

    const cleanFrom = from.trim();
    const cleanTo = to.trim();

    if (cleanFrom === cleanTo) {
      console.warn(`[Graph.addEdge] Self-loops not permitted: ${cleanFrom} -> ${cleanTo}`);
      return false;
    }

    // Validate existence of both endpoint nodes
    if (!this.nodes.has(cleanFrom)) {
      console.warn(`[Graph.addEdge] Source node "${cleanFrom}" does not exist in graph.`);
      return false;
    }
    if (!this.nodes.has(cleanTo)) {
      console.warn(`[Graph.addEdge] Destination node "${cleanTo}" does not exist in graph.`);
      return false;
    }

    // Parse options / defaults
    let cost = 1;
    let bandwidth = 1000;
    let capacity = 100;
    let status: LinkStatus = 'active';

    if (typeof linkData === 'number') {
      cost = linkData;
    } else if (linkData && typeof linkData === 'object') {
      if (linkData.cost !== undefined) cost = linkData.cost;
      if (linkData.bandwidth !== undefined) bandwidth = linkData.bandwidth;
      if (linkData.capacity !== undefined) capacity = linkData.capacity;
      if (linkData.status !== undefined) status = linkData.status;
    }

    if (cost < 0 || isNaN(cost)) {
      console.warn(`[Graph.addEdge] Invalid edge cost "${cost}". Cost must be a non-negative number.`);
      return false;
    }

    // Helper to insert or update single directed edge
    const insertDirectedEdge = (src: string, dst: string): void => {
      const edgeList = this.adjacencyList.get(src) || [];
      const existingIndex = edgeList.findIndex((e) => e.to === dst);

      const edgeRecord: NetworkEdge = {
        from: src,
        to: dst,
        cost,
        bandwidth,
        capacity,
        status
      };

      if (existingIndex >= 0) {
        // Update existing edge
        edgeList[existingIndex] = edgeRecord;
      } else {
        // Append new edge to adjacency list
        edgeList.push(edgeRecord);
      }
      this.adjacencyList.set(src, edgeList);
    };

    // 1. Insert forward edge (from -> to)
    insertDirectedEdge(cleanFrom, cleanTo);

    // 2. Insert reverse edge (to -> from) if bidirectional
    if (bidirectional) {
      insertDirectedEdge(cleanTo, cleanFrom);
    }

    return true;
  }

  /**
   * Removes a connection between two nodes.
   * @param from Origin node ID
   * @param to Destination node ID
   * @param bidirectional If true, removes both (from -> to) and (to -> from)
   */
  public removeEdge(from: string, to: string, bidirectional: boolean = true): boolean {
    if (!from || !to) return false;
    const cleanFrom = from.trim();
    const cleanTo = to.trim();

    let removed = false;

    // Remove from -> to
    const fromEdges = this.adjacencyList.get(cleanFrom);
    if (fromEdges) {
      const initialLength = fromEdges.length;
      const updatedEdges = fromEdges.filter((e) => e.to !== cleanTo);
      if (updatedEdges.length < initialLength) {
        this.adjacencyList.set(cleanFrom, updatedEdges);
        removed = true;
      }
    }

    // Remove to -> from if bidirectional
    if (bidirectional) {
      const toEdges = this.adjacencyList.get(cleanTo);
      if (toEdges) {
        const initialLength = toEdges.length;
        const updatedEdges = toEdges.filter((e) => e.to !== cleanFrom);
        if (updatedEdges.length < initialLength) {
          this.adjacencyList.set(cleanTo, updatedEdges);
          removed = true;
        }
      }
    }

    return removed;
  }

  /**
   * Returns all outgoing / adjacent edges from a given node.
   * @param nodeId Unique identifier of the node
   */
  public getNeighbors(nodeId: string): NetworkEdge[] {
    if (!nodeId) return [];
    const cleanId = nodeId.trim();
    return this.adjacencyList.get(cleanId) ? [...(this.adjacencyList.get(cleanId)!)] : [];
  }

  /**
   * Retrieves a specific edge between two nodes if it exists.
   * @param from Origin node ID
   * @param to Destination node ID
   */
  public getEdge(from: string, to: string): NetworkEdge | undefined {
    if (!from || !to) return undefined;
    const cleanFrom = from.trim();
    const cleanTo = to.trim();
    const edges = this.adjacencyList.get(cleanFrom);
    if (!edges) return undefined;
    return edges.find((e) => e.to === cleanTo);
  }

  /**
   * Returns all edges currently in the graph.
   * @param uniqueUndirected If true, returns only one representative edge per bidirectional pair
   */
  public getAllEdges(uniqueUndirected: boolean = false): NetworkEdge[] {
    const allEdges: NetworkEdge[] = [];
    const visitedPairs = new Set<string>();

    for (const [, edges] of this.adjacencyList.entries()) {
      for (const edge of edges) {
        if (uniqueUndirected) {
          const pairKey = edge.from < edge.to ? `${edge.from}-${edge.to}` : `${edge.to}-${edge.from}`;
          if (!visitedPairs.has(pairKey)) {
            visitedPairs.add(pairKey);
            allEdges.push(edge);
          }
        } else {
          allEdges.push(edge);
        }
      }
    }

    return allEdges;
  }

  /**
   * Returns the count of unique undirected / bidirectional links |E|.
   */
  public getUniqueEdgeCount(): number {
    return this.getAllEdges(true).length;
  }

  /**
   * Updates the operational status of a link ('active' | 'failed') for dynamic simulation.
   * 
   * @param from Origin node ID
   * @param to Destination node ID
   * @param status 'active' or 'failed'
   * @param bidirectional If true, updates both directions
   */
  public updateLinkStatus(
    from: string,
    to: string,
    status: LinkStatus,
    bidirectional: boolean = true
  ): boolean {
    if (!from || !to) return false;
    const cleanFrom = from.trim();
    const cleanTo = to.trim();

    let updated = false;

    // Update from -> to
    const fromEdges = this.adjacencyList.get(cleanFrom);
    if (fromEdges) {
      const edge = fromEdges.find((e) => e.to === cleanTo);
      if (edge) {
        edge.status = status;
        updated = true;
      }
    }

    // Update to -> from if bidirectional
    if (bidirectional) {
      const toEdges = this.adjacencyList.get(cleanTo);
      if (toEdges) {
        const edge = toEdges.find((e) => e.to === cleanFrom);
        if (edge) {
          edge.status = status;
          updated = true;
        }
      }
    }

    return updated;
  }

  /**
   * Finds a valid transmission path between source and destination using active graph links.
   * Traverses the adjacency list and verifies that all edges and nodes along the route are active.
   * 
   * @param source Origin node ID
   * @param destination Target node ID
   * @returns Path finding result with route sequence and total cost
   */
  public findValidPath(
    source: string,
    destination: string
  ): { success: boolean; path: string[]; totalCost: number; reason?: string } {
    const srcClean = source.trim();
    const dstClean = destination.trim();

    if (!this.hasNode(srcClean)) {
      return { success: false, path: [], totalCost: 0, reason: `Source node "${srcClean}" does not exist.` };
    }
    if (!this.hasNode(dstClean)) {
      return { success: false, path: [], totalCost: 0, reason: `Destination node "${dstClean}" does not exist.` };
    }

    if (srcClean === dstClean) {
      return { success: true, path: [srcClean], totalCost: 0 };
    }

    // Path finding via Breadth-First exploration of active adjacency list
    const visited = new Set<string>();
    const parentMap = new Map<string, { prev: string; cost: number }>();
    const queue: string[] = [srcClean];
    visited.add(srcClean);

    let found = false;

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current === dstClean) {
        found = true;
        break;
      }

      const neighbors = this.getNeighbors(current);
      for (const edge of neighbors) {
        // Only traverse active links and active target nodes
        const targetNode = this.getNode(edge.to);
        const isNodeActive = targetNode ? targetNode.status !== 'inactive' : false;

        if (edge.status === 'active' && isNodeActive && !visited.has(edge.to)) {
          visited.add(edge.to);
          parentMap.set(edge.to, { prev: current, cost: edge.cost });
          queue.push(edge.to);
        }
      }
    }

    if (!found) {
      return {
        success: false,
        path: [],
        totalCost: 0,
        reason: `Destination "${dstClean}" is unreachable from "${srcClean}" (Link or node down).`
      };
    }

    // Reconstruct path from destination backwards to source
    const path: string[] = [];
    let curr = dstClean;
    let totalCost = 0;

    while (curr !== srcClean) {
      path.unshift(curr);
      const parentInfo = parentMap.get(curr);
      if (!parentInfo) break;
      totalCost += parentInfo.cost;
      curr = parentInfo.prev;
    }
    path.unshift(srcClean);

    return {
      success: true,
      path,
      totalCost
    };
  }

  /**
   * Clears all nodes and edges from the graph.
   */
  public clear(): void {
    this.nodes.clear();
    this.adjacencyList.clear();
  }

  /**
   * Creates a deep clone of the current Graph instance.
   */
  public clone(): Graph {
    const newGraph = new Graph();
    for (const node of this.getAllNodes()) {
      newGraph.addNode({ ...node });
    }
    for (const edge of this.getAllEdges(false)) {
      newGraph.addEdge(edge.from, edge.to, { ...edge }, false);
    }
    return newGraph;
  }
}
