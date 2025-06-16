"use client";

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
import { useState } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, Github } from "lucide-react";

interface BugReportData {
  type: string;
  title: string;
  description: string;
  priority: string;
  includeLogs: boolean;
}

export function BugReportTab() {
  const [formData, setFormData] = useState<BugReportData>({
    type: "",
    title: "",
    description: "",
    priority: "",
    includeLogs: false,
  });

  const [attachments, setAttachments] = useState<File[]>([]);

  const githubRepoUrl = "https://github.com/Hairetsucodes/OSS-T3-Chat";

  const generateGitHubIssueTemplate = (): string => {
    let template = `## ${
      formData.type.charAt(0).toUpperCase() + formData.type.slice(1)
    }: ${formData.title}

### Description
${formData.description || "Please provide a detailed description of the issue."}

### Priority
${
  formData.priority
    ? formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)
    : "Not specified"
}

### Environment
- **App Version**: OSS-T3-Chat v0.1.0
- **Browser**: ${navigator.userAgent}
- **OS**: ${navigator.platform}
- **Timestamp**: ${new Date().toISOString()}`;

    if (formData.includeLogs) {
      template += `

### Diagnostic Information
Please check the browser console for any error messages and include them here.
- Open Developer Tools (F12)
- Check Console tab for errors
- Include any relevant error messages below

\`\`\`
[Paste any console errors here...]
\`\`\``;
    }

    if (attachments.length > 0) {
      template += `

### Attachments
The following files were selected for upload:
${attachments.map((file) => `- ${file.name} (${file.size} bytes)`).join("\n")}

*Note: Please attach these files manually after creating the issue.*`;
    }

    template += `

### Additional Context
Add any other context about the problem here.

---
*This issue was generated using the OSS-T3-Chat bug report form.*`;

    return template;
  };

  const copyToClipboard = async () => {
    if (!formData.title.trim()) {
      toast.error("Please provide a title for the issue");
      return;
    }

    try {
      const template = generateGitHubIssueTemplate();
      await navigator.clipboard.writeText(template);
      toast.success(
        "Issue template copied to clipboard! You can now paste it into a new GitHub issue."
      );
    } catch (error) {
      toast.error("Failed to copy to clipboard");
      console.error("Copy failed:", error);
    }
  };

  const openGitHubIssue = () => {
    if (!formData.title.trim()) {
      toast.error("Please provide a title for the issue");
      return;
    }

    const template = generateGitHubIssueTemplate();
    const issueTitle = `${
      formData.type ? `[${formData.type.toUpperCase()}] ` : ""
    }${formData.title}`;

    // GitHub URL parameters for pre-filling issue
    const params = new URLSearchParams({
      title: issueTitle,
      body: template,
    });

    // Add labels based on type and priority
    const labels = [];
    if (formData.type) {
      const typeLabels: Record<string, string> = {
        bug: "bug",
        feature: "enhancement",
        performance: "performance",
        ui: "ui/ux",
        other: "question",
      };
      if (typeLabels[formData.type]) {
        labels.push(typeLabels[formData.type]);
      }
    }

    if (formData.priority) {
      labels.push(`priority: ${formData.priority}`);
    }

    if (labels.length > 0) {
      params.append("labels", labels.join(","));
    }

    const url = `${githubRepoUrl}/issues/new?${params.toString()}`;
    window.open(url, "_blank");

    toast.success("Opening GitHub issue page...");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(files);

    if (files.length > 0) {
      toast.success(
        `${files.length} file(s) selected. These will be mentioned in the GitHub issue.`
      );
    }
  };

  const clearForm = () => {
    setFormData({
      type: "",
      title: "",
      description: "",
      priority: "",
      includeLogs: false,
    });
    setAttachments([]);
    toast.success("Form cleared");
  };

  return (
    <Card className="h-full flex flex-col bg-chat-background rounded-lg border-chat-border/50">
      <CardHeader className="flex-shrink-0 pb-2">
        <CardTitle className="text-foreground/90 text-xl flex items-center gap-2">
          <Github className="h-5 w-5" />
          Bug Reports
        </CardTitle>
        <CardDescription className="text-foreground/70">
          Report issues or provide feedback. Your report will be formatted for
          GitHub issues.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-6 min-h-0">
        <div className="grid gap-3">
          <Label htmlFor="bug-type">Issue Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value })}
          >
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
          <Label htmlFor="bug-title">Title *</Label>
          <Input
            id="bug-title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Brief description of the issue"
            className="rounded-lg border-[.1rem] border-chat-border p-2"
          />
        </div>

        <div className="grid gap-3">
          <Label htmlFor="bug-description">Description</Label>
          <Textarea
            id="bug-description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Detailed description of the issue, steps to reproduce, expected vs actual behavior..."
            className="min-h-[120px] rounded-lg border-[.1rem] border-chat-border p-2"
          />
        </div>

        <div className="grid gap-3">
          <Label htmlFor="bug-priority">Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) =>
              setFormData({ ...formData, priority: value })
            }
          >
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
          <Switch
            id="include-logs"
            checked={formData.includeLogs}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, includeLogs: checked })
            }
          />
          <Label htmlFor="include-logs">
            Include diagnostic information template
          </Label>
        </div>

        <div className="space-y-2">
          <Label>Attach Screenshots/Files</Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Select files to mention in the GitHub issue
            </p>
            <input
              type="file"
              multiple
              accept="image/*,.txt,.log,.json"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              Choose Files
            </Button>
            {attachments.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                {attachments.length} file(s) selected
              </div>
            )}
          </div>
        </div>

        {formData.title && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <Label className="text-sm font-medium mb-2 block">Preview</Label>
            <div className="text-sm">
              <strong>Title:</strong>{" "}
              {formData.type ? `[${formData.type.toUpperCase()}] ` : ""}
              {formData.title}
            </div>
            {formData.description && (
              <div className="text-sm mt-1">
                <strong>Description:</strong>{" "}
                {formData.description.substring(0, 100)}
                {formData.description.length > 100 && "..."}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-shrink-0 gap-2 flex-wrap">
        <Button
          onClick={openGitHubIssue}
          className="flex items-center gap-2"
          disabled={!formData.title.trim()}
          variant="ghost"
        >
          <ExternalLink className="h-4 w-4" />
          Submit to GitHub
        </Button>

        <Button
          variant="outline"
          onClick={copyToClipboard}
          disabled={!formData.title.trim()}
          className="flex items-center gap-2"
        >
          <Copy className="h-4 w-4" />
          Copy Template
        </Button>

        <Button variant="outline" onClick={clearForm} className="ml-auto">
          Clear Form
        </Button>
      </CardFooter>
    </Card>
  );
}
