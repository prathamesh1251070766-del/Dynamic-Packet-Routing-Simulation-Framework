/**
 * ============================================================================
 * REAL CUSTOM STACK DATA STRUCTURE (LIFO)
 * Dynamic Packet Routing & Network Simulator
 * ============================================================================
 * 
 * Implemented using a custom Node-based Linked Stack architecture with an
 * explicit top-of-stack pointer.
 * 
 * DSA Principles & Complexity:
 * - Order: Last-In, First-Out (LIFO)
 * - Push (Insert at Top): O(1)
 * - Pop (Extract from Top): O(1)
 * - Peek (Inspect Top): O(1)
 * - Space Complexity: O(N)
 * 
 * Use Cases in Network Simulator:
 * 1. Packet Route Tracing: Pushes each router hop during traversal; top is current hop.
 * 2. Route Backtracking: Pops previous hops to retreat to earlier routers upon link failures.
 * 3. Undo Operation History: Stores user actions for clean LIFO state reversal.
 */

/**
 * Node container for the Linked Stack
 */
export class StackNode<T> {
  public data: T;
  public next: StackNode<T> | null;

  constructor(data: T) {
    this.data = data;
    this.next = null;
  }
}

/**
 * Generic LIFO Stack class
 */
export class Stack<T> {
  private topNode: StackNode<T> | null;
  private _size: number;

  constructor() {
    this.topNode = null;
    this._size = 0;
  }

  /**
   * Pushes a new element onto the top of the stack.
   * Time Complexity: O(1)
   * 
   * @param item The element to push
   */
  public push(item: T): void {
    const newNode = new StackNode<T>(item);
    newNode.next = this.topNode;
    this.topNode = newNode;
    this._size++;
  }

  /**
   * Removes and returns the element at the top of the stack (LIFO).
   * Time Complexity: O(1)
   * 
   * @returns The popped item or undefined if stack is empty
   */
  public pop(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }

    const removedData = this.topNode!.data;
    this.topNode = this.topNode!.next;
    this._size--;
    return removedData;
  }

  /**
   * Returns the element at the top without removing it.
   * Time Complexity: O(1)
   */
  public peek(): T | undefined {
    return this.topNode ? this.topNode.data : undefined;
  }

  /**
   * Checks if the stack contains zero elements.
   * Time Complexity: O(1)
   */
  public isEmpty(): boolean {
    return this._size === 0 || this.topNode === null;
  }

  /**
   * Returns the count of elements currently on the stack.
   * Time Complexity: O(1)
   */
  public size(): number {
    return this._size;
  }

  /**
   * Clears all elements from the stack.
   * Time Complexity: O(1)
   */
  public clear(): void {
    this.topNode = null;
    this._size = 0;
  }

  /**
   * Returns all items ordered sequentially from TOP (index 0) to BOTTOM as an array.
   * Time Complexity: O(N)
   */
  public toArray(): T[] {
    const result: T[] = [];
    let current = this.topNode;
    while (current !== null) {
      result.push(current.data);
      current = current.next;
    }
    return result;
  }

  /**
   * Creates an independent deep copy of this Stack instance.
   */
  public clone(): Stack<T> {
    const newStack = new Stack<T>();
    const items = this.toArray().reverse(); // Reverse so pushing preserves original order
    for (const item of items) {
      newStack.push(item);
    }
    return newStack;
  }
}
