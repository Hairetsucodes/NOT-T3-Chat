"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { useState, useContext } from "react";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { ChatContext } from "@/context/ChatContext";
import { updateUserSettings, resetUserSettings } from "@/data/settings";

// Background component to match AccountTab
const CustomizationBackground = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <div className="relative h-full flex flex-col bg-chat-background">
    {/* Background layers */}
    {children}
  </div>
);

const SUGGESTED_TRAITS = [
  "friendly",
  "witty",
  "concise",
  "curious",
  "empathetic",
  "creative",
  "patient",
  "analytical",
  "supportive",
  "direct",
];

export function CustomizationTab() {
  const { activeUser, userSettings, setUserSettings } = useContext(ChatContext);

  // Local state for form fields
  const [name, setName] = useState(userSettings?.displayName || "");
  const [occupation, setOccupation] = useState(userSettings?.userRole || "");
  const [traits, setTraits] = useState<string[]>(
    userSettings?.userTraits
      ? userSettings.userTraits.split(", ").filter(Boolean)
      : []
  );
  const [traitInput, setTraitInput] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState(
    userSettings?.additionalContext || ""
  );
  const [boringTheme, setBoringTheme] = useState(
    userSettings?.isBoringTheme || false
  );
  const [hidePersonalInfo, setHidePersonalInfo] = useState(
    userSettings?.hidePersonalInfo || false
  );
  const [disableThematicBreaks, setDisableThematicBreaks] = useState(
    userSettings?.disableThematicBreaks || false
  );
  const [statsForNerds, setStatsForNerds] = useState(
    userSettings?.showStatsForNerds || false
  );
  const [mainFont, setMainFont] = useState(
    userSettings?.mainTextFont || "Inter"
  );
  const [codeFont, setCodeFont] = useState(userSettings?.codeFont || "mono");
  const [isLoading, setIsLoading] = useState(false);

  const addTrait = (trait: string) => {
    if (trait.trim() && !traits.includes(trait.trim()) && traits.length < 50) {
      setTraits([...traits, trait.trim()]);
      setTraitInput("");
    }
  };

  const removeTrait = (traitToRemove: string) => {
    setTraits(traits.filter((trait) => trait !== traitToRemove));
  };

  const handleTraitInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      addTrait(traitInput);
    }
  };

  const handleSavePreferences = async () => {
    if (!activeUser?.id) {
      toast.error("Please sign in to save preferences");
      return;
    }

    setIsLoading(true);
    try {
      const settingsData = {
        displayName: name.trim(),
        userRole: occupation.trim(),
        userTraits: traits.join(", "),
        additionalContext: additionalInfo.trim(),
        isBoringTheme: boringTheme,
        hidePersonalInfo: hidePersonalInfo,
        disableThematicBreaks: disableThematicBreaks,
        showStatsForNerds: statsForNerds,
        mainTextFont: mainFont,
        codeFont: codeFont,
      };

      const result = await updateUserSettings(settingsData);

      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }

      // Update the context state with the saved values
      if (
        userSettings &&
        result &&
        typeof result === "object" &&
        "id" in result
      ) {
        setUserSettings(result);
      }

      toast.success("Preferences saved successfully");
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSettings = async () => {
    if (!activeUser?.id) {
      toast.error("Please sign in to reset settings");
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetUserSettings();

      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }

      // Reset local state
      setName("");
      setOccupation("");
      setTraits([]);
      setAdditionalInfo("");
      setBoringTheme(false);
      setHidePersonalInfo(false);
      setDisableThematicBreaks(false);
      setStatsForNerds(false);
      setMainFont("Inter");
      setCodeFont("mono");

      // Update context state
      if (result && typeof result === "object" && "id" in result) {
        setUserSettings(result);
      }

      toast.success("Settings reset to defaults");
    } catch (error) {
      console.error("Failed to reset settings:", error);
      toast.error("Failed to reset settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CustomizationBackground>
      <Card className="relative z-10 h-full flex flex-col bg-gradient-chat-overlay border-chat-border/50 backdrop-blur-sm">
        <CardHeader className="flex-shrink-0 pb-2">
          <CardTitle className="text-foreground/90 text-xl">
            Customization
          </CardTitle>
          <CardDescription className="text-foreground/70">
            Customize your NOT T3 Chat experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          {/* Customization Section */}
          <div className="">
            <form
              className="grid gap-6 py-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleSavePreferences();
              }}
            >
              {/* Name Input */}
              <div className="relative grid gap-2">
                <Label className="text-base font-medium text-foreground/80">
                  What should NOT T3 Chat call you?
                </Label>
                <Input
                  placeholder="Enter your name"
                  maxLength={50}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  className="p-2 rounded-lg border-1 bg-chat-input-background/80 border-chat-border/60 backdrop-blur-sm focus:border-primary/50 text-foreground placeholder:text-foreground/50 h-9 transition-colors"
                />
                <span className="pointer-events-none absolute bottom-2 right-2 text-xs font-normal text-muted-foreground">
                  {name.length}/50
                </span>
              </div>

              {/* Occupation Input */}
              <div className="relative grid gap-2">
                <Label className="text-base font-medium text-foreground/80">
                  What do you do?
                </Label>
                <Input
                  placeholder="Engineer, student, etc."
                  maxLength={100}
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  disabled={isLoading}
                  className="p-2 rounded-lg border-1  bg-chat-input-background/80 border-chat-border/60 backdrop-blur-sm focus:border-primary/50 text-foreground placeholder:text-foreground/50 h-9 transition-colors"
                />
                <span className="pointer-events-none absolute bottom-2 right-2 text-xs font-normal text-muted-foreground">
                  {occupation.length}/100
                </span>
              </div>

              {/* Traits Section */}
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-medium text-foreground/80">
                    What traits should NOT T3 Chat have?
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      (up to 50, max 100 chars each)
                    </span>
                  </Label>
                </div>

                <div className="relative">
                  <Input
                    placeholder="Type a trait and press Enter or Tab..."
                    maxLength={100}
                    value={traitInput}
                    onChange={(e) => setTraitInput(e.target.value)}
                    onKeyDown={handleTraitInputKeyPress}
                    disabled={isLoading}
                    className="p-2 rounded-lg border-1 bg-chat-input-background/80 border-chat-border/60 backdrop-blur-sm focus:border-primary/50 text-foreground placeholder:text-foreground/50 h-9 transition-colors"
                  />
                  <span className="pointer-events-none absolute bottom-2 right-2 text-xs font-normal text-muted-foreground">
                    {traits.length}/50
                  </span>
                </div>

                {/* Suggested Traits */}
                <div className="mb-2 flex flex-wrap gap-2">
                  {SUGGESTED_TRAITS.map((trait) => (
                    <button
                      key={trait}
                      type="button"
                      onClick={() => addTrait(trait)}
                      disabled={
                        traits.includes(trait) ||
                        traits.length >= 50 ||
                        isLoading
                      }
                      className="rounded-md border px-2.5 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 flex select-none items-center gap-1 text-xs font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {trait}
                      <Plus className="h-4 w-4" />
                    </button>
                  ))}
                </div>

                {/* Selected Traits */}
                {traits.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {traits.map((trait) => (
                      <div
                        key={trait}
                        className="rounded-md border px-2.5 py-0.5 transition-colors border-primary/20 bg-primary/10 text-primary flex select-none items-center gap-1 text-xs font-medium"
                      >
                        {trait}
                        <button
                          type="button"
                          onClick={() => removeTrait(trait)}
                          disabled={isLoading}
                          className="hover:bg-primary/20 rounded p-0.5 disabled:opacity-50"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Additional Info */}
              <div className="relative grid gap-2">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-medium text-foreground/80">
                    Anything else NOT T3 Chat should know about you?
                  </Label>
                </div>
                <Textarea
                  placeholder="Interests, values, or preferences to keep in mind"
                  maxLength={3000}
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  disabled={isLoading}
                  className="min-h-[100px] p-2 rounded-lg border-1 bg-chat-input-background/80 border-chat-border/60 backdrop-blur-sm focus:border-primary/50 text-foreground placeholder:text-foreground/50 transition-colors"
                />
                <span className="pointer-events-none absolute bottom-2 right-2 text-xs font-normal text-muted-foreground">
                  {additionalInfo.length}/3000
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row items-center gap-2 justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetSettings}
                  disabled={isLoading}
                  className="bg-background hover:bg-input/60 border-chat-border/60 text-foreground"
                >
                  Reset to Defaults
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground border-reflect button-reflect relative disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Preferences"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </CustomizationBackground>
  );
}
