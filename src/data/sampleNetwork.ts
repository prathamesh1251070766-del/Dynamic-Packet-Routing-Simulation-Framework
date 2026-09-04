/**
 * ============================================================================
 * SAMPLE NETWORK TOPOLOGY GENERATOR
 * Dynamic Packet Routing & Network Simulator
 * ============================================================================
 * 
 * Initializes the canonical sample network graph instance using the custom
 * Graph data structure. Acts as the single source of truth for topology data.
 */

import { Graph, type NetworkNode, type NetworkEdge } from '../dsa/Graph';

/**
 * Initial sample nodes defining the base network topology
 */
export const SAMPLE_NODES: NetworkNode[] = [
  {
    id: 'R1',
    name: 'R1 (Source)',
    type: 'router',
    ipAddress: '10.0.1.1',
    status: 'active',
    position: { x: 180, y: 120 },
    roleDescription: 'Source Gateway 10.0.1.1'
  },
  {
    id: 'R2',
    name: 'R2',
    type: 'router',
    ipAddress: '10.0.1.2',
    status: 'active',
    position: { x: 620, y: 120 },
    roleDescription: 'Core Router 10.0.1.2'
  },
  {
    id: 'R3',
    name: 'R3 (Core Hub)',
    type: 'router',
    ipAddress: '10.0.1.3',
    status: 'active',
    position: { x: 400, y: 230 },
    roleDescription: 'Optimal Transit 10.0.1.3'
  },
  {
    id: 'R4',
    name: 'R4',
    type: 'router',
    ipAddress: '10.0.1.4',
    status: 'active',
    position: { x: 180, y: 340 },
    roleDescription: 'Edge Node 10.0.1.4'
  },
  {
    id: 'R5',
    name: 'R5 (Destination)',
    type: 'router',
    ipAddress: '10.0.1.5',
    status: 'active',
    position: { x: 620, y: 340 },
    roleDescription: 'Target Host 10.0.1.5'
  }
];

/**
 * Initial sample link connections with associated costs and bandwidth
 */
export const SAMPLE_LINKS: Omit<NetworkEdge, 'status'>[] = [
  { from: 'R1', to: 'R2', cost: 4, bandwidth: 1000, capacity: 100 },
  { from: 'R1', to: 'R3', cost: 2, bandwidth: 1000, capacity: 100 },
  { from: 'R1', to: 'R4', cost: 3, bandwidth: 1000, capacity: 100 },
  { from: 'R3', to: 'R5', cost: 2, bandwidth: 1000, capacity: 100 },
  { from: 'R2', to: 'R5', cost: 5, bandwidth: 1000, capacity: 100 },
  { from: 'R4', to: 'R5', cost: 6, bandwidth: 1000, capacity: 100 }
];

/**
 * Creates and populates a new Graph instance with the canonical sample network topology.
 * @returns Populated Graph instance
 */
export function createSampleNetwork(): Graph {
  const graph = new Graph();

  // 1. Add all nodes
  for (const node of SAMPLE_NODES) {
    graph.addNode(node);
  }

  // 2. Add all bidirectional weighted links
  for (const link of SAMPLE_LINKS) {
    graph.addEdge(link.from, link.to, {
      cost: link.cost,
      bandwidth: link.bandwidth,
      capacity: link.capacity,
      status: 'active'
    }, true);
  }

  return graph;
}
