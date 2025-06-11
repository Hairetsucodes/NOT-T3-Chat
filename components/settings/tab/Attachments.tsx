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

export function AttachmentsTab() {
  return (
    <Card className="h-full flex flex-col bg-chat-background">
      <CardHeader className="flex-shrink-0 pb-2">
        <CardTitle className="text-foreground/90 text-xl">
          Attachments
        </CardTitle>
        <CardDescription className="text-foreground/70">
          Configure file upload and attachment settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-6 min-h-0">
        <div className="grid gap-3">
          <Label htmlFor="max-file-size">Maximum file size (MB)</Label>
          <Input
            id="max-file-size"
            type="number"
            min="1"
            max="100"
            defaultValue="10"
          />
        </div>
        <div className="space-y-2">
          <Label>Allowed file types</Label>
          <div className="flex flex-wrap gap-2">
            {["PDF", "DOC", "TXT", "PNG", "JPG", "GIF"].map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Switch id={`type-${type.toLowerCase()}`} />
                <Label htmlFor={`type-${type.toLowerCase()}`}>{type}</Label>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="auto-analyze" />
          <Label htmlFor="auto-analyze">Auto-analyze uploaded files</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="compress-images" />
          <Label htmlFor="compress-images">Compress images before upload</Label>
        </div>
        <div className="space-y-2">
          <Label>Storage Usage</Label>
          <div className="p-4 border rounded-lg">
            <div className="flex justify-between">
              <span className="text-sm">Used:</span>
              <span className="text-sm font-mono">256 MB / 1 GB</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 mt-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: "25%" }}
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-shrink-0">
        <Button>Save Attachment Settings</Button>
      </CardFooter>
    </Card>
  );
}
