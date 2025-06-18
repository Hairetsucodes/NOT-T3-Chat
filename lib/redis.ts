import { createClient } from "redis";

let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (!redisClient) {
    try {
      if (!process.env.REDIS_HOST || !process.env.REDIS_PASSWORD) {
        throw new Error("Redis environment variables not configured");
      }

      // Create redis client with access key
      redisClient = createClient({
        password: process.env.REDIS_PASSWORD,
        socket: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT || "6380"),
          tls: true,
        },
        pingInterval: 100000,
      });

      redisClient.on("error", (err) => {
        console.error("Redis Client Error", err);
      });

      redisClient.on("connect", () => {
        console.log("Connected to Azure Redis");
      });

      redisClient.on("disconnect", () => {
        console.log("Disconnected from Azure Redis");
      });

      await redisClient.connect();
      console.log("Redis client connected successfully");
    } catch (error) {
      console.error("Failed to create Redis client:", error);
      throw error;
    }
  }

  return redisClient;
}

export async function disconnectRedis() {
  if (redisClient) {
    await redisClient.disconnect();
    redisClient = null;
  }
}

// Helper functions for common Redis operations
export async function redisGet(key: string) {
  const client = await getRedisClient();
  return await client.get(key);
}

export async function redisSet(key: string, value: string, ttl?: number) {
  const client = await getRedisClient();
  if (ttl) {
    return await client.setEx(key, ttl, value);
  }
  return await client.set(key, value);
}

export async function redisDel(key: string) {
  const client = await getRedisClient();
  return await client.del(key);
}

export async function redisExists(key: string) {
  const client = await getRedisClient();
  return await client.exists(key);
}
