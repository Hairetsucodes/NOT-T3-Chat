"use client";

import { useState } from "react";
import { CopyIcon, GitBranch, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { branchConversation } from "@/data/convo";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface MessageActionsProps {
  conversationId?: string;
  userId: string;
  message: string;
  provider?: string;
  model?: string;
}

export function MessageActions({
  conversationId,
  userId,
  message,
  provider,
  model,
}: MessageActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  console.log(provider, model);
  const handleBranch = async () => {
    if (!conversationId) {
      toast.error("Cannot branch: No conversation ID");
      return;
    }

    setIsLoading(true);
    try {
      const branchedConvo = await branchConversation(userId, conversationId);
      toast.success("Conversation branched successfully!");
      router.push(`/chat/${branchedConvo.id}`);
    } catch (error) {
      console.error("Error branching conversation:", error);
      toast.error("Failed to branch conversation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message || "");
    toast.success("Conversation ID copied to clipboard");
  };

  return (
    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        disabled={isLoading || !conversationId}
        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <CopyIcon className="size-3 mr-1" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBranch}
        disabled={isLoading || !conversationId}
        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <GitBranch className="size-3 mr-1" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <RefreshCcw className="size-3 mr-1" />
      </Button>
      <div className="items-center gap-2">
        {model && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
            {model}
          </Badge>
        )}
      </div>
    </div>
  );
}
