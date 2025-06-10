import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import {
  AccountTab,
  CustomizationTab,
  HistoryTab,
  ModelsTab,
  ApiKeysTab,
  AttachmentsTab,
  BugReportTab,
} from "@/components/settings/tab";

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

        <div className="flex-1 min-h-0 overflow-hidden">
          <TabsContent value="account" className="h-full mt-0">
            <AccountTab />
          </TabsContent>

          <TabsContent value="customization" className="h-full mt-0">
            <CustomizationTab />
          </TabsContent>

          <TabsContent value="history" className="h-full mt-0">
            <HistoryTab />
          </TabsContent>

          <TabsContent value="models" className="h-full mt-0">
            <ModelsTab />
          </TabsContent>

          <TabsContent value="apikeys" className="h-full mt-0">
            <ApiKeysTab />
          </TabsContent>

          <TabsContent value="attachments" className="h-full mt-0">
            <AttachmentsTab />
          </TabsContent>

          <TabsContent value="bugreport" className="h-full mt-0">
            <BugReportTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
