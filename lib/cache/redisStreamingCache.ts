import { createClient, RedisClientType } from "redis";

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
  status: "streaming" | "completed" | "error";
  startTime: number;
  lastActivity: number;
  subscribers: Set<(chunk: StreamingChunk) => void>;
  completionSubscribers: Set<() => void>;
}

class RedisStreamingCacheManager {
  private client: RedisClientType | null = null;
  private pubClient: RedisClientType | null = null;
  private subClient: RedisClientType | null = null;
  private localSubscribers: Map<string, Set<(chunk: StreamingChunk) => void>> =
    new Map();
  private localCompletionSubscribers: Map<string, Set<() => void>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CACHE_TTL = 5 * 60; // 5 minutes in seconds for Redis
  private readonly OPERATION_TIMEOUT = 5000; // 5 seconds timeout for Redis operations
  private isConnected = false;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly instanceId = Math.random().toString(36).substr(2, 9);

  constructor() {
    console.log(`🚀 Creating Redis cache instance: ${this.instanceId}`);
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      if (
        !process.env.REDIS_HOST ||
        !process.env.REDIS_PASSWORD
      ) {
        console.log(
          "Redis environment variables not set, Redis cache will not be available"
        );
        return;
      }

      console.log("Initializing Redis connection...");

      // Create Redis clients configuration using access key
      const redisConfig = {
        password: process.env.REDIS_PASSWORD,
        socket: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT || "6380"),
          tls: true as const,
          connectTimeout: 10000,
          commandTimeout: 5000,
        },
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: 3,
      };

      this.client = createClient(redisConfig);
      this.pubClient = createClient(redisConfig);
      this.subClient = createClient(redisConfig);

      // Handle MOVED/ASK redirects for cluster support
      this.client.on("error", (err: Error) => {
        if (err.message.includes("MOVED") || err.message.includes("ASK")) {
          console.log("Redis cluster redirect:", err.message);
        } else {
          console.error("Redis Client Error:", err);
          this.handleConnectionError();
        }
      });

      // Set up error handlers
      this.client.on("error", (err: Error) => {
        if (err.message.includes("WRONGPASS")) {
          console.error("Redis authentication failed - check access key");
        }
        console.error("Redis Client Error:", err);
        this.handleConnectionError();
      });

      this.pubClient.on("error", (err: Error) => {
        console.error("Redis Pub Client Error:", err);
        this.handleConnectionError();
      });

      this.subClient.on("error", (err: Error) => {
        console.error("Redis Sub Client Error:", err);
        this.handleConnectionError();
      });

      // Connect all clients
      await Promise.all([
        this.client.connect(),
        this.pubClient.connect(),
        this.subClient.connect(),
      ]);

      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log(`✅ All Redis clients connected successfully [${this.instanceId}]`);

      // Set up pub/sub listener
      await this.setupPubSubListener();

      // Start cleanup interval
      this.startCleanup();
    } catch (error) {
      console.error("Failed to initialize Redis:", error);
      this.isConnected = false;
      this.scheduleReconnect();
    }
  }

  private handleConnectionError() {
    this.isConnected = false;
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error("Max Redis reconnection attempts reached, giving up");
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(
      `Scheduling Redis reconnection attempt ${this.reconnectAttempts} in ${delay}ms`
    );

    setTimeout(() => {
      this.initializeRedis();
    }, delay);
  }



  private async setupPubSubListener() {
    if (!this.subClient) return;

    console.log("🔊 Setting up Redis pub/sub listeners...");

    // Listen for chunk updates using pattern subscription
    console.log(`🎧 Subscribing to Redis pattern: streaming:chunk:* [${this.instanceId}]`);
    await this.subClient.pSubscribe(
      "streaming:chunk:*",
      (message: string, channel: string) => {
        try {
          const conversationId = channel.split(":")[2];
          const chunk: StreamingChunk = JSON.parse(message);

          console.log(`📨 Received Redis chunk ${chunk.index} from channel: ${channel} [${this.instanceId}]`);

          const subscribers = this.localSubscribers.get(conversationId);
          if (subscribers && subscribers.size > 0) {
            console.log(`📡 Forwarding chunk to ${subscribers.size} local subscribers for: ${conversationId}`);
            subscribers.forEach((callback) => {
              try {
                callback(chunk);
              } catch (error) {
                console.error("Error notifying subscriber:", error);
              }
            });
          } else {
            console.log(`📭 No local subscribers for conversation: ${conversationId} (available: [${Array.from(this.localSubscribers.keys()).join(', ')}])`);
          }
        } catch (error) {
          console.error("Error handling chunk message:", error);
        }
      }
    );
    console.log(`✅ Successfully pattern-subscribed to streaming:chunk:* [${this.instanceId}]`);

    // Listen for completion updates using pattern subscription
    await this.subClient.pSubscribe(
      "streaming:complete:*",
      (message: string, channel: string) => {
        try {
          const conversationId = channel.split(":")[2];

          console.log(`🏁 Received Redis completion from channel: ${channel} [${this.instanceId}]`);

          const completionSubscribers =
            this.localCompletionSubscribers.get(conversationId);
          if (completionSubscribers && completionSubscribers.size > 0) {
            console.log(`📡 Notifying ${completionSubscribers.size} completion subscribers for: ${conversationId}`);
            completionSubscribers.forEach((callback) => {
              try {
                callback();
              } catch (error) {
                console.error("Error notifying completion subscriber:", error);
              }
            });
          }

          // Clean up local subscribers after completion
          this.localSubscribers.delete(conversationId);
          this.localCompletionSubscribers.delete(conversationId);
        } catch (error) {
          console.error("Error handling completion message:", error);
        }
      }
    );

    console.log("✅ Redis pub/sub listeners configured");
  }

  private startCleanup() {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(async () => {
      // Run cleanup in background without blocking
      this.cleanupExpiredSessions().catch((error) => {
        console.error("Error during cleanup:", error);
      });
    }, 5 * 60 * 1000); // Cleanup every 5 minutes
  }

  private async cleanupExpiredSessions() {
    if (!this.client || !this.isConnected) return;

    try {
      const keys = await this.client.keys("session:*");
      const now = Date.now();
      let expiredCount = 0;

      for (const key of keys) {
        const sessionData = await this.client.hGetAll(key);
        if (
          sessionData.lastActivity &&
          now - parseInt(sessionData.lastActivity) > this.CACHE_TTL * 1000
        ) {
          await this.client.del(key);
          await this.client.del(`chunks:${key.split(":")[1]}`);
          expiredCount++;
        }
      }

      if (expiredCount > 0) {
        console.log(
          `Cleaned up ${expiredCount} expired Redis streaming sessions`
        );
      }
    } catch (error) {
      console.error("Error during Redis cleanup:", error);
    }
  }

  // Helper method to execute Redis operations with timeout and error handling
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number = this.OPERATION_TIMEOUT
  ): Promise<T | null> {
    if (!this.isConnected) return null;

    try {
      return await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Operation timeout")), timeoutMs)
        ),
      ]);
    } catch (error) {
      console.error("Redis operation failed:", error);
      return null;
    }
  }

  // Fire-and-forget helper for non-critical operations
  private async fireAndForget(
    operation: () => Promise<void>,
    operationName: string
  ) {
    if (!this.isConnected) return;

    operation().catch((error) => {
      console.error(`Redis ${operationName} failed (non-blocking):`, error);
    });
  }

  async createSession(
    userId: string,
    conversationId: string
  ): Promise<StreamingSession> {
    const session: StreamingSession = {
      userId,
      conversationId,
      chunks: [],
      status: "streaming",
      startTime: Date.now(),
      lastActivity: Date.now(),
      subscribers: new Set(),
      completionSubscribers: new Set(),
    };

    // Synchronous Redis operation to ensure session exists before returning
    try {
      if (this.client && this.isConnected) {
        // Store session metadata in Redis
        await this.client.hSet(`session:${conversationId}`, {
          userId,
          conversationId,
          status: "streaming",
          startTime: session.startTime.toString(),
          lastActivity: session.lastActivity.toString(),
          chunkCount: "0",
        });

        // Set TTL
        await this.client.expire(`session:${conversationId}`, this.CACHE_TTL);
        console.log(
          `✅ Created Redis session for conversation: ${conversationId} [${this.instanceId}]`
        );
      } else {
        console.warn(`⚠️ Redis not connected, session ${conversationId} created in memory only`);
      }
    } catch (error) {
      console.error(`❌ Failed to create Redis session ${conversationId}:`, error);
      // Continue anyway - session will work in memory for local subscribers
    }

    return session;
  }

  async addChunk(
    conversationId: string,
    content: string,
    reasoning?: string
  ): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;

    try {
      // Get current chunk count first (synchronously to get correct index)
      const chunkCountStr = await this.client.hGet(
        `session:${conversationId}`,
        "chunkCount"
      );
      const chunkCount = parseInt(chunkCountStr || "0");

      const chunk: StreamingChunk = {
        index: chunkCount,
        content,
        reasoning,
        timestamp: Date.now(),
      };

      // Store chunk and update metadata (fire-and-forget for storage)
      this.fireAndForget(async () => {
        if (!this.client) return;

        // Retry logic for MOVED errors
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            // Store chunk in Redis list
            await this.client.rPush(
              `chunks:${conversationId}`,
              JSON.stringify(chunk)
            );

            // Update session metadata
            await this.client.hSet(`session:${conversationId}`, {
              lastActivity: chunk.timestamp.toString(),
              chunkCount: (chunkCount + 1).toString(),
            });

            // Refresh TTL
            await this.client.expire(`session:${conversationId}`, this.CACHE_TTL);
            await this.client.expire(`chunks:${conversationId}`, this.CACHE_TTL);

            return;
          } catch (error: unknown) {
            const err = error as Error;
            if (err.message && err.message.includes("MOVED") && attempt < 2) {
              console.log(
                `Redis MOVED error, retrying attempt ${attempt + 1}/3:`,
                err.message
              );
              await new Promise((resolve) =>
                setTimeout(resolve, 50 * (attempt + 1))
              ); // Exponential backoff
              continue;
            }
            throw error;
          }
        }
      }, "addChunk-storage");

      // Publish to subscribers immediately (more reliable)
      if (this.pubClient && this.isConnected) {
        try {
          const channel = `streaming:chunk:${conversationId}`;
          await this.pubClient.publish(channel, JSON.stringify(chunk));
        } catch (error) {
          console.error(`❌ Failed to publish chunk for ${conversationId}:`, error);
          // Continue anyway - storage is still happening
        }
      } else {
        console.warn(`⚠️ Cannot publish chunk - pubClient not ready: connected=${this.isConnected} [${this.instanceId}]`);
      }

      return true;
    } catch (error) {
      console.error(`❌ Failed to process chunk for ${conversationId}:`, error);
      return false;
    }
  }

  subscribe(
    conversationId: string,
    onChunk: (chunk: StreamingChunk) => void,
    onComplete?: () => void
  ): () => void {
    console.log(`🔗 Redis subscribe called for conversation: ${conversationId} [${this.instanceId}]`);
    
    // Store local subscribers
    if (!this.localSubscribers.has(conversationId)) {
      this.localSubscribers.set(conversationId, new Set());
      console.log(`📝 Created new subscriber set for conversation: ${conversationId} [${this.instanceId}]`);
    }
    if (!this.localCompletionSubscribers.has(conversationId)) {
      this.localCompletionSubscribers.set(conversationId, new Set());
    }

    this.localSubscribers.get(conversationId)!.add(onChunk);
    if (onComplete) {
      this.localCompletionSubscribers.get(conversationId)!.add(onComplete);
    }

    const subscriberCount = this.localSubscribers.get(conversationId)!.size;
    console.log(`➕ Added Redis subscriber to session: ${conversationId} [${this.instanceId}] (total: ${subscriberCount})`);

    // Debug: List all current subscribers
    console.log(`🗂️ Current local subscribers: [${Array.from(this.localSubscribers.keys()).join(', ')}] [${this.instanceId}]`);

    // Return unsubscribe function
    return () => {
      this.localSubscribers.get(conversationId)?.delete(onChunk);
      if (onComplete) {
        this.localCompletionSubscribers.get(conversationId)?.delete(onComplete);
      }
      const remainingCount = this.localSubscribers.get(conversationId)?.size || 0;
      console.log(
        `➖ Removed Redis subscriber from session: ${conversationId} [${this.instanceId}] (remaining: ${remainingCount})`
      );
    };
  }

  async getSession(conversationId: string): Promise<StreamingSession | null> {
    return await this.executeWithTimeout(async () => {
      if (!this.client) return null;

      const sessionData = await this.client.hGetAll(
        `session:${conversationId}`
      );
      if (!sessionData.userId) return null;

      // Get chunks
      const chunkStrings = await this.client.lRange(
        `chunks:${conversationId}`,
        0,
        -1
      );
      const chunks: StreamingChunk[] = chunkStrings.map((str: string) =>
        JSON.parse(str)
      );

      // Update last activity (fire-and-forget)
      this.fireAndForget(async () => {
        if (!this.client) return;
        await this.client.hSet(`session:${conversationId}`, {
          lastActivity: Date.now().toString(),
        });
      }, "updateLastActivity");

      return {
        userId: sessionData.userId,
        conversationId: sessionData.conversationId,
        chunks,
        status: sessionData.status as "streaming" | "completed" | "error",
        startTime: parseInt(sessionData.startTime),
        lastActivity: Date.now(),
        subscribers: new Set(),
        completionSubscribers: new Set(),
      };
    });
  }

  async completeSession(conversationId: string): Promise<boolean> {
    // Fire-and-forget operation
    this.fireAndForget(async () => {
      if (!this.client) return;

      await this.client.hSet(`session:${conversationId}`, {
        status: "completed",
        lastActivity: Date.now().toString(),
      });

      // Publish completion
      if (this.pubClient) {
        await this.pubClient.publish(
          `streaming:complete:${conversationId}`,
          "completed"
        );
      }

      console.log(`✅ Completed Redis session: ${conversationId}`);
    }, "completeSession");

    return true;
  }

  async errorSession(conversationId: string): Promise<boolean> {
    // Fire-and-forget operation
    this.fireAndForget(async () => {
      if (!this.client) return;

      await this.client.hSet(`session:${conversationId}`, {
        status: "error",
        lastActivity: Date.now().toString(),
      });

      // Publish completion (error also triggers completion)
      if (this.pubClient) {
        await this.pubClient.publish(
          `streaming:complete:${conversationId}`,
          "error"
        );
      }

      console.log(`❌ Errored Redis session: ${conversationId}`);
    }, "errorSession");

    return true;
  }

  async deleteSession(conversationId: string): Promise<boolean> {
    // Fire-and-forget operation
    this.fireAndForget(async () => {
      if (!this.client) return;
      await this.client.del(`session:${conversationId}`);
      await this.client.del(`chunks:${conversationId}`);
    }, "deleteSession");

    return true;
  }

  async getReconnectData(conversationId: string): Promise<{
    chunks: StreamingChunk[];
    status: string;
    isComplete: boolean;
  } | null> {
    const session = await this.getSession(conversationId);
    if (!session) return null;

    return {
      chunks: session.chunks,
      status: session.status,
      isComplete: session.status === "completed" || session.status === "error",
    };
  }

  async getStats() {
    return (
      (await this.executeWithTimeout(async () => {
        if (!this.client) {
          return { activeSessions: 0, sessions: [] };
        }

        const keys = await this.client.keys("session:*");
        const sessions = [];

        for (const key of keys) {
          const sessionData = await this.client.hGetAll(key);
          if (sessionData.userId) {
            sessions.push({
              conversationId: sessionData.conversationId,
              userId: sessionData.userId,
              chunkCount: parseInt(sessionData.chunkCount || "0"),
              status: sessionData.status,
              age: Date.now() - parseInt(sessionData.startTime),
              subscriberCount:
                this.localSubscribers.get(sessionData.conversationId)?.size ||
                0,
            });
          }
        }

        return {
          activeSessions: sessions.length,
          sessions,
        };
      })) || { activeSessions: 0, sessions: [] }
    );
  }

  async destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    try {
      await Promise.all([
        this.client?.quit(),
        this.pubClient?.quit(),
        this.subClient?.quit(),
      ]);
      console.log("✅ Redis connections closed");
    } catch (error) {
      console.error("Error closing Redis connections:", error);
    }

    this.localSubscribers.clear();
    this.localCompletionSubscribers.clear();
    this.isConnected = false;
  }
}

export { RedisStreamingCacheManager };
