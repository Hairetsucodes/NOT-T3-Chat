import type { JSX } from "react";
import type { BundledLanguage, Highlighter } from "shiki/bundle/web";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { Fragment } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { createHighlighter } from "shiki/bundle/web";
import type { HTMLAttributes } from "react";

// Most commonly used languages in chat applications
const PRELOADED_LANGUAGES: BundledLanguage[] = [
  'javascript',
  'typescript',
  'jsx',
  'tsx',
  'python',
  'java',
  'cpp',
  'c',
  'php',
  'shell',
  'bash',
  'sql',
  'html',
  'css',
  'scss',
  'json',
  'xml',
  'yaml',
  'markdown'
];

// Global highlighter instance - defined without await for immediate reference
let highlighterInstance: Highlighter | null = null;
let highlighterPromise: Promise<Highlighter> | null = null;

// Initialize the highlighter with preloaded languages and themes
function getHighlighter(): Promise<Highlighter> {
  if (highlighterInstance) {
    return Promise.resolve(highlighterInstance);
  }

  if (highlighterPromise) {
    return highlighterPromise;
  }

  highlighterPromise = createHighlighter({
    themes: ['github-dark'],
    langs: PRELOADED_LANGUAGES,
  }).then((highlighter) => {
    highlighterInstance = highlighter;
    return highlighter;
  });

  return highlighterPromise;
}

// Optimized highlight function using the shared highlighter instance
export async function highlight(code: string, lang: BundledLanguage): Promise<JSX.Element> {
  try {
    const highlighter = await getHighlighter();
    
    // Check if the language is loaded, if not, load it dynamically
    const loadedLanguages = highlighter.getLoadedLanguages();
    if (!loadedLanguages.includes(lang)) {
      await highlighter.loadLanguage(lang);
    }

    const out = highlighter.codeToHast(code, {
      lang,
      theme: 'github-dark',
    });

    return toJsxRuntime(out, {
      Fragment,
      jsx,
      jsxs,
      components: {
        // Custom pre element that inherits the theme's bg-sidebar color
        pre: (props: HTMLAttributes<HTMLPreElement>) =>
          jsx("pre", {
            ...props,
            className: `${props.className || ""} !bg-transparent`.trim(),
            style: { ...props.style, backgroundColor: "transparent" },
          }),
        // Custom code element that also inherits transparent background
        code: (props: HTMLAttributes<HTMLElement>) =>
          jsx("code", {
            ...props,
            className: `${props.className || ""} !bg-transparent`.trim(),
            style: {
              ...props.style,
              backgroundColor: "transparent",
              border: "none",
            },
          }),
      },
    }) as JSX.Element;
  } catch (error) {
    console.error('Shiki highlighting error:', error);
    // Fallback to plain code on error
    return jsx("code", { children: code });
  }
}

// Preload the highlighter on module load for better performance
if (typeof window !== 'undefined') {
  // Client-side: start loading immediately
  getHighlighter().catch(console.error);
}

// Export the highlighter getter for advanced usage
export { getHighlighter };
