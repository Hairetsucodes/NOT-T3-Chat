import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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

export function HistoryTab() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle>History & Sync</CardTitle>
        <CardDescription>
          Manage your chat history and synchronization settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-6 min-h-0">
        <div className="flex items-center space-x-2">
          <Switch id="save-history" />
          <Label htmlFor="save-history">Save chat history</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="sync-devices" />
          <Label htmlFor="sync-devices">Sync across devices</Label>
        </div>
        <div className="grid gap-3">
          <Label htmlFor="retention">History retention period</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select retention period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1week">1 Week</SelectItem>
              <SelectItem value="1month">1 Month</SelectItem>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
              <SelectItem value="forever">Forever</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Export & Import</Label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Export History
            </Button>
            <Button variant="outline" size="sm">
              Import History
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-destructive">Danger Zone</Label>
          <Button variant="destructive" size="sm">
            Clear All History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 