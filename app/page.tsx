"use client";
import Register from "@/components/authorization/Register";
import SignIn from "@/components/authorization/SignIn";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { ModeToggle } from "@/components/settings/theme/Toggle";

export default function Home() {
  const [selectedModal, setSelectedModal] = useState<"signIn" | "register">(
    "signIn"
  );
  const { data: session } = useSession();
  if (session) {
    redirect("/chat");
  }
  return (
    <div className="min-h-screen bg-background">
      {/* Theme toggle positioned at top right */}
      <div className="absolute top-6 right-6 z-10">
        <ModeToggle />
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Welcome to OSS T3 Chat
            </h1>
            <p className="text-muted-foreground text-base">
              {selectedModal === "signIn"
                ? "Sign in to your account to continue"
                : "Create your account to get started"}
            </p>
          </div>

          {/* Auth Form Container */}
          <div className="bg-card border border-border rounded-xl shadow-lg p-8">
            {selectedModal === "signIn" ? <SignIn /> : <Register />}
          </div>

          {/* Swap Button */}
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {selectedModal === "signIn"
                ? "Don't have an account?"
                : "Already have an account?"}
            </p>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto px-8 bg-background hover:bg-accent hover:text-accent-foreground border-border text-foreground"
              onClick={() => {
                if (selectedModal === "signIn") {
                  setSelectedModal("register");
                } else {
                  setSelectedModal("signIn");
                }
              }}
            >
              {selectedModal === "signIn" ? "Create Account" : "Sign In"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
