// Session management for WebSocket connections
import { randomUUID } from 'crypto';
import { BaseMessage } from '@innerflame/shared-types';

export interface Session {
  sessionId: string;
  userId: string;
  messageHistory: BaseMessage[];
  lastActivity: Date;
  isActive: boolean;
  connectionCount: number; // Track number of active connections for this session
}

/**
 * Interface for session storage implementations
 */
export interface SessionStorage {
  saveSession(session: Session): Promise<void>;
  getSession(sessionId: string): Promise<Session | undefined>;
  getUserSessions(userId: string): Promise<Session[]>;
  hasSession(sessionId: string): Promise<boolean>;
  deleteSession(sessionId: string): Promise<boolean>;
  updateSession(session: Session): Promise<boolean>;
}

/**
 * In-memory implementation of SessionStorage
 */
export class InMemorySessionStorage implements SessionStorage {
  private sessions: Map<string, Session> = new Map();
  // Map userId to sessionId for quick lookup
  private userSessions: Map<string, string[]> = new Map();
  
  async saveSession(session: Session): Promise<void> {
    this.sessions.set(session.sessionId, session);
    
    // Map to user
    if (!this.userSessions.has(session.userId)) {
      this.userSessions.set(session.userId, []);
    }
    this.userSessions.get(session.userId)?.push(session.sessionId);
  }
  
  async getSession(sessionId: string): Promise<Session | undefined> {
    return this.sessions.get(sessionId);
  }
  
  async getUserSessions(userId: string): Promise<Session[]> {
    const sessionIds = this.userSessions.get(userId) || [];
    return sessionIds
      .map(id => this.sessions.get(id))
      .filter((session): session is Session => session !== undefined);
  }
  
  async hasSession(sessionId: string): Promise<boolean> {
    return this.sessions.has(sessionId);
  }
  
  async deleteSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    
    // Remove from sessions map
    this.sessions.delete(sessionId);
    
    // Remove from user sessions map
    const userSessionIds = this.userSessions.get(session.userId);
    if (userSessionIds) {
      const index = userSessionIds.indexOf(sessionId);
      if (index !== -1) {
        userSessionIds.splice(index, 1);
      }
      if (userSessionIds.length === 0) {
        this.userSessions.delete(session.userId);
      }
    }
    
    return true;
  }
  
  async updateSession(session: Session): Promise<boolean> {
    if (!this.sessions.has(session.sessionId)) {
      return false;
    }
    
    this.sessions.set(session.sessionId, session);
    return true;
  }
}

/**
 * Placeholder for future Firestore implementation of SessionStorage
 * 
 * TODO: Implement FirestoreSessionStorage class when Firestore integration is needed
 * This will follow the same interface as SessionStorage but use Firestore as the backend
 */
/*
export class FirestoreSessionStorage implements SessionStorage {
  // Firestore implementation will go here
  // Will need to:
  // 1. Initialize Firestore connection
  // 2. Map the Session interface to Firestore documents
  // 3. Implement all required methods using Firestore operations
}
*/

export class SessionManager {
  private storage: SessionStorage;
  
  constructor(storage?: SessionStorage) {
    // Default to in-memory storage if none provided
    this.storage = storage || new InMemorySessionStorage();
  }
  
  /**
   * Create a new session
   * @param userId The user ID for the session
   * @returns New session object
   */
  public async createSession(userId: string): Promise<Session> {
    const sessionId = randomUUID();
    const session: Session = {
      sessionId,
      userId,
      messageHistory: [],
      lastActivity: new Date(),
      isActive: true,
      connectionCount: 1
    };
    
    // Store the session
    await this.storage.saveSession(session);
    
    return session;
  }
  
  /**
   * Get a session by ID
   * @param sessionId The session ID
   * @returns The session or undefined if not found
   */
  public async getSession(sessionId: string): Promise<Session | undefined> {
    return await this.storage.getSession(sessionId);
  }
  
  /**
   * Get all sessions for a user
   * @param userId The user ID
   * @returns Array of sessions for the user
   */
  public async getUserSessions(userId: string): Promise<Session[]> {
    return await this.storage.getUserSessions(userId);
  }
  
  /**
   * Check if a session exists
   * @param sessionId The session ID to check
   * @returns True if the session exists
   */
  public async hasSession(sessionId: string): Promise<boolean> {
    return await this.storage.hasSession(sessionId);
  }
  
  /**
   * Add a message to a session's history
   * @param sessionId The session ID
   * @param message The message to add
   * @returns True if successful, false if session not found
   */
  public async addMessage(sessionId: string, message: BaseMessage): Promise<boolean> {
    const session = await this.storage.getSession(sessionId);
    if (!session) {
      return false;
    }
    
    session.messageHistory.push(message);
    session.lastActivity = new Date();
    return await this.storage.updateSession(session);
  }
  
  /**
   * Mark a session as inactive
   * @param sessionId The session ID
   * @returns True if successful, false if session not found
   */
  public async deactivateSession(sessionId: string): Promise<boolean> {
    const session = await this.storage.getSession(sessionId);
    if (!session) {
      return false;
    }
    
    session.connectionCount--;
    
    // Only mark as inactive if no more connections
    if (session.connectionCount <= 0) {
      session.isActive = false;
      session.connectionCount = 0;
    }
    
    return await this.storage.updateSession(session);
  }
  
  /**
   * Reactivate an existing session
   * @param sessionId The session ID
   * @returns True if successful, false if session not found
   */
  public async reactivateSession(sessionId: string): Promise<boolean> {
    const session = await this.storage.getSession(sessionId);
    if (!session) {
      return false;
    }
    
    session.isActive = true;
    session.connectionCount++;
    session.lastActivity = new Date();
    return await this.storage.updateSession(session);
  }
  
  /**
   * Remove old inactive sessions (cleanup)
   * @param maxAgeMs Maximum age of inactive sessions in milliseconds
   * @returns Number of sessions removed
   */
  public async cleanupOldSessions(maxAgeMs: number): Promise<number> {
    // Note: This implementation works efficiently for in-memory storage
    // For Firestore, we would need to query for inactive sessions
    // This method will need to be updated when Firestore is implemented
    
    const allSessions = await this.storage.getUserSessions(''); // This needs to be implemented differently for Firestore
    const now = new Date();
    let removedCount = 0;
    
    for (const session of allSessions) {
      if (!session.isActive) {
        const age = now.getTime() - session.lastActivity.getTime();
        if (age > maxAgeMs) {
          const success = await this.storage.deleteSession(session.sessionId);
          if (success) {
            removedCount++;
          }
        }
      }
    }
    
    return removedCount;
  }
}
