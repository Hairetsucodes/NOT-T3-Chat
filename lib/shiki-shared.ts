import type { JSX } from "react";
import type { BundledLanguage } from "shiki/bundle/web";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { Fragment } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { codeToHast } from "shiki/bundle/web";
import type { HTMLAttributes } from "react";

export async function highlight(code: string, lang: BundledLanguage) {
  const out = await codeToHast(code, {
    lang,
    theme: "github-dark",
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
}
