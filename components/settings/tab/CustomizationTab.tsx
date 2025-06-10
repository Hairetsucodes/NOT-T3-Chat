import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

export function CustomizationTab() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Customization</CardTitle>
        <CardDescription>
          Personalize your chat experience with themes and preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-6 min-h-0">
        <div className="grid gap-3">
          <Label htmlFor="theme">Theme</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-3">
          <Label htmlFor="font-size">Font Size</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select font size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="compact-mode" />
          <Label htmlFor="compact-mode">Compact mode</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="show-timestamps" />
          <Label htmlFor="show-timestamps">
            Show message timestamps
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="typing-indicators" />
          <Label htmlFor="typing-indicators">
            Show typing indicators
          </Label>
        </div>
      </CardContent>
      <CardFooter className="flex-shrink-0">
        <Button>Save Preferences</Button>
      </CardFooter>
    </Card>
  );
} 