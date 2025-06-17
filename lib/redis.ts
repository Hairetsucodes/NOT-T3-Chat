import { createClient } from "redis";
import { DefaultAzureCredential } from "@azure/identity";

let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (!redisClient) {
    try {
      // Construct a Token Credential from Identity library
      const credential = new DefaultAzureCredential();
      const redisScope = "https://redis.azure.com/.default";

      // Fetch a Microsoft Entra token to be used for authentication
      const accessToken = await credential.getToken(redisScope);
      console.log("Successfully obtained Azure access token");

      // Create redis client
      redisClient = createClient({
        username: process.env.REDIS_SERVICE_PRINCIPAL_ID,
        password: accessToken.token,
        url: `redis://${process.env.AZURE_MANAGED_REDIS_HOST_NAME}:10000`,
        pingInterval: 100000,
        socket: { 
          tls: true,
          keepAlive: 0 
        },
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