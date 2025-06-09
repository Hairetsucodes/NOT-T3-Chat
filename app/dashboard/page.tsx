"use client";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-lg p-6 shadow-lg">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
          
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Welcome back!</h2>
              <p className="text-muted-foreground">
                You have successfully signed in to your account.
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">User Information</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Name:</span> {session.user?.name}</p>
                <p><span className="font-medium">Email:</span> {session.user?.email}</p>
                <p><span className="font-medium">ID:</span> {session.user?.id}</p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                onClick={() => router.push("/chat")}
                className="flex-1"
              >
                Go to Chat
              </Button>
              
              <Button 
                onClick={() => signOut({ callbackUrl: "/" })}
                variant="outline"
                className="flex-1"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 