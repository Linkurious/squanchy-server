'use strict';

const Store = require('express-session').Store;

// lk libs
const CappedQueue = require('./lib/CappedQueue');

const DEFAULT_MAX_LENGTH_QUEUE_2_STAGE_AUTH = 100;

class SessionStore extends Store {
  /**
   * A session store in memory.
   *
   * - The store allows only 1 session per user.
   * - The session is never set if it doesn't contain the user or the `TwoStageAuth` flag
   *   - `TwoStageAuth`-only sessions are put in a queue with a maxLength of 100.
   *     If the queue reaches the maxLength, the session is destroyed.
   *
   * @public
   */
  constructor() {
    super();

    this.userIdToSessionId = new Map();
    this.sessions = new Map();
    this.twoStageSessionQueue = new CappedQueue(DEFAULT_MAX_LENGTH_QUEUE_2_STAGE_AUTH);
  }

  /**
   * Get all active sessions.
   *
   * @param {function} callback
   * @public
   */
  all(callback) {
    callback && callback(null, Array.from(this.sessions.values()));
  }

  /**
   * Clear all sessions.
   *
   * @param {function} callback
   * @public
   */
  clear(callback) {
    this.userIdToSessionId.clear();
    this.sessions.clear();
    this.twoStageSessionQueue.clear();
    callback && callback();
  }

  /**
   * Destroy the session associated with the given session ID.
   *
   * @param {string} sessionId
   * @param {function} callback
   * @public
   */
  destroy(sessionId, callback) {
    if (this.sessions.has(sessionId)) {
      this.userIdToSessionId.delete(this.sessions.get(sessionId).user.id);
    }
    this.sessions.delete(sessionId);
    this.twoStageSessionQueue.delete(sessionId);
    callback && callback();
  }

  /**
   * Get number of active sessions.
   *
   * @param {function} callback
   * @public
   */
  length(callback) {
    callback && callback(null, this.sessions.size);
  }

  /**
   * Fetch session by the given session ID.
   *
   * @param {string} sessionId
   * @param {function} callback
   * @public
   */
  get(sessionId, callback) {
    callback && callback(null, this.sessions.get(sessionId));
  }

  /**
   * Commit the given session associated with the given sessionId to the store.
   *
   * @param {string} sessionId
   * @param {object} session
   * @param {function} callback
   * @public
   */
  set(sessionId, session, callback) {
    let userId = session.user ? session.user.id : undefined;
    let twoStageAuth = !!session[SessionStore.TWO_STAGE_AUTH_FLAG];

    // if a user is not specified and the twoStageAuth is not set
    if ((userId === null || userId === undefined) && !twoStageAuth) {
      // don't do anything
      callback && callback();
      return;
    }

    // are we in the 1st stage of a two-stage auth? (user wasn't yet retrieved)
    if ((userId === null || userId === undefined) && twoStageAuth) {
      // the queue returns the last element so it can be deleted (if defined)
      this.sessions.delete(this.twoStageSessionQueue.add(sessionId));
      this.sessions.set(sessionId, session);

      callback && callback();
      return;
    }

    // we have a user, let's check if this user was already logged in
    let previousSessionId = this.userIdToSessionId.get(userId);
    if (previousSessionId) {
      // it was, so we delete its previous session
      this.sessions.delete(previousSessionId);
      this.userIdToSessionId.delete(userId);
    }

    // are we in the 2nd stage of a two-stage auth?
    if (userId !== null && userId !== undefined && twoStageAuth) {
      // this session doesn't count anymore within the limit of 100 two-stage auth sessions
      this.twoStageSessionQueue.delete(sessionId);
    }

    this.sessions.set(sessionId, session);
    this.userIdToSessionId.set(userId, sessionId);

    callback && callback();
  }

  /**
   * Touch the given session object associated with the given session ID.
   *
   * @param {string} sessionId
   * @param {object} session
   * @param {function} callback
   * @public
   */
  touch(sessionId, session, callback) {
    // nothing to do, we use session cookies that expires when the agent is closed
    // otherwise here we would update `cookie.expires`

    callback && callback();
  }
}

SessionStore.TWO_STAGE_AUTH_FLAG = 'id';

module.exports = SessionStore;
