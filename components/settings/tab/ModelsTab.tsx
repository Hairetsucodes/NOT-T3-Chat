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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ModelsTab() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Models</CardTitle>
        <CardDescription>
          Configure AI models and their settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-6 min-h-0">
        <div className="grid gap-3">
          <Label htmlFor="default-model">Default Model</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select default model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4">GPT-4</SelectItem>
              <SelectItem value="gpt-3.5-turbo">
                GPT-3.5 Turbo
              </SelectItem>
              <SelectItem value="claude-3">Claude 3</SelectItem>
              <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-3">
          <Label htmlFor="temperature">Temperature</Label>
          <Input
            id="temperature"
            type="number"
            min="0"
            max="2"
            step="0.1"
            defaultValue="0.7"
          />
          <p className="text-sm text-muted-foreground">
            Controls randomness (0-2)
          </p>
        </div>
        <div className="grid gap-3">
          <Label htmlFor="max-tokens">Max Tokens</Label>
          <Input
            id="max-tokens"
            type="number"
            min="1"
            max="4096"
            defaultValue="2048"
          />
          <p className="text-sm text-muted-foreground">
            Maximum response length
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="stream-responses" />
          <Label htmlFor="stream-responses">Stream responses</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="show-model-info" />
          <Label htmlFor="show-model-info">
            Show model information in responses
          </Label>
        </div>
      </CardContent>
      <CardFooter className="flex-shrink-0">
        <Button>Save Model Settings</Button>
      </CardFooter>
    </Card>
  );
} 