import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { getAttachments } from "@/data/attachments";
import { Attachment } from "@prisma/client";
import { Download, X } from "lucide-react";

export function AttachmentsTab() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<Attachment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        setLoading(true);
        const userAttachments = await getAttachments();
        // Filter for image files only since our API route handles images
        const imageAttachments = userAttachments.filter(attachment => 
          attachment.fileType.startsWith('image/')
        );
        setAttachments(imageAttachments);
      } catch (err) {
        setError('Failed to load attachments');
        console.error('Error fetching attachments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttachments();
  }, []);

  const openImageModal = (attachment: Attachment) => {
    setSelectedImage(attachment);
    setIsModalOpen(true);
  };

  const closeImageModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  const downloadImage = async (attachment: Attachment) => {
    try {
      const imageUrl = `/api/images/${attachment.userId}-${attachment.filename}`;
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  return (
    <>
      <Card className="h-full flex flex-col bg-chat-background">
        <CardHeader className="flex-shrink-0 pb-2">
          <CardTitle className="text-foreground/90 text-xl">
            Attachments
          </CardTitle>
          <CardDescription className="text-foreground/70">
            View and manage your uploaded images.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto space-y-6 min-h-0">
          <div className="space-y-2">
            <Label>Current Images</Label>
            {loading ? (
              <div className="p-4 border rounded-lg text-center">
                <span className="text-sm text-muted-foreground">
                  Loading attachments...
                </span>
              </div>
            ) : error ? (
              <div className="p-4 border rounded-lg text-center">
                <span className="text-sm text-red-500">
                  {error}
                </span>
              </div>
            ) : attachments.length === 0 ? (
              <div className="p-4 border rounded-lg text-center">
                <span className="text-sm text-muted-foreground">
                  No images uploaded yet
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="border rounded-lg p-2 hover:bg-muted/50 transition-colors"
                  >
                    <div 
                      className="aspect-square mb-2 overflow-hidden rounded border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => openImageModal(attachment)}
                    >
                      <img
                        src={`/api/images/${attachment.userId}-${attachment.filename}`}
                        alt={attachment.filename}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDMuMUwyLjkgMjEuMiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIGQ9Ik05IDlhMyAzIDAgMSAwIDMgM0w5IDl6bS0xLTFIMjFWNWEyIDIgMCAwIDAtMi0ySDVhMiAyIDAgMCAwLTIgMnYxNGEyIDIgMCAwIDAgMiAyaDExbC05LTlWOHoiLz4KPC9zdmc+';
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="truncate" title={attachment.filename}>
                        {attachment.filename}
                      </div>
                      <div>
                        {new Date(attachment.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 h-7 text-xs"
                      onClick={() => downloadImage(attachment)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Full-size image modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate">{selectedImage?.filename}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeImageModal}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4 pt-0">
            {selectedImage && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={`/api/images/${selectedImage.userId}-${selectedImage.filename}`}
                    alt={selectedImage.filename}
                    className="max-w-full max-h-[60vh] object-contain rounded border"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDMuMUwyLjkgMjEuMiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIGQ9Ik05IDlhMyAzIDAgMSAwIDMgM0w5IDl6bS0xLTFIMjFWNWEyIDIgMCAwIDAtMi0ySDVhMiAyIDAgMCAwLTIgMnYxNGEyIDIgMCAwIDAgMiAyaDExbC05LTlWOHoiLz4KPC9zdmc+';
                    }}
                  />
                </div>
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => downloadImage(selectedImage)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" onClick={closeImageModal}>
                    Close
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground text-center space-y-1">
                  <div>Filename: {selectedImage.filename}</div>
                  <div>Type: {selectedImage.fileType}</div>
                  <div>Uploaded: {new Date(selectedImage.createdAt).toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
