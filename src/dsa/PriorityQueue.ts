/**
 * ============================================================================
 * REAL CUSTOM PRIORITY QUEUE / MIN-HEAP DATA STRUCTURE
 * Dynamic Packet Routing & Network Simulator
 * ============================================================================
 * 
 * Implemented using a complete Binary Min-Heap backed by a dynamic array.
 * Serves as the priority extraction backbone for Dijkstra's Shortest Path Algorithm.
 * 
 * DSA Principles & Heap Invariant:
 * - In a Min-Heap, the parent node's priority is always <= its children's priorities.
 * - Root element (index 0) always holds the minimum priority value.
 * - Array Index Formulas (0-indexed):
 *     Parent(i)      = Math.floor((i - 1) / 2)
 *     LeftChild(i)   = 2 * i + 1
 *     RightChild(i)  = 2 * i + 2
 * 
 * Complexities:
 * - Insert / Push (Bubble-Up):    O(log N)
 * - ExtractMin / Pop (Sink-Down): O(log N)
 * - Peek Min Priority:            O(1)
 * - Space Complexity:             O(N)
 */

export interface HeapNode<T> {
  element: T;
  priority: number; // Smaller value = higher priority (e.g. distance/cost)
}

export class PriorityQueue<T> {
  private heap: HeapNode<T>[];

  constructor() {
    this.heap = [];
  }

  /**
   * Inserts a new element with an associated numeric priority into the Min-Heap.
   * Performs Bubble-Up (Sift-Up) to restore the Min-Heap invariant.
   * Time Complexity: O(log N)
   * 
   * @param element The payload or identifier to store (e.g., nodeId)
   * @param priority The sorting weight (e.g., shortest tentative distance)
   */
  public insert(element: T, priority: number): void {
    const node: HeapNode<T> = { element, priority };
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  /**
   * Alias for insert()
   */
  public push(element: T, priority: number): void {
    this.insert(element, priority);
  }

  /**
   * Extracts and returns the element with the minimum priority value from the root.
   * Replaces root with the last element and performs Sink-Down (Sift-Down).
   * Time Complexity: O(log N)
   * 
   * @returns The element with smallest priority, or undefined if heap is empty
   */
  public extractMin(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }

    if (this.heap.length === 1) {
      return this.heap.pop()!.element;
    }

    const minElement = this.heap[0].element;
    // Move last element to root and sift down
    this.heap[0] = this.heap.pop()!;
    this.sinkDown(0);

    return minElement;
  }

  /**
   * Alias for extractMin()
   */
  public pop(): T | undefined {
    return this.extractMin();
  }

  /**
   * Peeks at the root element without removing it.
   * Time Complexity: O(1)
   */
  public peek(): T | undefined {
    return this.isEmpty() ? undefined : this.heap[0].element;
  }

  /**
   * Peeks at the minimum priority value without extracting.
   * Time Complexity: O(1)
   */
  public peekPriority(): number | undefined {
    return this.isEmpty() ? undefined : this.heap[0].priority;
  }

  /**
   * Checks if the priority queue has no elements.
   * Time Complexity: O(1)
   */
  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  /**
   * Returns the count of elements currently stored in the heap.
   * Time Complexity: O(1)
   */
  public size(): number {
    return this.heap.length;
  }

  /**
   * Clears all items from the heap.
   * Time Complexity: O(1)
   */
  public clear(): void {
    this.heap = [];
  }

  /**
   * Returns a shallow copy of the internal heap array for inspection.
   */
  public toArray(): HeapNode<T>[] {
    return [...this.heap];
  }

  /**
   * Restores Min-Heap property by bubbling an element upwards until parent <= child.
   * @param index Starting index of element to bubble up
   */
  private bubbleUp(index: number): void {
    let curr = index;
    const target = this.heap[curr];

    while (curr > 0) {
      const parentIdx = Math.floor((curr - 1) / 2);
      const parent = this.heap[parentIdx];

      // If parent priority is already smaller or equal, heap property is satisfied
      if (target.priority >= parent.priority) {
        break;
      }

      // Swap parent down to current position
      this.heap[curr] = parent;
      curr = parentIdx;
    }

    this.heap[curr] = target;
  }

  /**
   * Restores Min-Heap property by sinking an element downwards until parent <= children.
   * @param index Starting index of element to sink down
   */
  private sinkDown(index: number): void {
    const length = this.heap.length;
    const target = this.heap[index];
    let curr = index;

    while (true) {
      const leftChildIdx = 2 * curr + 1;
      const rightChildIdx = 2 * curr + 2;
      let smallestIdx = curr;

      // Compare with left child
      if (
        leftChildIdx < length &&
        this.heap[leftChildIdx].priority < this.heap[smallestIdx].priority
      ) {
        smallestIdx = leftChildIdx;
      }

      // Compare with right child
      if (
        rightChildIdx < length &&
        this.heap[rightChildIdx].priority < this.heap[smallestIdx].priority
      ) {
        smallestIdx = rightChildIdx;
      }

      // If current element is smaller than both children, heap is valid
      if (smallestIdx === curr) {
        break;
      }

      // Swap with the smaller child and continue sinking
      this.heap[curr] = this.heap[smallestIdx];
      curr = smallestIdx;
    }

    this.heap[curr] = target;
  }
}
