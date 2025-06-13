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
import { updateUser } from "@/data/userInfo";
import { toast } from "sonner";
import { Loader2, User } from "lucide-react";
import { ChatContext } from "@/context/ChatContext";
import { signOut } from "next-auth/react";

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

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/" });
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Failed to sign out:", error);
      toast.error("Failed to sign out. Please try again.");
    }
  };

  // No user state
  if (!activeUser) {
    return (
      <AccountBackground>
        <Card className="relative z-10 h-full flex flex-col bg-gradient-chat-overlay border-chat-border/50 backdrop-blur-sm">
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Please sign in to manage your account settings
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
        <CardHeader className="flex-shrink-0 pb-2">
          <CardTitle className="text-foreground/90 text-xl">Account</CardTitle>
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
              className="p-2 rounded-lg border-1 bg-chat-input-background/80 border-chat-border/60 backdrop-blur-sm focus:border-primary/50 text-foreground placeholder:text-foreground/50 h-11 transition-colors"
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
              className="p-2 rounded-lg border-1 bg-chat-input-background/80 border-chat-border/60 backdrop-blur-sm focus:border-primary/50 text-foreground placeholder:text-foreground/50 h-11 transition-colors"
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
              className="p-2 rounded-lg border-1 bg-muted/30 border-chat-border/40 text-foreground/70 backdrop-blur-sm h-11 cursor-not-allowed"
            />
            <p className="text-sm text-muted-foreground">
              Email cannot be changed from here.
            </p>
          </div>

          {/* Session Management */}

          <div className="space-y-3 pt-4 border-t border-chat-border/30">
            <Label className="text-foreground/80 font-medium">
              Session Management
            </Label>
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-chat-border/40">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground/80">
                  Sign out of your account
                </p>
                <p className="text-xs text-muted-foreground">
                  You will be redirected to the home page
                </p>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 h-9 px-4 font-medium transition-all"
              >
                Sign Out
              </Button>
            </div>
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
