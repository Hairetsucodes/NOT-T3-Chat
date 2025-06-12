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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect, useContext } from "react";
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
  const { activeUser } = useContext(ChatContext);

  // Form state
  const [name, setName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [traits, setTraits] = useState<string[]>([]);
  const [traitInput, setTraitInput] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  // Visual options state
  const [boringTheme, setBoringTheme] = useState(false);
  const [hidePersonalInfo, setHidePersonalInfo] = useState(false);
  const [disableThematicBreaks, setDisableThematicBreaks] = useState(false);
  const [statsForNerds, setStatsForNerds] = useState(false);
  const [mainFont, setMainFont] = useState("Inter");
  const [codeFont, setCodeFont] = useState("mono");

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Original values for change detection
  const [originalValues, setOriginalValues] = useState({
    name: "",
    occupation: "",
    traits: [] as string[],
    additionalInfo: "",
    boringTheme: false,
    hidePersonalInfo: false,
    disableThematicBreaks: false,
    statsForNerds: false,
    mainFont: "Inter",
    codeFont: "mono",
  });

  // Track changes (only for text-based customization settings, visual options save automatically)
  useEffect(() => {
    const traitsChanged =
      JSON.stringify(traits.sort()) !==
      JSON.stringify(originalValues.traits.sort());
    setHasChanges(
      name !== originalValues.name ||
        occupation !== originalValues.occupation ||
        traitsChanged ||
        additionalInfo !== originalValues.additionalInfo
    );
  }, [name, occupation, traits, additionalInfo, originalValues]);

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
      // Convert traits array to comma-separated string
      const traitsString = traits.join(", ");

      const settingsData = {
        displayName: name.trim(),
        userRole: occupation.trim(),
        userTraits: traitsString,
        additionalContext: additionalInfo.trim(),
        isBoringTheme: boringTheme,
        hidePersonalInfo: hidePersonalInfo,
        disableThematicBreaks: disableThematicBreaks,
        showStatsForNerds: statsForNerds,
        mainTextFont: mainFont,
        codeFont: codeFont,
      };

      const result = await updateUserSettings(activeUser.id, settingsData);

      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Preferences saved successfully");

      // Update original values
      setOriginalValues({
        name: name.trim(),
        occupation: occupation.trim(),
        traits: [...traits],
        additionalInfo: additionalInfo.trim(),
        boringTheme,
        hidePersonalInfo,
        disableThematicBreaks,
        statsForNerds,
        mainFont,
        codeFont,
      });

      setHasChanges(false);
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for visual option updates (saves immediately)
  const updateVisualOption = async (field: string, value: boolean | string) => {
    if (!activeUser?.id) {
      toast.error("Please sign in to save preferences");
      return;
    }

    try {
      const settingsData = {
        [field]: value,
      };

      const result = await updateUserSettings(activeUser.id, settingsData);

      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }

      // Update original values for this specific field
      setOriginalValues((prev) => ({
        ...prev,
        [field === "isBoringTheme"
          ? "boringTheme"
          : field === "showStatsForNerds"
          ? "statsForNerds"
          : field === "mainTextFont"
          ? "mainFont"
          : field]: value,
      }));
    } catch (error) {
      console.error("Failed to save visual option:", error);
      toast.error("Failed to save setting");
    }
  };

  const handleBoringThemeChange = (value: boolean) => {
    setBoringTheme(value);
    updateVisualOption("isBoringTheme", value);
  };

  const handleHidePersonalInfoChange = (value: boolean) => {
    setHidePersonalInfo(value);
    updateVisualOption("hidePersonalInfo", value);
  };

  const handleDisableThematicBreaksChange = (value: boolean) => {
    setDisableThematicBreaks(value);
    updateVisualOption("disableThematicBreaks", value);
  };

  const handleStatsForNerdsChange = (value: boolean) => {
    setStatsForNerds(value);
    updateVisualOption("showStatsForNerds", value);
  };

  const handleMainFontChange = (value: string) => {
    setMainFont(value);
    updateVisualOption("mainTextFont", value);
  };

  const handleCodeFontChange = (value: string) => {
    setCodeFont(value);
    updateVisualOption("codeFont", value);
  };

  const handleResetSettings = async () => {
    if (!activeUser?.id) {
      toast.error("Please sign in to reset settings");
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetUserSettings(activeUser.id);

      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }

      // Reset to default values
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

      const defaultValues = {
        name: "",
        occupation: "",
        traits: [] as string[],
        additionalInfo: "",
        boringTheme: false,
        hidePersonalInfo: false,
        disableThematicBreaks: false,
        statsForNerds: false,
        mainFont: "Inter",
        codeFont: "mono",
      };
      setOriginalValues(defaultValues);

      toast.success("Settings reset to defaults");
      setHasChanges(false);
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
            Customize your OSS T3 Chat experience.
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
                  What should OSS T3 Chat call you?
                </Label>
                <Input
                  placeholder="Enter your name"
                  maxLength={50}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  className="p-2 bg-chat-input-background/80 border-chat-border/60 backdrop-blur-sm focus:border-primary/50 text-foreground placeholder:text-foreground/50 h-9 transition-colors"
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
                  className="p-2 bg-chat-input-background/80 border-chat-border/60 backdrop-blur-sm focus:border-primary/50 text-foreground placeholder:text-foreground/50 h-9 transition-colors"
                />
                <span className="pointer-events-none absolute bottom-2 right-2 text-xs font-normal text-muted-foreground">
                  {occupation.length}/100
                </span>
              </div>

              {/* Traits Section */}
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-medium text-foreground/80">
                    What traits should OSS T3 Chat have?
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
                    className="p-2 bg-chat-input-background/80 border-chat-border/60 backdrop-blur-sm focus:border-primary/50 text-foreground placeholder:text-foreground/50 h-9 transition-colors"
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
                    Anything else OSS T3 Chat should know about you?
                  </Label>
                </div>
                <Textarea
                  placeholder="Interests, values, or preferences to keep in mind"
                  maxLength={3000}
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  disabled={isLoading}
                  className="min-h-[100px] p-2 bg-chat-input-background/80 border-chat-border/60 backdrop-blur-sm focus:border-primary/50 text-foreground placeholder:text-foreground/50 transition-colors"
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
                  disabled={isLoading || !hasChanges}
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

          {/* Visual Options Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground/90">
              Visual Options
            </h2>
            <div className="space-y-6 py-2">
              {/* Theme Toggles */}
              <div className="flex items-center justify-between gap-x-1">
                <div className="space-y-0.5">
                  <Label className="font-medium text-base text-foreground/80">
                    Boring Theme
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    If you think the pink is too much, turn this on to tone it
                    down.
                  </p>
                </div>
                <Switch
                  checked={boringTheme}
                  onCheckedChange={handleBoringThemeChange}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between gap-x-1">
                <div className="space-y-0.5">
                  <Label className="font-medium text-base text-foreground/80">
                    Hide Personal Information
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Hides your name and email from the UI.
                  </p>
                </div>
                <Switch
                  checked={hidePersonalInfo}
                  onCheckedChange={handleHidePersonalInfoChange}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between gap-x-1">
                <div className="space-y-0.5">
                  <Label className="font-medium text-base text-foreground/80">
                    Disable Thematic Breaks
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Hides horizontal lines in chat messages. (Some browsers have
                    trouble rendering these, turn off if you have bugs with
                    duplicated lines)
                  </p>
                </div>
                <Switch
                  checked={disableThematicBreaks}
                  onCheckedChange={handleDisableThematicBreaksChange}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between gap-x-1">
                <div className="space-y-0.5">
                  <Label className="font-medium text-base text-foreground/80">
                    Stats for Nerds
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enables more insights into message stats including tokens
                    per second, time to first token, and estimated tokens in the
                    message.
                  </p>
                </div>
                <Switch
                  checked={statsForNerds}
                  onCheckedChange={handleStatsForNerdsChange}
                  disabled={isLoading}
                />
              </div>

              {/* Font Selection */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="space-y-0.5">
                        <Label className="font-medium text-base text-foreground/80">
                          Main Text Font
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Used in general text throughout the app.
                        </p>
                      </div>
                      <Select
                        value={mainFont}
                        onValueChange={handleMainFontChange}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-full bg-chat-input-background/80 border-chat-border/60 text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">
                            Inter{" "}
                            <span className="text-xs text-muted-foreground">
                              (default)
                            </span>
                          </SelectItem>
                          <SelectItem value="Proxima Vara">
                            Proxima Vara
                          </SelectItem>
                          <SelectItem value="System Font">
                            System Font
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <div className="space-y-0.5">
                        <Label className="font-medium text-base text-foreground/80">
                          Code Font
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Used in code blocks and inline code in chat messages.
                        </p>
                      </div>
                      <Select
                        value={codeFont}
                        onValueChange={handleCodeFontChange}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-full bg-chat-input-background/80 border-chat-border/60 text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mono">
                            System Monospace Font
                          </SelectItem>
                          <SelectItem value="fira">Fira Code</SelectItem>
                          <SelectItem value="jetbrains">
                            JetBrains Mono
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Font Preview */}
                  <div>
                    <h3 className="text-base font-medium text-foreground/80 mb-4">
                      Fonts Preview
                    </h3>
                    <div className="rounded-lg border border-dashed border-input p-4 bg-gradient-chat-overlay/30">
                      <div className="space-y-4">
                        {/* User message */}
                        <div className="flex justify-end">
                          <div className="group relative inline-block max-w-[80%] break-words rounded-xl border border-secondary/50 bg-secondary/50 px-4 py-3 text-left text-foreground">
                            Can you write me a simple hello world program?
                          </div>
                        </div>

                        {/* Assistant message */}
                        <div className="mb-2 mt-4">
                          <div className="max-w-[80%] text-foreground">
                            Sure, here you go:
                          </div>
                        </div>

                        {/* Code block */}
                        <div className="relative flex w-full flex-col">
                          <div className="rounded-t bg-secondary px-4 py-2 text-sm text-secondary-foreground">
                            <span className="font-mono">typescript</span>
                          </div>
                          <div className="bg-chat-accent text-sm text-secondary-foreground rounded-b p-4">
                            <pre className="font-mono text-sm">
                              {`function greet(name: string) {
  console.log(\`Hello, \${name}!\`);
  return true;
}`}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </CustomizationBackground>
  );
}
