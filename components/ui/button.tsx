import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-chat-background text-primary-foreground shadow-xs hover:bg-primary/90",
        chatMenu:
          " transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-muted/40 hover:text-foreground disabled:hover:bg-transparent disabled:hover:text-foreground/50 size-8 ",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        callToAction:
          "!transition-all !focus-visible:outline-none !focus-visible:ring-1 !focus-visible:ring-ring border-reflect button-reflect !rounded-lg bg-gradient-to-b from-[rgb(180,80,120)] via-[rgb(150,65,95)] to-[rgb(130,50,80)] !p-2 !font-semibold text-white !text-sm shadow-lg hover:shadow-xl hover:from-[rgb(200,100,140)] hover:via-[rgb(170,85,115)] hover:to-[rgb(150,70,100)] active:from-[rgb(130,50,80)] active:via-[rgb(110,35,65)] active:to-[rgb(95,25,55)] active:shadow-md disabled:hover:from-[rgb(180,80,120)] disabled:hover:via-[rgb(150,65,95)] disabled:hover:to-[rgb(130,50,80)] disabled:active:from-[rgb(180,80,120)] disabled:active:via-[rgb(150,65,95)] disabled:active:to-[rgb(130,50,80)] dark:from-pink-800/40 dark:via-pink-900/30 dark:to-pink-950/40 dark:border-pink-700/30 dark:hover:from-pink-700/50 dark:hover:via-pink-900/70 dark:hover:to-pink-950/60 dark:active:from-pink-900/30 dark:active:via-pink-950/40 dark:active:to-pink-950/50 disabled:dark:hover:from-pink-800/40 disabled:dark:hover:via-pink-900/30 disabled:dark:hover:to-pink-950/40 disabled:dark:active:from-pink-800/40 disabled:dark:active:via-pink-900/30 disabled:dark:active:to-pink-950/40 !h-8 !px-4 !py-2 w-full select-none disabled:cursor-not-allowed disabled:opacity-50",
      },
      size: {
        default: "h-8 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
