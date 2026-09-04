/**
 * ============================================================================
 * REAL CUSTOM HASH TABLE DATA STRUCTURE
 * Dynamic Packet Routing & Network Simulator
 * ============================================================================
 * 
 * Implements a collision-safe Hash Table using Polynomial Rolling Hashing
 * and Separate Chaining with dynamic capacity resizing.
 * 
 * DSA Principles & Complexity:
 * - Average Time Complexity:
 *     - set(key, value): O(1)
 *     - get(key):        O(1)
 *     - has(key):        O(1)
 *     - remove(key):     O(1)
 * - Worst Case (Heavy Collisions): O(N)
 * - Space Complexity: O(N + Capacity)
 * - Load Factor Threshold: 0.75 (Triggers automatic doubling of bucket capacity)
 * - Collision Strategy: Separate Chaining (Linked nodes per bucket)
 * 
 * Use Case in Network Simulator:
 * Provides instant O(1) routing table destination lookups, mapping destination
 * Node IDs (e.g. "R5") directly to precomputed shortest path records.
 */

/**
 * Node container for Separate Chaining linked list inside each bucket
 */
export class HashEntry<V> {
  public key: string;
  public value: V;
  public next: HashEntry<V> | null;

  constructor(key: string, value: V) {
    this.key = key;
    this.value = value;
    this.next = null;
  }
}

export interface HashTableDiagnostics {
  size: number;
  capacity: number;
  loadFactor: number;
  collisions: number;
  activeBuckets: number;
}

export class HashTable<V> {
  private buckets: Array<HashEntry<V> | null>;
  private _capacity: number;
  private _size: number;
  private _collisionCount: number;
  private readonly LOAD_FACTOR_THRESHOLD = 0.75;

  constructor(initialCapacity: number = 16) {
    this._capacity = Math.max(initialCapacity, 8);
    this.buckets = new Array(this._capacity).fill(null);
    this._size = 0;
    this._collisionCount = 0;
  }

  /**
   * Polynomial rolling hash function.
   * Computes deterministic integer bucket index from string key.
   * 
   * Formula: h(s) = (s[0]*31^(n-1) + s[1]*31^(n-2) + ... + s[n-1]) % capacity
   */
  private hash(key: string): number {
    let hashVal = 0;
    const PRIME_MULTIPLIER = 31;

    for (let i = 0; i < key.length; i++) {
      hashVal = (hashVal * PRIME_MULTIPLIER + key.charCodeAt(i)) % this._capacity;
    }

    return (hashVal + this._capacity) % this._capacity;
  }

  /**
   * Stores or updates a key-value pair in the Hash Table.
   * Uses Separate Chaining for collision resolution.
   * Time Complexity: O(1) Average
   * 
   * @param key Unique string identifier
   * @param value Associated data payload
   */
  public set(key: string, value: V): void {
    if (!key || typeof key !== 'string') {
      console.warn('[HashTable.set] Invalid string key provided.');
      return;
    }

    const cleanKey = key.trim();
    const bucketIndex = this.hash(cleanKey);
    let head = this.buckets[bucketIndex];

    // 1. Check if key already exists in the bucket chain (Update existing)
    let current = head;
    while (current !== null) {
      if (current.key === cleanKey) {
        current.value = value;
        return;
      }
      current = current.next;
    }

    // 2. Insert new entry at the head of the chain (O(1) insertion)
    const newEntry = new HashEntry<V>(cleanKey, value);

    if (head !== null) {
      // Collision occurred on this bucket index
      this._collisionCount++;
      newEntry.next = head;
    }

    this.buckets[bucketIndex] = newEntry;
    this._size++;

    // 3. Check load factor for dynamic resizing
    if (this.getLoadFactor() >= this.LOAD_FACTOR_THRESHOLD) {
      this.resize(this._capacity * 2);
    }
  }

  /**
   * Retrieves value for a given key.
   * Time Complexity: O(1) Average
   * 
   * @param key String identifier to lookup
   * @returns Stored value or undefined if not found
   */
  public get(key: string): V | undefined {
    if (!key) return undefined;
    const cleanKey = key.trim();
    const bucketIndex = this.hash(cleanKey);

    let current = this.buckets[bucketIndex];
    while (current !== null) {
      if (current.key === cleanKey) {
        return current.value;
      }
      current = current.next;
    }

    return undefined;
  }

