import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ShareDialog({
  isPublic,
  shareUrl,
  handleCopyLink,
  copied,
  togglePublic,
}: {
  isPublic: boolean;
  shareUrl: string;
  handleCopyLink: () => void;
  copied: boolean;
  togglePublic: (makePublic: boolean) => void;
}) {
  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className={`text-xs h-auto gap-2 rounded-full border border-solid border-secondary-foreground/10 px-2 py-1.5 pr-2.5 text-muted-foreground max-sm:p-2 ${
                isPublic
                  ? "border-primary bg-primary text-primary-foreground"
                  : ""
              }`}
              aria-label="Share chat"
              type="button"
            >
              <Share2 className="size-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Share chat</p>
        </TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Share2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Share Chat</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {isPublic
                  ? "This conversation is publicly accessible"
                  : "Share this conversation with others"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isPublic ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    Public Link Active
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Anyone with this link can view the conversation. They
                  won&apos;t be able to edit or continue the chat.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Share Link</label>
                <div className="flex items-center gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handleCopyLink}
                    className={`shrink-0 min-w-[80px] transition-all duration-200 ${
                      copied ? "bg-green-600 hover:bg-green-700" : ""
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-dashed border-muted-foreground/25 p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4 mx-auto">
                  <Share2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Make Chat Public</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate a shareable link that allows others to view this
                  conversation. The chat will be read-only for visitors.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <div className="h-1 w-1 rounded-full bg-muted-foreground"></div>
                  <span>View only access</span>
                  <div className="h-1 w-1 rounded-full bg-muted-foreground"></div>
                  <span>No editing allowed</span>
                  <div className="h-1 w-1 rounded-full bg-muted-foreground"></div>
                  <span>Link-based sharing</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {!isPublic ? (
            <Button onClick={() => togglePublic(true)} className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Make Public & Generate Link
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => togglePublic(false)}
              className="flex-1"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Make Private
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
