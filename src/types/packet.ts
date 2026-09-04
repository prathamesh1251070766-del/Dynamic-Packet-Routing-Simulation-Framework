/**
 * ============================================================================
 * PACKET DATA STRUCTURE TYPES
 * Dynamic Packet Routing & Network Simulator
 * ============================================================================
 */

export type PacketStatus = 'queued' | 'processing' | 'delivered' | 'dropped';

export type PacketPriority = 1 | 2 | 3; // 1 = Normal (Low), 2 = High, 3 = Critical / Voice

export interface Packet {
  packetId: string;              // e.g. "PKT-1001"
  source: string;                // Origin node ID (e.g. "R1")
  destination: string;           // Target node ID (e.g. "R5")
  payload: string;               // Message payload / packet label (e.g. "Sensor Telemetry")
  timestamp: number;             // Epoch timestamp (ms)
  createdAt: string;             // Formatted time string (e.g. "19:42:05")
  status: PacketStatus;          // Current state
  priority: PacketPriority;      // Priority level (1: Normal, 2: High, 3: Critical)
  sizeBytes: number;             // Payload byte size (e.g. 64B, 512B, 1500B)
  processedAt?: number;          // Epoch timestamp when dequeued/processed
  transmissionPath?: string[];   // Sequence of traversed nodes (e.g. ["R1", "R3", "R5"])
  totalCost?: number;            // Accumulated edge weights along the route
  latencyMs?: number;            // Simulated delay calculated from route cost
  failureReason?: string;        // Reason if transmission failed or dropped
  stackTrace?: string[];         // LIFO Stack hop order (TOP -> BOTTOM)
  wasBacktracked?: boolean;      // Whether Stack.pop() backtracking occurred
}

/**
 * Historical record stored in the Doubly Linked List timeline
 */
export interface PacketHistoryItem {
  recordId: string;
  packetId: string;
  source: string;
  destination: string;
  payload: string;
  path: string[];
  totalCost: number;
  latencyMs: number;
  status: 'delivered' | 'dropped';
  timestamp: string;
  priority: PacketPriority;
  failureReason?: string;
  stackTrace?: string[];         // LIFO hop trace recorded via Stack
  wasBacktracked?: boolean;      // True if Stack.pop() backtracking resolved route
}
