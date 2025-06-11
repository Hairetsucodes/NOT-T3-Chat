"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useContext } from "react";
import { updateUser } from "@/data/user";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ChatContext } from "@/context/ChatContext";

// Background component to avoid repetition
const AccountBackground = ({ children }: { children: React.ReactNode }) => (
  <div className="relative h-full flex flex-col bg-chat-background">
    {children}
  </div>
);

export function AccountTab() {
  const { activeUser } = useContext(ChatContext);
  const [name, setName] = useState(activeUser?.name || "");
  const [username, setUsername] = useState(activeUser?.username || "");
  const [originalName, setOriginalName] = useState(activeUser?.name || "");
  const [originalUsername, setOriginalUsername] = useState(
    activeUser?.username || ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasChanges(name !== originalName || username !== originalUsername);
  }, [name, username, originalName, originalUsername]);

  const handleSaveChanges = async () => {
    if (!activeUser?.id) {
      toast.error("Please sign in to update your profile");
      return;
    }

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!username.trim()) {
      toast.error("Username is required");
      return;
    }

    // Basic username validation
    if (username.includes(" ")) {
      toast.error("Username cannot contain spaces");
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateUser(activeUser.id, {
        name: name.trim(),
        username: username.trim(),
      });

      if (result && "error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Profile updated successfully");
        setOriginalName(name.trim());
        setOriginalUsername(username.trim());
        setHasChanges(false);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <AccountBackground>
        <Card className="relative z-10 h-full flex flex-col bg-gradient-chat-overlay border-chat-border/50 backdrop-blur-sm">
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-foreground/80 font-medium">
                Loading profile...
              </span>
            </div>
          </CardContent>
        </Card>
      </AccountBackground>
    );
  }

  // No user state
  if (!activeUser) {
    return (
      <AccountBackground>
        <Card className="relative z-10 h-full flex flex-col bg-gradient-chat-overlay border-chat-border/50 backdrop-blur-sm">
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <p className="text-muted-foreground">
                Please sign in to manage your account
              </p>
            </div>
          </CardContent>
        </Card>
      </AccountBackground>
    );
  }

  return (
    <AccountBackground>
      <Card className="relative z-10 h-full flex flex-col bg-gradient-chat-overlay border-chat-border/50 backdrop-blur-sm">
        <CardHeader className="flex-shrink-0 pb-6">
          <CardTitle className="text-foreground/90 text-xl">
            Account Settings
          </CardTitle>
          <CardDescription className="text-foreground/70">
            Manage your account information and preferences.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto space-y-6 px-6">
          {/* Display Name */}
          <div className="space-y-3">
            <Label htmlFor="name" className="text-foreground/80 font-medium">
              Display Name
            </Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="p-2 bg-chat-input-background/80 border-chat-border/60 backdrop-blur-sm focus:border-primary/50 text-foreground placeholder:text-foreground/50 h-11 transition-colors"
            />
          </div>

          {/* Username */}
          <div className="space-y-3">
            <Label
              htmlFor="username"
              className="text-foreground/80 font-medium"
            >
              Username
            </Label>
            <Input
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className="p-2 bg-chat-input-background/80 border-chat-border/60 backdrop-blur-sm focus:border-primary/50 text-foreground placeholder:text-foreground/50 h-11 transition-colors"
            />
            <p className="text-sm text-muted-foreground">
              Username cannot contain spaces and must be unique.
            </p>
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-3">
            <Label htmlFor="email" className="text-foreground/80 font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={activeUser.email || ""}
              disabled
              className="p-2 bg-muted/30 border-chat-border/40 text-foreground/70 backdrop-blur-sm h-11 cursor-not-allowed"
            />
            <p className="text-sm text-muted-foreground">
              Email cannot be changed from here.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex-shrink-0 bg-gradient-chat-input/50 border-t border-chat-border/30 backdrop-blur-sm p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleSaveChanges}
              disabled={isLoading || !hasChanges}
              className="bg-primary hover:bg-primary/90 text-primary-foreground border-reflect button-reflect relative disabled:opacity-50 disabled:cursor-not-allowed h-10 px-6 font-medium transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>

            {hasChanges && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <p className="text-sm text-foreground/60">
                  You have unsaved changes
                </p>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </AccountBackground>
  );
}
