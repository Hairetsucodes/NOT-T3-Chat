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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function BugReportTab() {
  return (
    <Card className="h-full flex flex-col bg-chat-background rounded-lg border-chat-border/50">
      <CardHeader className="flex-shrink-0 pb-2">
        <CardTitle className="text-foreground/90 text-xl">
          Bug Reports
        </CardTitle>
        <CardDescription className="text-foreground/70">
          Report issues or provide feedback about the application.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-6 min-h-0">
        <div className="grid gap-3">
          <Label htmlFor="bug-type">Issue Type</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select issue type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bug">Bug Report</SelectItem>
              <SelectItem value="feature">Feature Request</SelectItem>
              <SelectItem value="performance">Performance Issue</SelectItem>
              <SelectItem value="ui">UI/UX Issue</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-3">
          <Label htmlFor="bug-title">Title</Label>
          <Input id="bug-title" placeholder="Brief description of the issue" />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="bug-description">Description</Label>
          <Textarea
            id="bug-description"
            placeholder="Detailed description of the issue, steps to reproduce, expected vs actual behavior..."
            className="min-h-[120px]"
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="bug-priority">Priority</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="include-logs" />
          <Label htmlFor="include-logs">Include diagnostic information</Label>
        </div>
        <div className="space-y-2">
          <Label>Attach Screenshots</Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Drag and drop files here or click to browse
            </p>
            <Button variant="outline" size="sm" className="mt-2">
              Choose Files
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-shrink-0">
        <Button>Submit Report</Button>
      </CardFooter>
    </Card>
  );
}
