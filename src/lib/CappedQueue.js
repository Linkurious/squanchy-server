'use strict';

/**
 * A queue with a given `maxLength`
 */
class CappedQueue {
  constructor(maxLength) {
    this._maxLength = maxLength;
    this._set = new Set(); // The queue is implemented with a set (it guarantees insertion order)
  }

  /**
   * Add a new value in the queue.
   * If the max size is reached, remove the last element from the queue and return it.
   * Otherwise, return `undefined`.
   *
   * @param {*} value
   * @returns {* | undefined}
   */
  add(value) {
    // 1) we put the value always in front
    this._set.delete(value);
    this._set.add(value);

    // 2) we remove away the last element if `maxLength` is reached
    if (this._set.size > this._maxLength) {
      let removedValue = this._set.values().next().value;
      this._set.delete(removedValue);

      return removedValue;
    }
  }

  /**
   * Move a value from anywhere in the queue to the last position.
   *
   * @param {*} value
   * @return {boolean}
   */
  update(value) {
    if (this._set.has(value)) {
      this._set.delete(value);
      this._set.add(value);
      return true;
    }
    return false;
  }

  delete(value) {
    this._set.delete(value);
  }

  clear() {
    this._set.clear();
  }
}

module.exports = CappedQueue;
