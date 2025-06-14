export function ChatSkeleton() {
  return (
    <div className="flex flex-col w-full max-w-[770px] mx-auto px-4 py-8 space-y-6">
      {/* User message skeleton */}
      <div className="flex flex-col items-end">
        <div className="bg-muted animate-pulse rounded-lg p-4 max-w-[80%]">
          <div className="h-4 bg-muted-foreground/20 rounded mb-2 w-48"></div>
          <div className="h-4 bg-muted-foreground/20 rounded w-32"></div>
        </div>
      </div>

      {/* Assistant message skeleton */}
      <div className="flex flex-col items-start">
        <div className="bg-background border animate-pulse rounded-lg p-4 max-w-[80%]">
          <div className="h-4 bg-muted-foreground/20 rounded mb-2 w-64"></div>
          <div className="h-4 bg-muted-foreground/20 rounded mb-2 w-56"></div>
          <div className="h-4 bg-muted-foreground/20 rounded mb-2 w-48"></div>
          <div className="h-4 bg-muted-foreground/20 rounded w-40"></div>
        </div>
      </div>

      {/* Another user message skeleton */}
      <div className="flex flex-col items-end">
        <div className="bg-muted animate-pulse rounded-lg p-4 max-w-[80%]">
          <div className="h-4 bg-muted-foreground/20 rounded w-36"></div>
        </div>
      </div>

      {/* Loading assistant response */}
      <div className="flex flex-col items-start">
        <div className="bg-background border rounded-lg p-4 max-w-[80%]">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"></div>
            </div>
            <span className="text-sm text-muted-foreground">Thinking...</span>
          </div>
        </div>
      </div>
    </div>
  );
} 