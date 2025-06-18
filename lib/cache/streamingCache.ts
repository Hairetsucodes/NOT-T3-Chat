import { RedisStreamingCacheManager } from "./redisStreamingCache";

export interface StreamingChunk {
  index: number;
  content: string;
  reasoning?: string;
  timestamp: number;
}

// New optimized batch interface
export interface ChunkBatch {
  startIndex: number;
  endIndex: number;
  chunks: StreamingChunk[];
  compressed?: boolean;
  size: number; // Total content size
}

export interface StreamingSession {
  userId: string;
  conversationId: string;
  chunks: StreamingChunk[];
  batches: ChunkBatch[]; // New: Store chunks in batches for faster access
  status: "streaming" | "completed" | "error";
  startTime: number;
  lastActivity: number;
  chunkCount: number; // Optimized: Track count separately
  totalSize: number; // New: Track total content size
  subscribers: Set<(chunk: StreamingChunk) => void>;
  batchSubscribers: Set<(batch: ChunkBatch) => void>; // New: Batch subscribers
  completionSubscribers: Set<() => void>;
}

export interface CacheStats {
  activeSessions: number;
  totalChunks: number; // New: Total chunks across all sessions
  totalSize: number; // New: Total size in bytes
  sessions: Array<{
    conversationId: string;
    userId: string;
    chunkCount: number;
    totalSize: number; // New: Size per session
    status: string;
    age: number;
    subscriberCount: number;
    batchCount: number; // New: Number of batches
  }>;
}

// Compression utilities
class ChunkCompressor {
  static compress(chunks: StreamingChunk[]): string {
    try {
      // Simple compression: combine content and compress JSON
      const combined = chunks.map((c) => ({
        i: c.index,
        c: c.content,
        r: c.reasoning,
        t: c.timestamp,
      }));
      return JSON.stringify(combined);
    } catch {
      return JSON.stringify(chunks);
    }
  }

  static decompress(compressed: string): StreamingChunk[] {
    try {
      const data = JSON.parse(compressed);
      return data.map((c: { i: number; c: string; r?: string; t: number }) => ({
        index: c.i,
        content: c.c,
        reasoning: c.r,
        timestamp: c.t,
      }));
    } catch {
      return [];
    }
  }
}

// Define a common interface for both cache implementations
interface StreamingCacheInterface {
  createSession(
    userId: string,
    conversationId: string
  ): StreamingSession | Promise<StreamingSession>;
  addChunk(
    conversationId: string,
    content: string,
    reasoning?: string
  ): boolean | Promise<boolean>;
  addChunkBatch(
    conversationId: string,
    chunks: Array<{ content: string; reasoning?: string }>
  ): boolean | Promise<boolean>; // New
  subscribe(
    conversationId: string,
    onChunk: (chunk: StreamingChunk) => void,
    onComplete?: () => void
  ): () => void;
  subscribeToBatches(
    conversationId: string,
    onBatch: (batch: ChunkBatch) => void,
    onComplete?: () => void
  ): () => void; // New
  getSession(
    conversationId: string
  ): StreamingSession | null | Promise<StreamingSession | null>;
  getChunkRange(
    conversationId: string,
    startIndex: number,
    endIndex: number
  ): StreamingChunk[] | Promise<StreamingChunk[]>; // New
  completeSession(conversationId: string): boolean | Promise<boolean>;
  errorSession(conversationId: string): boolean | Promise<boolean>;
  deleteSession(conversationId: string): boolean | Promise<boolean>;
  getReconnectData(conversationId: string):
    | {
        chunks: StreamingChunk[];
        status: string;
        isComplete: boolean;
        batches?: ChunkBatch[]; // New: Return batches for faster streaming
      }
    | null
    | Promise<{
        chunks: StreamingChunk[];
        status: string;
        isComplete: boolean;
        batches?: ChunkBatch[];
      } | null>;
  getStats(): Promise<CacheStats> | CacheStats;
  destroy(): void | Promise<void>;
}

