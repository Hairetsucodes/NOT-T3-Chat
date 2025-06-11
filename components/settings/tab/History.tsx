"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect, useContext } from "react";
import { toast } from "sonner";
import { Loader2, Download, Upload, Trash2, BarChart3 } from "lucide-react";
import { ChatContext } from "@/context/ChatContext";
import {
  getUserChatHistory,
  getHistoryStats,
  clearAllHistory,
  clearHistoryOlderThan,
  importChatHistory,
  HistoryStats,
  UserChatHistory,
} from "@/data/history";

// Background component to match other tabs
const HistoryBackground = ({ children }: { children: React.ReactNode }) => (
  <div className="relative h-full flex flex-col">{children}</div>
);

export function HistoryTab() {
  const { activeUser } = useContext(ChatContext);

  // State management
  const [saveHistory, setSaveHistory] = useState(true);
  const [syncDevices, setSyncDevices] = useState(false);
  const [retentionPeriod, setRetentionPeriod] = useState("forever");
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isDangerAction, setIsDangerAction] = useState(false);

  // Load history stats on mount
  useEffect(() => {
    const loadStats = async () => {
      if (!activeUser?.id) {
        setIsStatsLoading(false);
        return;
      }

      try {
        const result = await getHistoryStats(activeUser.id);

        if (result && "error" in result) {
          toast.error(result.error);
          setIsStatsLoading(false);
          return;
        }

        setStats(result as HistoryStats);
      } catch (error) {
        console.error("Failed to load history stats:", error);
        toast.error("Failed to load history statistics");
      } finally {
        setIsStatsLoading(false);
      }
    };

    loadStats();
  }, [activeUser?.id]);

  const handleExportHistory = async () => {
    if (!activeUser?.id) {
      toast.error("Please sign in to export history");
      return;
    }

    setIsLoading(true);
    try {
      const result = await getUserChatHistory(activeUser.id);

      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }

      const history = result as UserChatHistory;

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(history, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `t3-chat-history-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(
        `Exported ${history.totalConversations} conversations with ${history.totalMessages} messages`
      );
    } catch (error) {
      console.error("Failed to export history:", error);
      toast.error("Failed to export history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportHistory = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !activeUser?.id) {
      toast.error("Please select a file and sign in");
      return;
    }

    setIsLoading(true);
    try {
      const text = await file.text();
      const historyData = JSON.parse(text) as UserChatHistory;

      // Validate the structure
      if (!historyData.userId || !historyData.conversations) {
        toast.error("Invalid history file format");
        return;
      }

      const result = await importChatHistory(activeUser.id, historyData, {
        skipExisting: true,
        transferFromDifferentUser: true, // Allow importing from different users
      });

      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }

      // Generate appropriate success message
      const isTransfer = historyData.userId !== activeUser.id;
      const message = isTransfer
        ? `Transferred ${result.importedConversations} conversations with ${
            result.importedMessages
          } messages from account ${historyData.userId}${
            result.skippedConversations > 0
              ? `. Skipped ${result.skippedConversations} existing conversations.`
              : "."
          }`
        : `Imported ${result.importedConversations} conversations with ${
            result.importedMessages
          } messages${
            result.skippedConversations > 0
              ? `. Skipped ${result.skippedConversations} existing conversations.`
              : "."
          }`;

      toast.success(message);

      // Refresh stats
      const newStats = await getHistoryStats(activeUser.id);
      if (newStats && !("error" in newStats)) {
        setStats(newStats);
      }
    } catch (error) {
      console.error("Failed to import history:", error);
      toast.error("Failed to import history. Please check the file format.");
    } finally {
      setIsLoading(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const handleClearHistory = async () => {
    if (!activeUser?.id) {
      toast.error("Please sign in to clear history");
      return;
    }

    if (!isDangerAction) {
      setIsDangerAction(true);
      toast.warning("Click again to confirm clearing all history");
      setTimeout(() => setIsDangerAction(false), 5000);
      return;
    }

    setIsLoading(true);
    try {
      const result = await clearAllHistory(activeUser.id);

      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("All chat history cleared successfully");
      setStats({
        totalConversations: 0,
        totalMessages: 0,
        providers: {},
        messagesByRole: {},
      });
      setIsDangerAction(false);
    } catch (error) {
      console.error("Failed to clear history:", error);
      toast.error("Failed to clear history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyRetention = async () => {
    if (!activeUser?.id || retentionPeriod === "forever") {
      return;
    }

    setIsLoading(true);
    try {
      const now = new Date();
      let cutoffDate: Date;

      switch (retentionPeriod) {
        case "1week":
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "1month":
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "3months":
          cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "6months":
          cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
          break;
        case "1year":
          cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          return;
      }

      const result = await clearHistoryOlderThan(activeUser.id, cutoffDate);

      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }

      if (result.deletedConversations > 0) {
        toast.success(
          `Deleted ${result.deletedConversations} old conversations with ${result.deletedMessages} messages`
        );

        // Refresh stats
        const newStats = await getHistoryStats(activeUser.id);
        if (newStats && !("error" in newStats)) {
          setStats(newStats);
        }
      } else {
        toast.info("No old conversations found to delete");
      }
    } catch (error) {
      console.error("Failed to apply retention policy:", error);
      toast.error("Failed to apply retention policy");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isStatsLoading) {
    return (
      <HistoryBackground>
        <Card className="relative z-10 h-full flex flex-col bg-gradient-chat-overlay border-chat-border/50 backdrop-blur-sm">
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-foreground/80 font-medium">
                Loading history settings...
              </span>
            </div>
          </CardContent>
        </Card>
      </HistoryBackground>
    );
  }

  // No user state
  if (!activeUser) {
    return (
      <HistoryBackground>
        <Card className="relative z-10 h-full flex flex-col bg-gradient-chat-overlay border-chat-border/50 backdrop-blur-sm">
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Please sign in to manage your chat history settings
              </p>
            </div>
          </CardContent>
        </Card>
      </HistoryBackground>
    );
  }

  return (
    <HistoryBackground>
      <Card className="relative z-10 h-full flex flex-col bg-gradient-chat-overlay border-chat-border/50 backdrop-blur-sm">
        <CardHeader className="flex-shrink-0 pb-6">
          <CardTitle className="text-foreground/90 text-xl">History</CardTitle>
          <CardDescription className="text-foreground/70">
            Manage your chat history and synchronization settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto space-y-8 min-h-0">
          {/* History Statistics */}
          {stats && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground/90">
                History Overview
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-chat-input-background/50 rounded-lg p-3 border border-chat-border/30">
                  <div className="text-2xl font-bold text-primary">
                    {stats.totalConversations}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Conversations
                  </div>
                </div>
                <div className="bg-chat-input-background/50 rounded-lg p-3 border border-chat-border/30">
                  <div className="text-2xl font-bold text-primary">
                    {stats.totalMessages}
                  </div>
                  <div className="text-xs text-muted-foreground">Messages</div>
                </div>
                <div className="bg-chat-input-background/50 rounded-lg p-3 border border-chat-border/30">
                  <div className="text-2xl font-bold text-primary">
                    {Object.keys(stats.providers).length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    AI Providers
                  </div>
                </div>
                <div className="bg-chat-input-background/50 rounded-lg p-3 border border-chat-border/30">
                  <div className="text-2xl font-bold text-primary">
                    {stats.oldestConversation
                      ? Math.ceil(
                          (new Date().getTime() -
                            new Date(stats.oldestConversation).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                      : 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Days Active
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History Settings */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-medium text-base text-foreground/80">
                  Save chat history
                </Label>
                <p className="text-sm text-muted-foreground">
                  Store your conversations for future reference
                </p>
              </div>
              <Switch
                checked={saveHistory}
                onCheckedChange={setSaveHistory}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-medium text-base text-foreground/80">
                  Sync across devices (coming soon)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Keep your history synchronized across all your devices
                </p>
              </div>
              <Switch
                checked={syncDevices}
                onCheckedChange={setSyncDevices}
                disabled={true}
              />
            </div>

            <div className="grid gap-3">
              <div className="space-y-0.5">
                <Label className="font-medium text-base text-foreground/80">
                  History retention period
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically delete conversations older than the selected
                  period
                </p>
              </div>
              <div className="flex gap-2">
                <Select
                  value={retentionPeriod}
                  onValueChange={setRetentionPeriod}
                  disabled={isLoading}
                >
                  <SelectTrigger className="flex-1 bg-chat-input-background/80 border-chat-border/60 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1week">1 Week</SelectItem>
                    <SelectItem value="1month">1 Month</SelectItem>
                    <SelectItem value="3months">3 Months</SelectItem>
                    <SelectItem value="6months">6 Months</SelectItem>
                    <SelectItem value="1year">1 Year</SelectItem>
                    <SelectItem value="forever">Forever</SelectItem>
                  </SelectContent>
                </Select>
                {retentionPeriod !== "forever" && (
                  <Button
                    variant="outline"
                    onClick={handleApplyRetention}
                    disabled={isLoading}
                    className="bg-background hover:bg-input/60 border-chat-border/60 text-foreground"
                  >
                    Apply Now
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Export & Import */}
          <div className="space-y-4">
            <div className="space-y-0.5">
              <Label className="font-medium text-base text-foreground/90">
                Export & Import
              </Label>
              <p className="text-sm text-muted-foreground">
                Backup your conversations or transfer chat history from another
                account. History from different users will be automatically
                transferred to your account.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExportHistory}
                disabled={isLoading || !stats?.totalConversations}
                className="bg-background hover:bg-input/60 border-chat-border/60 text-foreground flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export History
              </Button>
              <div className="relative">
                <Button
                  variant="outline"
                  disabled={isLoading}
                  className="bg-background hover:bg-input/60 border-chat-border/60 text-foreground flex items-center gap-2"
                  onClick={() =>
                    document.getElementById("import-file")?.click()
                  }
                >
                  <Upload className="h-4 w-4" />
                  Import History
                </Button>
                <input
                  id="import-file"
                  type="file"
                  accept=".json"
                  onChange={handleImportHistory}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="space-y-4">
            <div className="space-y-0.5">
              <Label className="font-medium text-base text-destructive">
                Danger Zone
              </Label>
              <p className="text-sm text-muted-foreground">
                Irreversible actions that will permanently delete your data
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleClearHistory}
              disabled={isLoading || !stats?.totalConversations}
              className={`flex items-center gap-2 transition-all ${
                isDangerAction ? "bg-destructive/80 animate-pulse" : ""
              }`}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isDangerAction ? "Click again to confirm" : "Clear All History"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </HistoryBackground>
  );
}
