import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useContext } from "react";
import { useSession } from "next-auth/react";
import { createAPIKey, deleteAPIKey } from "@/data/apikeys";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import ActiveProviders from "@/components/settings/ActiveProviders";
import { ChatContext } from "@/context/ChatContext";

export function ApiKeysTab() {
  const { data: session, status } = useSession();
  const [selectedProvider, setSelectedProvider] = useState("");
  const [customProviderName, setCustomProviderName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { activeUser, activeProviders, setActiveProviders } =
    useContext(ChatContext);

  const handleSaveApiKey = async () => {
    const finalProvider =
      selectedProvider === "custom"
        ? customProviderName.trim()
        : selectedProvider;

    if (!selectedProvider || !apiKey.trim() || !activeUser?.id) {
      toast.error("Please select a provider and enter an API key");
      return;
    }

    if (selectedProvider === "custom" && !customProviderName.trim()) {
      toast.error("Please enter a custom provider name");
      return;
    }

    setIsLoading(true);
    try {
      await createAPIKey(activeUser.id, apiKey.trim(), finalProvider);
      toast.success("API key saved successfully");
      setActiveProviders([
        ...activeProviders,
        { id: apiKey.trim(), provider: finalProvider },
      ]);
      // Reset form
      setApiKey("");
      setSelectedProvider("");
      setCustomProviderName("");
    } catch (error) {
      console.error("Failed to save API key:", error);
      if (error instanceof Error) {
        // Handle specific error messages from server
        if (error.message.includes("Invalid input")) {
          toast.error("Please check your API key format and try again");
        } else if (error.message.includes("Unauthorized")) {
          toast.error("Session expired. Please sign in again");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error("Failed to save API key");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!session?.user?.id) return;

    try {
      await deleteAPIKey(session.user.id, keyId);
      toast.success("API key deleted successfully");
      setActiveProviders(
        activeProviders.filter((provider) => provider.id !== keyId)
      );
    } catch (error) {
      console.error("Failed to delete API key:", error);
      if (error instanceof Error) {
        if (
          error.message.includes("not found") ||
          error.message.includes("unauthorized")
        ) {
          toast.error(
            "API key not found or you don't have permission to delete it"
          );
        } else if (error.message.includes("Invalid input")) {
          toast.error("Invalid request. Please try again");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error("Failed to delete API key");
      }
    }
  };

  // Show loading if session is loading
  if (status === "loading") {
    return (
      <Card className="relative z-10 h-full flex flex-col bg-gradient-chat-overlay border-chat-border/50 backdrop-blur-sm">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-foreground/80 font-medium">
              Loading API keys...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error if no session
  if (!session?.user) {
    return (
      <Card className="h-full flex flex-col">
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">
            Please sign in to manage your API keys
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col bg-chat-background">
      <CardHeader className="flex-shrink-0 pb-2">
        <CardTitle className="text-foreground/90 text-xl">API Keys</CardTitle>
        <CardDescription className="text-foreground/70">
          Manage your API keys for different AI services.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-6 min-h-0">
        {/* Add New API Key Section */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <Label className="text-base font-medium">Add New API Key</Label>

          <div className="grid gap-3">
            <Label htmlFor="provider-select">Provider</Label>
            <Select
              value={selectedProvider}
              onValueChange={setSelectedProvider}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="google">Google AI</SelectItem>
                <SelectItem value="deepseek">DeepSeek</SelectItem>
                <SelectItem value="xai">xAI</SelectItem>
                <SelectItem value="openrouter">OpenRouter</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Provider Name Input - only show when custom is selected */}
          {selectedProvider === "custom" && (
            <div className="grid gap-3">
              <Label htmlFor="custom-provider-input">
                Custom Provider Name
              </Label>
              <Input
                id="custom-provider-input"
                type="text"
                placeholder="e.g., my-custom-api, local-llm, etc."
                value={customProviderName}
                onChange={(e) => setCustomProviderName(e.target.value)}
              />
            </div>
          )}

          <div className="grid gap-3">
            <Label htmlFor="api-key-input">API Key</Label>
            <Input
              id="api-key-input"
              type="password"
              placeholder="Enter your API key..."
              value={apiKey}
              className="rounded-lg border-[.1rem] border-chat-border p-2"
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <Button
            onClick={handleSaveApiKey}
            disabled={
              !selectedProvider ||
              !apiKey.trim() ||
              isLoading ||
              (selectedProvider === "custom" && !customProviderName.trim())
            }
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save API Key"
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <Label>API Usage</Label>
          <div className="p-4 border rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">OpenAI Usage:</span>
              <span className="text-sm font-mono">$12.45 / $100.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Anthropic Usage:</span>
              <span className="text-sm font-mono">$8.32 / $50.00</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="usage-alerts" />
          <Label htmlFor="usage-alerts">Enable usage alerts</Label>
        </div>

        <ActiveProviders
          apiKeys={activeProviders}
          customModels={[]}
          ollamaModels={[]}
          localModels={[]}
          onDeleteApiKey={handleDeleteApiKey}
        />
      </CardContent>
    </Card>
  );
}
