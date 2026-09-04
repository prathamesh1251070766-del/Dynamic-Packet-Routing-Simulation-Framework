# Dynamic Packet Routing Simulation Framework

## Project Purpose
A comprehensive visualization and simulation tool for network packet routing. This framework allows users to understand, analyze, and simulate how packets are routed dynamically across a network topology.

## Main DSA Concepts Used
- **Graph / Adjacency List**: Used to represent the network topology (routers as nodes, links as edges).
- **Queue**: Used for packet processing and Breadth-First Search (BFS) traversals.
- **Priority Queue / Min-Heap**: Essential for efficiently computing the shortest paths.
- **Dijkstra's Algorithm**: The core routing algorithm to find the optimal path for packets.
- **Hash Table**: Fast lookups for routing tables and node information.
- **Doubly Linked List**: Managing dynamic sequences of packets and historical paths.

## Technologies Used
- React
- TypeScript
- Vite

## Basic Instructions for Running the Project
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to the local URL provided in the terminal (usually `http://localhost:5173`).
4. To build for production, run:
   ```bash
   npm run build
   ```
