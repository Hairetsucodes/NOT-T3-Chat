export default function Footer() {
  return (
    <footer className="border-t border-border bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-muted-foreground">
              Free & Open Source Clone
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            This is a free, open-source clone of{" "}
            <a 
              href="https://t3.chat" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:underline"
            >
              t3.chat
            </a>
            . If you don&apos;t have your own API keys and want a similar experience with no setup required, 
            t3.chat is available for just $8 and includes built-in credits.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-muted-foreground">
            <span>💡 This version requires your own API keys</span>
            <span className="hidden sm:inline">•</span>
            <a 
              href="https://github.com/Hairetsucodes/NOT-T3-Chat" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium hover:text-foreground transition-colors"
            >
              📁 View on GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
} 