export interface StreamingChunk {
  index: number;
  content: string;
  reasoning?: string;
  timestamp: number;
}

export interface StreamingSession {
  userId: string;
  conversationId: string;
  chunks: StreamingChunk[];
  status: 'streaming' | 'completed' | 'error';
  startTime: number;
  lastActivity: number;
  subscribers: Set<(chunk: StreamingChunk) => void>;
  completionSubscribers: Set<() => void>;
}

class StreamingCacheManager {
  private cache: Map<string, StreamingSession> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds (changed from 1 hour)

  constructor() {
    // Start cleanup interval
    this.startCleanup();
  }

  private startCleanup() {
    if (this.cleanupInterval) return;
    
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000); // Cleanup every 5 minutes
  }

  private cleanupExpiredSessions() {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, session] of this.cache.entries()) {
      if (now - session.lastActivity > this.CACHE_TTL) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired streaming sessions`);
    }
  }

  createSession(userId: string, conversationId: string): StreamingSession {
    const session: StreamingSession = {
      userId,
      conversationId,
      chunks: [],
      status: 'streaming',
      startTime: Date.now(),
      lastActivity: Date.now(),
      subscribers: new Set(),
      completionSubscribers: new Set(),
    };

    this.cache.set(conversationId, session);
    return session;
  }

  addChunk(conversationId: string, content: string, reasoning?: string): boolean {
    const session = this.cache.get(conversationId);
    if (!session) return false;

    const chunk: StreamingChunk = {
      index: session.chunks.length,
      content,
      reasoning,
      timestamp: Date.now(),
    };

    session.chunks.push(chunk);
    session.lastActivity = Date.now();
    
    // Notify all subscribers of the new chunk
    session.subscribers.forEach(callback => {
      try {
        callback(chunk);
      } catch (error) {
        console.error("Error notifying subscriber:", error);
      }
    });
    
    return true;
  }

  // Subscribe to new chunks for a conversation
  subscribe(conversationId: string, onChunk: (chunk: StreamingChunk) => void, onComplete?: () => void): () => void {
    const session = this.cache.get(conversationId);
    if (!session) {
      console.log("❌ Cannot subscribe to non-existent session:", conversationId);
      return () => {}; // Return empty unsubscribe function
    }

    session.subscribers.add(onChunk);
    if (onComplete) {
      session.completionSubscribers.add(onComplete);
    }

    console.log("➕ Added subscriber to session:", conversationId, "Total subscribers:", session.subscribers.size);

    // Return unsubscribe function
    return () => {
      session.subscribers.delete(onChunk);
      if (onComplete) {
        session.completionSubscribers.delete(onComplete);
      }
      console.log("➖ Removed subscriber from session:", conversationId, "Remaining subscribers:", session.subscribers.size);
    };
  }

  getSession(conversationId: string): StreamingSession | null {
    const session = this.cache.get(conversationId);
    if (!session) return null;

    // Update last activity
    session.lastActivity = Date.now();
    return session;
  }

  completeSession(conversationId: string): boolean {
    const session = this.cache.get(conversationId);
    if (!session) return false;

    session.status = 'completed';
    session.lastActivity = Date.now();
    
    console.log("✅ Session completed and subscribers notified:", conversationId);
    
    // Notify all completion subscribers
    session.completionSubscribers.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error("Error notifying completion subscriber:", error);
      }
    });
    
    // Clear subscribers after completion but keep the session for reconnection
    session.subscribers.clear();
    session.completionSubscribers.clear();
    
    console.log("💾 Keeping completed session in cache for potential reconnection:", conversationId);
    return true;
  }

  errorSession(conversationId: string): boolean {
    const session = this.cache.get(conversationId);
    if (!session) return false;

    session.status = 'error';
    session.lastActivity = Date.now();
    
    console.log("❌ Session errored and subscribers notified:", conversationId);
    
    // Notify completion subscribers on error too
    session.completionSubscribers.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error("Error notifying completion subscriber:", error);
      }
    });
    
    // Clear subscribers after error but keep the session for reconnection
    session.subscribers.clear();
    session.completionSubscribers.clear();
    
    console.log("💾 Keeping errored session in cache for potential reconnection:", conversationId);
    return true;
  }

  deleteSession(conversationId: string): boolean {
    return this.cache.delete(conversationId);
  }

  getReconnectData(conversationId: string): {
    chunks: StreamingChunk[];
    status: string;
    isComplete: boolean;
  } | null {
    const session = this.cache.get(conversationId);
    if (!session) return null;

    return {
      chunks: session.chunks,
      status: session.status,
      isComplete: session.status === 'completed' || session.status === 'error',
    };
  }

  // Get stats for debugging
  getStats() {
    return {
      activeSessions: this.cache.size,
      sessions: Array.from(this.cache.values()).map(s => ({
        conversationId: s.conversationId,
        userId: s.userId,
        chunkCount: s.chunks.length,
        status: s.status,
        age: Date.now() - s.startTime,
        subscriberCount: s.subscribers.size,
      })),
    };
  }

  // For graceful shutdown
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// Singleton instance
export const streamingCache = new StreamingCacheManager();

// Ensure cleanup on process exit
process.on('SIGINT', () => streamingCache.destroy());
process.on('SIGTERM', () => streamingCache.destroy()); 