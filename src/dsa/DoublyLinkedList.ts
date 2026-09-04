/**
 * ============================================================================
 * REAL CUSTOM DOUBLY LINKED LIST DATA STRUCTURE
 * Dynamic Packet Routing & Network Simulator
 * ============================================================================
 * 
 * Implements a bidirectional linear list where every node maintains explicit
 * references to both its previous ('prev') and next ('next') nodes.
 * 
 * DSA Principles & Complexity:
 * - Insert at Head / Tail: O(1)
 * - Remove from Head / Tail: O(1)
 * - Forward & Backward Traversal: O(N)
 * - Memory Overhead: 2 pointers per node (prev, next)
 * 
 * Use Case in Network Simulator:
 * Manages the sequential Packet Transmission History timeline with O(1)
 * insertions and bidirectional timeline inspection.
 */

/**
 * Node container for the Doubly Linked List
 */
export class DLLNode<T> {
  public data: T;
  public prev: DLLNode<T> | null;
  public next: DLLNode<T> | null;

  constructor(data: T) {
    this.data = data;
    this.prev = null;
    this.next = null;
  }
}

/**
 * Generic Doubly Linked List class
 */
export class DoublyLinkedList<T> {
  private head: DLLNode<T> | null;
  private tail: DLLNode<T> | null;
  private _size: number;

  constructor() {
    this.head = null;
    this.tail = null;
    this._size = 0;
  }

  /**
   * Inserts an item at the beginning (head) of the list.
   * Time Complexity: O(1)
   * 
   * @param item The element to prepend
   */
  public insertHead(item: T): void {
    const newNode = new DLLNode<T>(item);

    if (this.isEmpty()) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      newNode.next = this.head;
      this.head!.prev = newNode;
      this.head = newNode;
    }

    this._size++;
  }

  /**
   * Inserts an item at the end (tail) of the list.
   * Time Complexity: O(1)
   * 
   * @param item The element to append
   */
  public insertTail(item: T): void {
    const newNode = new DLLNode<T>(item);

    if (this.isEmpty()) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      newNode.prev = this.tail;
      this.tail!.next = newNode;
      this.tail = newNode;
    }

    this._size++;
  }

  /**
   * Removes and returns the item at the head of the list.
   * Time Complexity: O(1)
   */
  public removeHead(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }

    const removedData = this.head!.data;

    if (this.head === this.tail) {
      this.head = null;
      this.tail = null;
    } else {
      this.head = this.head!.next;
      this.head!.prev = null;
    }

    this._size--;
    return removedData;
  }

  /**
   * Removes and returns the item at the tail of the list.
   * Time Complexity: O(1)
   */
  public removeTail(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }

    const removedData = this.tail!.data;

    if (this.head === this.tail) {
      this.head = null;
      this.tail = null;
    } else {
      this.tail = this.tail!.prev;
      this.tail!.next = null;
    }

    this._size--;
    return removedData;
  }

  /**
   * Peeks at the head element without removing it.
   * Time Complexity: O(1)
   */
  public peekHead(): T | undefined {
    return this.head ? this.head.data : undefined;
  }

  /**
   * Peeks at the tail element without removing it.
   * Time Complexity: O(1)
   */
  public peekTail(): T | undefined {
    return this.tail ? this.tail.data : undefined;
  }

  /**
   * Checks if the list contains zero elements.
   * Time Complexity: O(1)
   */
  public isEmpty(): boolean {
    return this._size === 0;
  }

  /**
   * Returns the current number of elements in the list.
   * Time Complexity: O(1)
   */
  public size(): number {
    return this._size;
  }

  /**
   * Clears the entire list.
   * Time Complexity: O(1)
   */
  public clear(): void {
    this.head = null;
    this.tail = null;
    this._size = 0;
  }

  /**
   * Returns all items ordered from HEAD to TAIL as an array.
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
   * Returns all items ordered in reverse from TAIL to HEAD as an array.
   * Time Complexity: O(N)
   */
  public toArrayReverse(): T[] {
    const result: T[] = [];
    let current = this.tail;
    while (current !== null) {
      result.push(current.data);
      current = current.prev;
    }
    return result;
  }

  /**
   * Creates an independent deep-linked copy of this Doubly Linked List.
   */
  public clone(): DoublyLinkedList<T> {
    const newList = new DoublyLinkedList<T>();
    let current = this.head;
    while (current !== null) {
      newList.insertTail(current.data);
      current = current.next;
    }
    return newList;
  }
}
