/**
 * ============================================================================
 * SIMULATOR ACTION TYPES FOR LIFO UNDO STACK
 * Dynamic Packet Routing & Network Simulator
 * ============================================================================
 */

import type { Packet, PacketHistoryItem } from './packet';
import type { LinkStatus } from '../dsa/Graph';

export type SimulatorActionType =
  | 'ENQUEUE_PACKET'
  | 'DEQUEUE_TRANSMIT'
  | 'TOGGLE_LINK_STATUS'
  | 'CLEAR_QUEUE';

export interface EnqueuePacketAction {
  type: 'ENQUEUE_PACKET';
  packet: Packet;
  timestamp: string;
  description: string;
}

export interface DequeueTransmitAction {
  type: 'DEQUEUE_TRANSMIT';
  packet: Packet;
  historyRecord: PacketHistoryItem;
  routeTrace: string[];
  wasBacktracked: boolean;
  timestamp: string;
  description: string;
}

export interface ToggleLinkStatusAction {
  type: 'TOGGLE_LINK_STATUS';
  from: string;
  to: string;
  previousStatus: LinkStatus;
  newStatus: LinkStatus;
  timestamp: string;
  description: string;
}

export interface ClearQueueAction {
  type: 'CLEAR_QUEUE';
  clearedPackets: Packet[];
  timestamp: string;
  description: string;
}

export type SimulatorAction =
  | EnqueuePacketAction
  | DequeueTransmitAction
  | ToggleLinkStatusAction
  | ClearQueueAction;
