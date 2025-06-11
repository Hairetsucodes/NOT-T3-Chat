import { PrismaClient } from "@prisma/client";
import { type LanguageModelV1StreamPart } from "ai";

// Use global prisma instance to avoid connection issues in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

class PrismaResponseCache {
  async set(
    key: string,
    value: LanguageModelV1StreamPart[],
    ttlSeconds: number = 3600,
    userId?: string
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    await prisma.responseCache.upsert({
      where: { cacheKey: key },
      update: {
        response: JSON.stringify(value),
        expiresAt,
        userId,
      },
      create: {
        cacheKey: key,
        response: JSON.stringify(value),
        expiresAt,
        userId,
      },
    });
  }

  async get(key: string): Promise<LanguageModelV1StreamPart[] | null> {
    try {
      const cached = await prisma.responseCache.findFirst({
        where: {
          cacheKey: key,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (cached) {
        return JSON.parse(cached.response) as LanguageModelV1StreamPart[];
      }

      return null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    await prisma.responseCache
      .delete({
        where: { cacheKey: key },
      })
      .catch(() => {
        // Ignore errors if key doesn't exist
      });
  }

  async size(userId?: string): Promise<number> {
    const count = await prisma.responseCache.count({
      where: {
        expiresAt: {
          gt: new Date(),
        },
        ...(userId && { userId }),
      },
    });

    return count;
  }

  async cleanup(): Promise<number> {
    const result = await prisma.responseCache.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });

    return result.count;
  }

  async clear(userId?: string): Promise<void> {
    await prisma.responseCache.deleteMany({
      where: userId ? { userId } : {},
    });
  }

  // Get cache statistics
  async getStats(userId?: string) {
    const [total, expired] = await Promise.all([
      prisma.responseCache.count({
        where: userId ? { userId } : {},
      }),
      prisma.responseCache.count({
        where: {
          expiresAt: {
            lte: new Date(),
          },
          ...(userId && { userId }),
        },
      }),
    ]);

    return {
      total,
      active: total - expired,
      expired,
    };
  }
}

export const responseCache = new PrismaResponseCache();

// Cleanup expired entries every hour
setInterval(() => {
  responseCache.cleanup().catch(console.error);
}, 60 * 60 * 1000);
