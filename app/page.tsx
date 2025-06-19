"use client";
import Register from "@/components/authorization/Register";
import SignIn from "@/components/authorization/SignIn";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { ModeToggle } from "@/components/settings/theme/Toggle";
import Footer from "@/components/authorization/Footer";
import { SocialLogin } from "@/components/authorization/Social";

export default function Home() {
  const [isSignIn, setIsSignIn] = useState(true);
  const { data: session } = useSession();
  if (session) {
    redirect("/chat");
  }
  return (
    <div className="min-h-screen bg-sidebar flex flex-col">
      {/* Theme toggle positioned at top right */}
      <div className="absolute top-6 right-6 z-10">
        <ModeToggle />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-5xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
                  Welcome to
                </span>
                <br />
                <span className="bg-gradient-to-r from-pink-700 via-rose-800 to-pink-900 dark:from-pink-500 dark:via-rose-400 dark:to-pink-600 bg-clip-text text-transparent">
                  <span className="underline underline-offset-3 decoration-pink-700 dark:decoration-pink-400 decoration-4">
                    NOT
                  </span>{" "}
                  T3 Chat
                </span>
              </h1>
            </div>
            <p className="text-muted-foreground text-lg font-medium max-w-sm mx-auto leading-relaxed">
              {isSignIn
                ? "Sign in to your account to continue your AI conversations"
                : "Create your account to start chatting with AI"}
            </p>
          </div>

          {/* Auth Form Container */}
          <div className="bg-chat-background border border-border rounded-xl shadow-lg p-8">
            {isSignIn ? <SignIn /> : <Register />}
            <SocialLogin />
          </div>
                
          {/* Swap Button */}
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {isSignIn ? "Don't have an account?" : "Already have an account?"}
            </p>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto px-8 bg-background hover:bg-accent hover:text-accent-foreground border-border text-foreground"
              onClick={() => {
                if (isSignIn) {
                  setIsSignIn(false);
                } else {
                  setIsSignIn(true);
                }
              }}
            >
              {isSignIn ? "Create Account" : "Sign In"}
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
