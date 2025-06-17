export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full w-full max-w-[770px] mx-auto">
      {/* Chat Header Skeleton */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted animate-pulse rounded-full"></div>
          <div className="h-5 bg-muted animate-pulse rounded w-32"></div>
        </div>
        <div className="flex space-x-2">
          <div className="w-8 h-8 bg-muted animate-pulse rounded"></div>
          <div className="w-8 h-8 bg-muted animate-pulse rounded"></div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-hidden px-4 py-6">
        <div className="space-y-6">
          {/* Assistant message skeleton */}
          <div className="flex flex-col items-start">
            <div className="bg-background border animate-pulse rounded-lg p-4 max-w-[85%]">
              <div className="h-4 bg-muted-foreground/20 rounded mb-2 w-72"></div>
              <div className="h-4 bg-muted-foreground/20 rounded mb-2 w-64"></div>
              <div className="h-4 bg-muted-foreground/20 rounded mb-2 w-56"></div>
              <div className="h-4 bg-muted-foreground/20 rounded w-40"></div>
            </div>
          </div>

          {/* User message skeleton */}
          <div className="flex flex-col items-end">
            <div className="bg-primary/10 animate-pulse rounded-lg p-4 max-w-[80%]">
              <div className="h-4 bg-muted-foreground/20 rounded mb-2 w-48"></div>
              <div className="h-4 bg-muted-foreground/20 rounded w-32"></div>
            </div>
          </div>

          {/* Long assistant message skeleton */}
          <div className="flex flex-col items-start">
            <div className="bg-background border animate-pulse rounded-lg p-4 max-w-[85%]">
              <div className="h-4 bg-muted-foreground/20 rounded mb-2 w-80"></div>
              <div className="h-4 bg-muted-foreground/20 rounded mb-2 w-72"></div>
              <div className="h-4 bg-muted-foreground/20 rounded mb-2 w-68"></div>
              <div className="h-4 bg-muted-foreground/20 rounded mb-2 w-64"></div>
              <div className="h-4 bg-muted-foreground/20 rounded mb-2 w-56"></div>
              <div className="h-4 bg-muted-foreground/20 rounded w-44"></div>
            </div>
          </div>

          {/* Short user message skeleton */}
          <div className="flex flex-col items-end">
            <div className="bg-primary/10 animate-pulse rounded-lg p-4 max-w-[60%]">
              <div className="h-4 bg-muted-foreground/20 rounded w-28"></div>
            </div>
          </div>

          {/* Code block skeleton */}
          <div className="flex flex-col items-start">
            <div className="bg-background border animate-pulse rounded-lg p-4 max-w-[90%] w-full">
              <div className="h-4 bg-muted-foreground/20 rounded mb-3 w-48"></div>
              <div className="bg-muted/50 rounded p-3 space-y-2">
                <div className="h-3 bg-muted-foreground/20 rounded w-64"></div>
                <div className="h-3 bg-muted-foreground/20 rounded w-56"></div>
                <div className="h-3 bg-muted-foreground/20 rounded w-72"></div>
                <div className="h-3 bg-muted-foreground/20 rounded w-48"></div>
              </div>
            </div>
          </div>

          {/* Currently typing/loading message */}
          <div className="flex flex-col items-start">
            <div className="bg-background border rounded-lg p-4 max-w-[85%]">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                </div>
                <span className="text-sm text-muted-foreground animate-pulse">
                  Loading conversation...
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Input Area Skeleton */}
      <div className="border-t p-4 space-y-3">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <div className="bg-muted animate-pulse rounded-lg h-12 w-full"></div>
          </div>
          <div className="bg-primary/20 animate-pulse rounded-lg h-12 w-12"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex space-x-4">
            <div className="h-4 bg-muted-foreground/20 animate-pulse rounded w-16"></div>
            <div className="h-4 bg-muted-foreground/20 animate-pulse rounded w-20"></div>
          </div>
          <div className="h-4 bg-muted-foreground/20 animate-pulse rounded w-24"></div>
        </div>
      </div>
    </div>
  );
}
