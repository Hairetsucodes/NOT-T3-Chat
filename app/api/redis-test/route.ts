import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function GET() {
  try {
    const client = await getRedisClient();
    
    // Test basic Redis operations
    console.log("Testing Redis PING command...");
    const pingResult = await client.ping();
    console.log("PING response:", pingResult);

    console.log("Testing Redis SET command...");
    const setResult = await client.set("test-message", "Hello from Next.js with Azure Redis!");
    console.log("SET response:", setResult);

    console.log("Testing Redis GET command...");
    const getMessage = await client.get("test-message");
    console.log("GET response:", getMessage);

    console.log("Testing Redis CLIENT LIST command...");
    const clientList = await client.sendCommand(["CLIENT", "LIST"]);
    console.log("CLIENT LIST response:", clientList);

    return NextResponse.json({
      success: true,
      message: "Redis connection test successful!",
      results: {
        ping: pingResult,
        set: setResult,
        get: getMessage,
        clientList: clientList
      }
    });

  } catch (error) {
    console.error("Redis test failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: error
    }, { status: 500 });
  }
} 