class OptimizedInMemoryStreamingCacheManager
  implements StreamingCacheInterface
{
  private cache: Map<string, StreamingSession> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000;
  private readonly BATCH_SIZE = 10; // Process chunks in batches of 10
  private readonly COMPRESSION_THRESHOLD = 1000; // Compress batches with >1KB content

  constructor() {
    this.startCleanup();
  }

  private startCleanup() {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000);
  }

  private cleanupExpiredSessions() {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, session] of this.cache.entries()) {
      if (now - session.lastActivity > this.CACHE_TTL) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => this.cache.delete(key));

    if (expiredKeys.length > 0) {
    }
  }

  private createBatch(chunks: StreamingChunk[]): ChunkBatch {
    const totalSize = chunks.reduce(
      (sum, chunk) =>
        sum + chunk.content.length + (chunk.reasoning?.length || 0),
      0
    );
    const shouldCompress = totalSize > this.COMPRESSION_THRESHOLD;

    return {
      startIndex: chunks[0]?.index || 0,
      endIndex: chunks[chunks.length - 1]?.index || 0,
      chunks: shouldCompress ? [] : chunks, // Store empty if compressed
      compressed: shouldCompress,
      size: totalSize,
    };
  }

  createSession(userId: string, conversationId: string): StreamingSession {
    const session: StreamingSession = {
      userId,
      conversationId,
      chunks: [],
      batches: [],
      status: "streaming",
      startTime: Date.now(),
      lastActivity: Date.now(),
      chunkCount: 0,
      totalSize: 0,
      subscribers: new Set(),
      batchSubscribers: new Set(),
      completionSubscribers: new Set(),
    };

    this.cache.set(conversationId, session);
    return session;
  }

  addChunk(
    conversationId: string,
    content: string,
    reasoning?: string
  ): boolean {
    const session = this.cache.get(conversationId);
    if (!session) return false;

    const chunk: StreamingChunk = {
      index: session.chunkCount,
      content,
      reasoning,
      timestamp: Date.now(),
    };

    session.chunks.push(chunk);
    session.chunkCount++;
    session.totalSize += content.length + (reasoning?.length || 0);
    session.lastActivity = Date.now();

    // Create batches when we reach batch size
    if (session.chunks.length >= this.BATCH_SIZE) {
      const batch = this.createBatch([...session.chunks]);
      session.batches.push(batch);
      session.chunks = []; // Clear processed chunks

      // Notify batch subscribers
      session.batchSubscribers.forEach((callback) => {
        try {
          callback(batch);
        } catch (error) {
          console.error("Error notifying batch subscriber:", error);
        }
      });
    }

    // Notify individual chunk subscribers
    session.subscribers.forEach((callback) => {
      try {
        callback(chunk);
      } catch (error) {
        console.error("Error notifying subscriber:", error);
      }
    });

    return true;
  }

  // New: Add multiple chunks at once for better performance
  addChunkBatch(
    conversationId: string,
    chunks: Array<{ content: string; reasoning?: string }>
  ): boolean {
    const session = this.cache.get(conversationId);
    if (!session) return false;

    const streamingChunks: StreamingChunk[] = chunks.map((chunk, i) => ({
      index: session.chunkCount + i,
      content: chunk.content,
      reasoning: chunk.reasoning,
      timestamp: Date.now(),
    }));

    session.chunks.push(...streamingChunks);
    session.chunkCount += chunks.length;
    session.totalSize += chunks.reduce(
      (sum, c) => sum + c.content.length + (c.reasoning?.length || 0),
      0
    );
    session.lastActivity = Date.now();

    // Create batch immediately
    const batch = this.createBatch(streamingChunks);
    session.batches.push(batch);

    // Notify subscribers
    session.batchSubscribers.forEach((callback) => {
      try {
        callback(batch);
      } catch (error) {
        console.error("Error notifying batch subscriber:", error);
      }
    });

    // Notify individual subscribers for each chunk
    streamingChunks.forEach((chunk) => {
      session.subscribers.forEach((callback) => {
        try {
          callback(chunk);
        } catch (error) {
          console.error("Error notifying subscriber:", error);
        }
      });
    });

    return true;
  }

  subscribe(
    conversationId: string,
    onChunk: (chunk: StreamingChunk) => void,
    onComplete?: () => void
  ): () => void {
    const session = this.cache.get(conversationId);
    if (!session) {
      return () => {};
    }

    session.subscribers.add(onChunk);
    if (onComplete) {
      session.completionSubscribers.add(onComplete);
    }

    return () => {
      session.subscribers.delete(onChunk);
      if (onComplete) {
        session.completionSubscribers.delete(onComplete);
      }
    };
  }

  // New: Subscribe to batches for faster processing
  subscribeToBatches(
    conversationId: string,
    onBatch: (batch: ChunkBatch) => void,
    onComplete?: () => void
  ): () => void {
    const session = this.cache.get(conversationId);
    if (!session) {
      return () => {};
    }

    session.batchSubscribers.add(onBatch);
    if (onComplete) {
      session.completionSubscribers.add(onComplete);
    }

    return () => {
      session.batchSubscribers.delete(onBatch);
      if (onComplete) {
        session.completionSubscribers.delete(onComplete);
      }
    };
  }

  getSession(conversationId: string): StreamingSession | null {
    const session = this.cache.get(conversationId);
    if (!session) return null;

    session.lastActivity = Date.now();
    return session;
  }

  // New: Get specific range of chunks for efficient partial loading
  getChunkRange(
    conversationId: string,
    startIndex: number,
    endIndex: number
  ): StreamingChunk[] {
    const session = this.cache.get(conversationId);
    if (!session) return [];

    // Efficiently get chunks from batches
    const chunks: StreamingChunk[] = [];

    for (const batch of session.batches) {
      if (batch.endIndex < startIndex) continue;
      if (batch.startIndex > endIndex) break;

      const batchChunks = batch.compressed
        ? ChunkCompressor.decompress(JSON.stringify(batch.chunks))
        : batch.chunks;

      chunks.push(
        ...batchChunks.filter(
          (c) => c.index >= startIndex && c.index <= endIndex
        )
      );
    }

    // Include unbatched chunks
    chunks.push(
      ...session.chunks.filter(
        (c) => c.index >= startIndex && c.index <= endIndex
      )
    );

    return chunks.sort((a, b) => a.index - b.index);
  }

  completeSession(conversationId: string): boolean {
    const session = this.cache.get(conversationId);
    if (!session) return false;

    // Process remaining chunks into final batch
    if (session.chunks.length > 0) {
      const finalBatch = this.createBatch([...session.chunks]);
      session.batches.push(finalBatch);
      session.chunks = [];
    }

    session.status = "completed";
    session.lastActivity = Date.now();

    // Notify all completion subscribers
    session.completionSubscribers.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error("Error notifying completion subscriber:", error);
      }
    });

    // Clear subscribers but keep batches for reconnection
    session.subscribers.clear();
    session.batchSubscribers.clear();
    session.completionSubscribers.clear();

    return true;
  }

  errorSession(conversationId: string): boolean {
    const session = this.cache.get(conversationId);
    if (!session) return false;

    session.status = "error";
    session.lastActivity = Date.now();

    session.completionSubscribers.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error("Error notifying completion subscriber:", error);
      }
    });

    session.subscribers.clear();
    session.batchSubscribers.clear();
    session.completionSubscribers.clear();

    return true;
  }

  deleteSession(conversationId: string): boolean {
    return this.cache.delete(conversationId);
  }

  getReconnectData(conversationId: string): {
    chunks: StreamingChunk[];
    status: string;
    isComplete: boolean;
    batches?: ChunkBatch[];
  } | null {
    const session = this.cache.get(conversationId);
    if (!session) return null;

    // Reconstruct all chunks from batches + current chunks
    const allChunks: StreamingChunk[] = [];

    // Add chunks from batches
    for (const batch of session.batches) {
      const batchChunks = batch.compressed
        ? ChunkCompressor.decompress(JSON.stringify(batch.chunks))
        : batch.chunks;
      allChunks.push(...batchChunks);
    }

    // Add unbatched chunks
    allChunks.push(...session.chunks);

    allChunks.sort((a, b) => a.index - b.index);

    return {
      chunks: allChunks,
      batches: session.batches, // Include batches for faster streaming
      status: session.status,
      isComplete: session.status === "completed" || session.status === "error",
    };
  }

  getStats(): CacheStats {
    let totalChunks = 0;
    let totalSize = 0;

    const sessions = Array.from(this.cache.values()).map((s) => {
      totalChunks += s.chunkCount;
      totalSize += s.totalSize;

      return {
        conversationId: s.conversationId,
        userId: s.userId,
        chunkCount: s.chunkCount,
        totalSize: s.totalSize,
        status: s.status,
        age: Date.now() - s.startTime,
        subscriberCount: s.subscribers.size,
        batchCount: s.batches.length,
      };
    });

    return {
      activeSessions: this.cache.size,
      totalChunks,
      totalSize,
      sessions,
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// Global cache instances to prevent multiple Redis connections
declare global {
  var __redisStreamingCache: RedisStreamingCacheManager | undefined;
  var __inMemoryStreamingCache:
    | OptimizedInMemoryStreamingCacheManager
    | undefined;
}

// Factory function to create the appropriate cache instance
function createStreamingCache(): StreamingCacheInterface {
  // For now, always use optimized in-memory cache until Redis is updated
  if (!global.__inMemoryStreamingCache) {
    global.__inMemoryStreamingCache =
      new OptimizedInMemoryStreamingCacheManager();
  }
  return global.__inMemoryStreamingCache;
}

// Create cache adapter that handles both sync and async methods
class StreamingCacheAdapter {
  private cache: StreamingCacheInterface;
  private isRedis: boolean;

  constructor() {
    this.cache = createStreamingCache();
    this.isRedis = !!process.env.REDIS_HOST && !!process.env.REDIS_PASSWORD;
  }

  async createSession(
    userId: string,
    conversationId: string
  ): Promise<StreamingSession> {
    const result = this.cache.createSession(userId, conversationId);
    return result instanceof Promise ? await result : result;
  }

  async addChunk(
    conversationId: string,
    content: string,
    reasoning?: string
  ): Promise<boolean> {
    const result = this.cache.addChunk(conversationId, content, reasoning);
    return result instanceof Promise ? await result : result;
  }

  async addChunkBatch(
    conversationId: string,
    chunks: Array<{ content: string; reasoning?: string }>
  ): Promise<boolean> {
    const result = this.cache.addChunkBatch(conversationId, chunks);
    return result instanceof Promise ? await result : result;
  }

  subscribe(
    conversationId: string,
    onChunk: (chunk: StreamingChunk) => void,
    onComplete?: () => void
  ): () => void {
    return this.cache.subscribe(conversationId, onChunk, onComplete);
  }

  subscribeToBatches(
    conversationId: string,
    onBatch: (batch: ChunkBatch) => void,
    onComplete?: () => void
  ): () => void {
    return this.cache.subscribeToBatches(conversationId, onBatch, onComplete);
  }

  async getSession(conversationId: string): Promise<StreamingSession | null> {
    const result = this.cache.getSession(conversationId);
    return result instanceof Promise ? await result : result;
  }

  async getChunkRange(
    conversationId: string,
    startIndex: number,
    endIndex: number
  ): Promise<StreamingChunk[]> {
    const result = this.cache.getChunkRange(
      conversationId,
      startIndex,
      endIndex
    );
    return result instanceof Promise ? await result : result;
  }

  async completeSession(conversationId: string): Promise<boolean> {
    const result = this.cache.completeSession(conversationId);
    return result instanceof Promise ? await result : result;
  }

  async errorSession(conversationId: string): Promise<boolean> {
    const result = this.cache.errorSession(conversationId);
    return result instanceof Promise ? await result : result;
  }

  async deleteSession(conversationId: string): Promise<boolean> {
    const result = this.cache.deleteSession(conversationId);
    return result instanceof Promise ? await result : result;
  }

  async getReconnectData(conversationId: string): Promise<{
    chunks: StreamingChunk[];
    status: string;
    isComplete: boolean;
    batches?: ChunkBatch[];
  } | null> {
    const result = this.cache.getReconnectData(conversationId);
    return result instanceof Promise ? await result : result;
  }

  async getStats() {
    const result = this.cache.getStats();
    return result instanceof Promise ? await result : result;
  }

  async destroy() {
    const result = this.cache.destroy();
    if (result instanceof Promise) {
      await result;
    }
  }
}

// Global singleton that persists across Next.js hot reloads
declare global {
  // eslint-disable-next-line no-var
  var __streamingCache: StreamingCacheAdapter | undefined;
}

// Create or reuse existing singleton
if (!global.__streamingCache) {
  global.__streamingCache = new StreamingCacheAdapter();

  // Ensure cleanup on process exit
  process.on("SIGINT", () => global.__streamingCache?.destroy());
  process.on("SIGTERM", () => global.__streamingCache?.destroy());
}

export const streamingCache = global.__streamingCache;
