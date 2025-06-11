import { createHighlighter, Highlighter } from "shiki";

// Singleton highlighter instance
class ShikiHighlighterSingleton {
  private static instance: ShikiHighlighterSingleton;
  private highlighter: Highlighter | null = null;
  private initializationPromise: Promise<Highlighter> | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): ShikiHighlighterSingleton {
    if (!ShikiHighlighterSingleton.instance) {
      ShikiHighlighterSingleton.instance = new ShikiHighlighterSingleton();
    }
    return ShikiHighlighterSingleton.instance;
  }

  public async getHighlighter(): Promise<Highlighter> {
    if (this.isInitialized && this.highlighter) {
      return this.highlighter;
    }

    if (!this.initializationPromise) {
      this.initializationPromise = this.initializeShiki();
    }

    return this.initializationPromise;
  }

  private async initializeShiki(): Promise<Highlighter> {
    try {
      if (this.highlighter && this.isInitialized) {
        return this.highlighter;
      }

      this.highlighter = await createHighlighter({
        themes: [
          "github-light",
          "github-dark",
          "github-dark-dimmed",
          "github-dark-high-contrast",
        ],
        langs: [
          "javascript",
          "typescript",
          "python",
          "html",
          "css",
          "json",
          "bash",
          "java",
          "c",
          "cpp",
          "csharp",
          "go",
          "rust",
          "ruby",
          "php",
          "swift",
          "kotlin",
          "sql",
          "yaml",
          "xml",
          "markdown",
          "shell",
          "dockerfile",
          "powershell",
          "plaintext",
        ],
      });

      this.isInitialized = true;
      return this.highlighter;
    } catch (error) {
      console.error("Failed to initialize Shiki highlighter:", error);
      this.initializationPromise = null; // Reset to allow retry
      throw error;
    }
  }

  public dispose(): void {
    if (this.highlighter) {
      this.highlighter.dispose();
      this.highlighter = null;
      this.isInitialized = false;
      this.initializationPromise = null;
    }
  }
}

// Function to fix light colors for better contrast
function fixLightColors(html: string): string {
  // Simple replacements for common light colors
  return html
    .replace(/color:\s*#ffffff/gi, "color: #1a1a1a")
    .replace(/color:\s*#fff/gi, "color: #1a1a1a")
    .replace(/color:\s*white/gi, "color: #1a1a1a")
    .replace(/color:\s*#fafafa/gi, "color: #2a2a2a")
    .replace(/color:\s*#f5f5f5/gi, "color: #2a2a2a")
    .replace(/color:\s*#f0f0f0/gi, "color: #3a3a3a");
}

// Export singleton instance
const shikiSingleton = ShikiHighlighterSingleton.getInstance();

export async function highlightCode(
  code: string,
  language: string,
  isDark: boolean = true
): Promise<string> {
  if (language === "math") {
    language = "python";
  }

  try {
    const highlighter = await shikiSingleton.getHighlighter();

    if (!highlighter) {
      console.error("Shiki highlighter failed to initialize");
      return `<pre><code>${escapeHtml(code)}</code></pre>`;
    }

    // Use plaintext as fallback for unsupported languages
    const lang = language.toLowerCase();
    const loadedLanguages = highlighter.getLoadedLanguages();
    const supportedLang = loadedLanguages.includes(lang) ? lang : "plaintext";

    // Select theme based on passed parameter
    const theme = isDark ? "github-dark-high-contrast" : "github-light";

    let html = highlighter.codeToHtml(code, {
      lang: supportedLang,
      theme: theme,
    });

    // Remove background styles from the generated HTML to let our CSS handle it
    html = html.replace(/style="[^"]*background[^"]*"/g, "");

    // Fix light colors in light mode
    if (!isDark) {
      html = fixLightColors(html);
    }

    return html;
  } catch (error) {
    console.error("Error highlighting code:", error);
    return `<pre><code>${escapeHtml(code)}</code></pre>`;
  }
}

// Export dispose function for cleanup if needed
export function disposeHighlighter(): void {
  shikiSingleton.dispose();
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