  /**
   * Checks whether the given key exists in the Hash Table.
   * Time Complexity: O(1) Average
   */
  public has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Removes a key-value pair from the Hash Table.
   * Time Complexity: O(1) Average
   * 
   * @param key String identifier to remove
   * @returns true if removed, false if not found
   */
  public remove(key: string): boolean {
    if (!key) return false;
    const cleanKey = key.trim();
    const bucketIndex = this.hash(cleanKey);

    let current = this.buckets[bucketIndex];
    let prev: HashEntry<V> | null = null;

    while (current !== null) {
      if (current.key === cleanKey) {
        if (prev === null) {
          // Node is head of bucket
          this.buckets[bucketIndex] = current.next;
        } else {
          // Unlink node from chain
          prev.next = current.next;
        }
        this._size--;
        return true;
      }
      prev = current;
      current = current.next;
    }

    return false;
  }

  /**
   * Clears all entries and resets the table.
   * Time Complexity: O(Capacity)
   */
  public clear(): void {
    this.buckets = new Array(this._capacity).fill(null);
    this._size = 0;
    this._collisionCount = 0;
  }

  /**
   * Returns all keys stored in the Hash Table.
   * Time Complexity: O(Capacity + Size)
   */
  public keys(): string[] {
    const keyList: string[] = [];
    for (let i = 0; i < this._capacity; i++) {
      let current = this.buckets[i];
      while (current !== null) {
        keyList.push(current.key);
        current = current.next;
      }
    }
    return keyList;
  }

  /**
   * Returns all values stored in the Hash Table.
   * Time Complexity: O(Capacity + Size)
   */
  public values(): V[] {
    const valueList: V[] = [];
    for (let i = 0; i < this._capacity; i++) {
      let current = this.buckets[i];
      while (current !== null) {
        valueList.push(current.value);
        current = current.next;
      }
    }
    return valueList;
  }

  /**
   * Returns all [key, value] tuples stored in the Hash Table.
   * Time Complexity: O(Capacity + Size)
   */
  public entries(): Array<[string, V]> {
    const entryList: Array<[string, V]> = [];
    for (let i = 0; i < this._capacity; i++) {
      let current = this.buckets[i];
      while (current !== null) {
        entryList.push([current.key, current.value]);
        current = current.next;
      }
    }
    return entryList;
  }

  /**
   * Returns the count of key-value pairs stored in the table.
   * Time Complexity: O(1)
   */
  public size(): number {
    return this._size;
  }

  /**
   * Returns the current bucket array capacity.
   * Time Complexity: O(1)
   */
  public capacity(): number {
    return this._capacity;
  }

  /**
   * Returns the count of hash collisions encountered.
   * Time Complexity: O(1)
   */
  public collisions(): number {
    return this._collisionCount;
  }

  /**
   * Returns the current load factor (size / capacity).
   */
  public getLoadFactor(): number {
    return this._capacity > 0 ? this._size / this._capacity : 0;
  }

  /**
   * Returns diagnostic metrics for UI and viva presentation.
   */
  public getDiagnostics(): HashTableDiagnostics {
    let activeBuckets = 0;
    for (let i = 0; i < this._capacity; i++) {
      if (this.buckets[i] !== null) {
        activeBuckets++;
      }
    }

    return {
      size: this._size,
      capacity: this._capacity,
      loadFactor: parseFloat(this.getLoadFactor().toFixed(3)),
      collisions: this._collisionCount,
      activeBuckets
    };
  }

  /**
   * Dynamically resizes the bucket array and rehashes all existing entries.
   * Guarantees O(1) average lookup performance as dataset grows.
   * Time Complexity: O(N + OldCapacity)
   */
  private resize(newCapacity: number): void {
    const oldBuckets = this.buckets;
    const oldCapacity = this._capacity;

    this._capacity = newCapacity;
    this.buckets = new Array(this._capacity).fill(null);
    this._size = 0;
    this._collisionCount = 0;

    for (let i = 0; i < oldCapacity; i++) {
      let current = oldBuckets[i];
      while (current !== null) {
        this.set(current.key, current.value);
        current = current.next;
      }
    }
  }

  /**
   * Clones this HashTable instance.
   */
  public clone(): HashTable<V> {
    const newTable = new HashTable<V>(this._capacity);
    for (const [k, v] of this.entries()) {
      newTable.set(k, v);
    }
    return newTable;
  }
}
