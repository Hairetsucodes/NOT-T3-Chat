import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import type { Root, Element } from "hast";
import { visit } from "unist-util-visit";

export async function processMarkdown(text: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(() => (tree: Root) => {
      // Transform links to open in new window
      visit(tree, "element", (node: Element) => {
        if (node.tagName === "a" && node.properties?.href) {
          node.properties.target = "_blank";
          node.properties.rel = "noopener noreferrer";
        }
      });
      return tree;
    })
    .use(rehypeStringify)
    .process(text);

  return String(result);
}
