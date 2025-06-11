import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

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
        <div className="space-y-2">
          <Label>Current Attachments</Label>
          <div className="p-4 border rounded-lg text-center">
            <span className="text-sm text-muted-foreground">
              No current attachments
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
