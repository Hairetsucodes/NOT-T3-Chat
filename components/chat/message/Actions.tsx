"use client";

import { useContext, useState, useMemo } from "react";
import { CopyIcon, GitBranch, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { branchConversation, createRetryConversation } from "@/data/convo";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ChatContext } from "@/context/ChatContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageActionsProps } from "@/types/chat";
import { getProviderIcon } from "@/components/ui/provider-images";
import { updateModelAndProvider } from "@/data/settings";
import { ChatSettings } from "@prisma/client";
import { Message } from "@/types/chat";

// Provider display names and order
const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  google: "Gemini",
  openai: "OpenAI",
  anthropic: "Claude",
  meta: "Llama",
  deepseek: "DeepSeek",
  xai: "Grok",
  qwen: "Qwen",
  openrouter: "OpenRouter",
};

const PROVIDER_ORDER = [
  "google",
  "openai",
  "anthropic",
  "meta",
  "deepseek",
  "xai",
  "qwen",
  "openrouter",
];

export function MessageActions({
  conversationId,
  inputMessage,
  message,
}: MessageActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const {
    addConversation,
    availableModels,
    setMessages,
    setConversationId,
    chatSettings,
    setChatSettings,
    sendMessage,
  } = useContext(ChatContext);

  // Group models by provider
  const modelsByProvider = useMemo(() => {
    const grouped = new Map<string, typeof availableModels>();

    availableModels.forEach((model) => {
      const provider = model.provider;
      if (!grouped.has(provider)) {
        grouped.set(provider, []);
      }
      grouped.get(provider)!.push(model);
    });

    // Sort models within each provider by name
    grouped.forEach((models) => {
      models.sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
  }, [availableModels]);

  // Get ordered providers that have models
  const orderedProviders = useMemo(() => {
    const availableProviders = Array.from(modelsByProvider.keys());
    return PROVIDER_ORDER.filter((provider) =>
      availableProviders.includes(provider)
    ).concat(
      availableProviders.filter(
        (provider) => !PROVIDER_ORDER.includes(provider)
      )
    );
  }, [modelsByProvider]);

  const handleBranch = async () => {
    if (!conversationId) {
      toast.error("Cannot branch: No conversation ID");
      return;
    }

    setIsLoading(true);
    try {
      const branchedConvo = await branchConversation(conversationId);

      // Add the new conversation to the conversations list
      addConversation(branchedConvo);

      toast.success("Conversation branched successfully!");
      router.replace(`/chat/${branchedConvo.id}`);
    } catch (error) {
      console.error("Error branching conversation:", error);
      toast.error("Failed to branch conversation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || "");
    toast.success("Response copied to clipboard");
  };

  const handleRetry = async (newModelId?: string, newProvider?: string) => {
    if (!conversationId || !message) {
      toast.error("Cannot retry: Missing conversation data");
      return;
    }

    setIsLoading(true);

    try {
      // Create new retry conversation
      const newConversation = await createRetryConversation(conversationId);

      // Add the new conversation to the list
      addConversation(newConversation);

      // Immediately clear all conversation state
      setMessages([]);
      setConversationId(null);

      // Update chat settings if new model/provider provided
      if (newModelId || newProvider) {
        setChatSettings({
          ...chatSettings,
          model: newModelId || message.model || "",
          provider: newProvider || message.provider || "",
        } as ChatSettings);
      }

      // Set the new conversation as active - this should trigger proper state switching
      await setConversationId(newConversation.id);

      router.push(`/chat/${newConversation.id}`, { scroll: true });

      // Create and send the retry message directly
      const retryMessageObj: Message = {
        id: Date.now().toString(),
        role: "user" as const,
        content: inputMessage,
      };

      // Send the message directly
      await sendMessage(retryMessageObj, {
        conversationId: newConversation.id,
        model: newModelId,
        provider: newProvider,
        retry: true,
      });

      toast.success("Message retried successfully!");
    } catch (error) {
      console.error("Error during retry:", error);
      toast.error("Failed to retry message");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={isLoading || !conversationId}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <CopyIcon className="size-3 mr-1" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-black/80">
          <p>Copy response</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBranch}
            disabled={isLoading || !conversationId}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <GitBranch className="size-3 mr-1" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-black/80">
          <p>Branch conversation</p>
        </TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isLoading || !conversationId}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCcw />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-black/80">
            <p>Retry message</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent
          align="start"
          className="min-w-[12rem] max-h-80 overflow-y-auto"
          side="bottom"
        >
          {/* Retry with same model */}
          <DropdownMenuItem
            onClick={() => handleRetry()}
            className="flex items-center gap-2 px-3 py-2"
          >
            <RefreshCcw className="size-4 text-color-heading" />
            <div className="w-full">Retry same</div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="mx-2 my-1" />

          {/* Switch model label */}
          <div className="relative flex w-full items-center justify-center">
            <div className="-ml-2 bg-popover px-2 text-sm text-muted-foreground/80">
              or switch model
            </div>
          </div>

          {/* Provider groups */}
          {orderedProviders.map((provider) => {
            const models = modelsByProvider.get(provider) || [];
            const displayName = PROVIDER_DISPLAY_NAMES[provider] || provider;

            if (models.length === 0) return null;

            return (
              <DropdownMenuSub key={provider}>
                <DropdownMenuSubTrigger className="flex items-center gap-2 px-3 py-2">
                  <div className="flex items-center gap-4 pr-8">
                    {getProviderIcon(provider, "size-6 text-color-heading")}
                    {displayName}
                  </div>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="min-w-[16rem] max-h-60 overflow-y-auto">
                  {models.map((modelData) => (
                    <DropdownMenuItem
                      key={modelData.modelId}
                      onClick={() => {
                        updateModelAndProvider(
                          modelData.modelId,
                          modelData.provider
                        );
                        handleRetry(modelData.modelId, modelData.provider);
                      }}
                      className="flex flex-col items-start gap-1 p-3 cursor-default"
                    >
                      <div className="flex w-full items-center justify-between">
                        {getProviderIcon(provider, "text-color-heading")}
                        <span className="w-fit">{modelData.name}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="items-center gap-2">
        {message.model && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
            {message.model}
          </Badge>
        )}
      </div>
    </div>
  );
}
