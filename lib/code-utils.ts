/**
 * Language normalization and code block utilities for chat message rendering
 */

// Language alias mapping to supported Shiki languages
export const LANGUAGE_ALIASES: { [key: string]: string } = {
  // JavaScript variants
  js: 'javascript',
  
  // TypeScript variants  
  ts: 'typescript',
  
  // Python variants
  py: 'python',
  
  // C/C++ variants
  'c++': 'cpp',
  
  // Shell variants
  sh: 'shell',
  zsh: 'shell',
  fish: 'shell',
  
  // Other common aliases
  yml: 'yaml',
  md: 'markdown',
  dockerfile: 'docker',
  
  // Fallbacks for unsupported languages
  cs: 'javascript', // C# fallback to JavaScript for syntax similarity
  csharp: 'javascript',
  rb: 'python', // Ruby fallback to Python for syntax similarity  
  ruby: 'python',
  rs: 'javascript', // Rust fallback to JavaScript
  rust: 'javascript',
  kt: 'javascript', // Kotlin fallback to JavaScript
  kotlin: 'javascript',
  swift: 'javascript', // Swift fallback to JavaScript
  go: 'javascript', // Go fallback to JavaScript
  
  // Text fallbacks
  text: 'txt',
  plaintext: 'txt',
  plain: 'txt',
};

// Language display mapping - comprehensive with fallbacks for aliases
export const LANGUAGE_DISPLAY_MAP: { [key: string]: string } = {
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript", 
  typescript: "TypeScript",
  jsx: "React JSX",
  tsx: "React TSX",
  py: "Python",
  python: "Python",
  java: "Java",
  cpp: "C++",
  c: "C",
  cs: "C#",
  csharp: "C#",
  php: "PHP",
  rb: "Ruby",
  ruby: "Ruby", 
  go: "Go",
  rs: "Rust",
  rust: "Rust",
  kt: "Kotlin", 
  kotlin: "Kotlin",
  swift: "Swift",
  sh: "Shell",
  shell: "Shell",
  bash: "Bash",
  sql: "SQL",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  sass: "Sass",
  json: "JSON",
  xml: "XML",
  yaml: "YAML",
  yml: "YAML",
  md: "Markdown", 
  markdown: "Markdown",
  dockerfile: "Dockerfile",
  docker: "Dockerfile",
  text: "Plain Text",
  txt: "Plain Text",
  plaintext: "Plain Text",
};

/**
 * Normalize language string to supported Shiki language
 */
export const normalizeLanguage = (lang: string): string => {
  const normalized = lang.toLowerCase().trim();
  return LANGUAGE_ALIASES[normalized] || normalized;
};

/**
 * Get display name for a language
 */
export const getLanguageDisplayName = (language: string): string => {
  return LANGUAGE_DISPLAY_MAP[language.toLowerCase()] || language.toUpperCase();
};

/**
 * Detect if text contains an incomplete code block (streaming scenario)
 * Uses sliding window approach to find the last occurrence of ```
 */
export const detectIncompleteCodeBlock = (text: string): boolean => {
  // Find the last occurrence of ``` in the text
  const lastTripleBacktick = text.lastIndexOf("```");

  if (lastTripleBacktick === -1) {
    return false; // No code blocks at all
  }

  // Get everything after the last ```
  const afterLastMarker = text.slice(lastTripleBacktick + 3);

  // Check if we're in an incomplete code block by looking for another ``` after the last one
  const hasClosingMarker = afterLastMarker.includes("```");

  // If no closing marker found after the last opening marker, we're in an incomplete block
  return !hasClosingMarker;
};

/**
 * Extract incomplete code block information from text
 */
export const extractIncompleteCodeBlock = (text: string): {
  beforeIncomplete: string;
  language: string;
  code: string;
} | null => {
  const lastCodeBlockStart = text.lastIndexOf("```");
  
  if (lastCodeBlockStart === -1) {
    return null;
  }

  const beforeIncomplete = text.slice(0, lastCodeBlockStart).trim();
  const incompleteBlock = text.slice(lastCodeBlockStart);
  const match = incompleteBlock.match(/```(\w+)?(?:\n)?([\s\S]*)/);

  if (!match) {
    return null;
  }

  return {
    beforeIncomplete,
    language: match[1] || "text",
    code: match[2] || "",
  };
}; 