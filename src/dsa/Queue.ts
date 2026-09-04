/**
 * ============================================================================
 * REAL CUSTOM GENERIC QUEUE DATA STRUCTURE (FIFO)
 * Dynamic Packet Routing & Network Simulator
 * ============================================================================
 * 
 * Implemented using a custom Node-based Linked List architecture with distinct
 * head (front) and tail (rear) pointers.
 * 
 * DSA Principles & Complexity:
 * - Order: First-In, First-Out (FIFO)
 * - Enqueue (Insert at Rear): O(1) time complexity
 * - Dequeue (Remove from Front): O(1) time complexity
 * - Front / Rear Peek: O(1) time complexity
 * - Space Complexity: O(N) where N is the number of elements
 * 
 * Note: Does not rely on JavaScript Array.prototype.shift() which is O(N).
 * Real head/tail pointer manipulation guarantees optimal O(1) operations.
 */

/**
 * Individual Node container in the linked Queue
 */
export class QueueNode<T> {
  public data: T;
  public next: QueueNode<T> | null;

  constructor(data: T) {
    this.data = data;
    this.next = null;
  }
}

/**
 * Generic FIFO Queue class
 */
export class Queue<T> {
  private head: QueueNode<T> | null; // Pointer to the front (oldest element)
  private tail: QueueNode<T> | null; // Pointer to the rear (newest element)
  private _size: number;              // Current element count

  constructor() {
    this.head = null;
    this.tail = null;
    this._size = 0;
  }

  /**
   * Adds an item to the rear of the queue (FIFO insertion).
   * Time Complexity: O(1)
   * 
   * @param item The element to enqueue
   */
  public enqueue(item: T): void {
    const newNode = new QueueNode<T>(item);

    if (this.isEmpty()) {
      // When queue is empty, head and tail point to the new node
      this.head = newNode;
      this.tail = newNode;
    } else {
      // Attach to the current tail and advance the tail pointer
      this.tail!.next = newNode;
      this.tail = newNode;
    }

    this._size++;
  }

  /**
   * Removes and returns the item from the front of the queue (FIFO extraction).
   * Time Complexity: O(1)
   * 
   * @returns The dequeued item, or undefined if the queue is empty
   */
  public dequeue(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }

    const removedData = this.head!.data;
    this.head = this.head!.next;

    // If the queue becomes empty after dequeue, reset tail to null
    if (this.head === null) {
      this.tail = null;
    }

    this._size--;
    return removedData;
  }

  /**
   * Peeks at the front item without removing it.
   * Time Complexity: O(1)
   * 
   * @returns The front item, or undefined if empty
   */
  public front(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    return this.head!.data;
  }

  /**
   * Peeks at the rear (most recently added) item without removing it.
   * Time Complexity: O(1)
   * 
   * @returns The rear item, or undefined if empty
   */
  public rear(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    return this.tail!.data;
  }

  /**
   * Checks if the queue contains zero elements.
   * Time Complexity: O(1)
   */
  public isEmpty(): boolean {
    return this._size === 0 || this.head === null;
  }

  /**
   * Returns the current number of elements in the queue.
   * Time Complexity: O(1)
   */
  public size(): number {
    return this._size;
  }

  /**
   * Clears all elements from the queue.
   * Time Complexity: O(1)
   */
  public clear(): void {
    this.head = null;
    this.tail = null;
    this._size = 0;
  }

  /**
   * Converts the linked queue into a sequential array ordered from FRONT (index 0)
   * to REAR (last index) for inspection, debugging, and UI rendering.
   * Time Complexity: O(N)
   */
  public toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current !== null) {
      result.push(current.data);
      current = current.next;
    }
    return result;
  }

  /**
   * Creates an independent deep-linked clone of this Queue instance.
   */
  public clone(): Queue<T> {
    const newQueue = new Queue<T>();
    let current = this.head;
    while (current !== null) {
      newQueue.enqueue(current.data);
      current = current.next;
    }
    return newQueue;
  }
}
