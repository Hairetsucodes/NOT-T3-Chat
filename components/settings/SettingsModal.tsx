import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { AccountTab } from "@/components/settings/tab/Account";
import { CustomizationTab } from "@/components/settings/tab/Customization";
import { HistoryTab } from "@/components/settings/tab/History";
import ModelsTab from "@/components/settings/tab/Models";
import { ApiKeysTab } from "@/components/settings/tab/ApiKeys";
import { AttachmentsTab } from "@/components/settings/tab/Attachments";
import { BugReportTab } from "@/components/settings/tab/BugReport";

export default function SettingsModal() {
  const [activeTab, setActiveTab] = useState("account");

  const tabs = [
    { value: "account", label: "Account" },
    { value: "customization", label: "Customization" },
    { value: "history", label: "History & Sync" },
    { value: "models", label: "Models" },
    { value: "apikeys", label: "API Keys" },
    { value: "attachments", label: "Attachments" },
    { value: "bugreport", label: "Bug Report" },
  ];

  return (
    <div className="w-full flex flex-col max-h-[80vh] overflow-hidden">
      <div className="flex flex-col gap-4 pb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col flex-1 min-h-0"
      >
        {/* Mobile dropdown */}
        <div className="md:hidden mb-4 flex-shrink-0">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tabs.map((tab) => (
                <SelectItem key={tab.value} value={tab.value}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop tabs */}
        <TabsList className="hidden md:grid w-full grid-cols-7 flex-shrink-0">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <TabsContent
            value="account"
            className="h-full mt-0 bg-chat-background overflow-y-auto"
          >
            <AccountTab />
          </TabsContent>

          <TabsContent
            value="customization"
            className="h-full mt-0 bg-chat-background overflow-y-auto"
          >
            <CustomizationTab />
          </TabsContent>

          <TabsContent
            value="history"
            className="h-full mt-0 bg-chat-background overflow-y-auto"
          >
            <HistoryTab />
          </TabsContent>

          <TabsContent
            value="models"
            className="h-full mt-0 bg-chat-background overflow-y-auto"
          >
            <ModelsTab />
          </TabsContent>

          <TabsContent
            value="apikeys"
            className="h-full mt-0 bg-chat-background overflow-y-auto"
          >
            <ApiKeysTab />
          </TabsContent>

          <TabsContent
            value="attachments"
            className="h-full mt-0 bg-chat-background overflow-y-auto"
          >
            <AttachmentsTab />
          </TabsContent>

          <TabsContent
            value="bugreport"
            className="h-full mt-0 bg-chat-background overflow-y-auto"
          >
            <BugReportTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
