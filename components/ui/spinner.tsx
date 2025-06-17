import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const spinnerVariants = cva(
  "inline-block",
  {
    variants: {
      variant: {
        default: "text-primary",
        muted: "text-muted-foreground",
        destructive: "text-destructive",
        secondary: "text-secondary-foreground",
      },
      size: {
        default: "h-4 w-4",
        sm: "h-3 w-3",
        lg: "h-6 w-6",
        xl: "h-8 w-8",
      },
      type: {
        spin: "animate-spin rounded-full border-2 border-solid border-current border-t-transparent",
        gradient: "animate-spin rounded-full spinner-gradient",
        pulse: "animate-pulse-glow rounded-full bg-current",
        bounce: "animate-bounce rounded-full bg-current",
        dots: "relative",
        bars: "relative",
        ripple: "relative",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      type: "spin",
    },
  }
);

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, variant, size, type, ...props }, ref) => {
    const renderSpinner = () => {
      switch (type) {
        case "dots":
          return (
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce-stagger [animation-delay:-0.32s]"></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce-stagger [animation-delay:-0.16s]"></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce-stagger"></div>
            </div>
          );
        
        case "bars":
          return (
            <div className="flex items-end justify-center space-x-0.5">
              <div className="w-1 h-6 bg-current animate-bar-scale [animation-delay:-0.4s]"></div>
              <div className="w-1 h-8 bg-current animate-bar-scale [animation-delay:-0.2s]"></div>
              <div className="w-1 h-4 bg-current animate-bar-scale [animation-delay:-0.1s]"></div>
              <div className="w-1 h-7 bg-current animate-bar-scale [animation-delay:-0.3s]"></div>
              <div className="w-1 h-5 bg-current animate-bar-scale [animation-delay:-0.15s]"></div>
            </div>
          );
        
        case "ripple":
          return (
            <div className="relative">
              <div className="absolute inset-0 rounded-full border-2 border-current animate-ripple-effect"></div>
              <div className="absolute inset-0 rounded-full border-2 border-current animate-ripple-effect [animation-delay:0.4s]"></div>
              <div className="w-full h-full rounded-full border-2 border-current opacity-20"></div>
            </div>
          );
        
        case "pulse":
        case "bounce":
        case "gradient":
        default:
          return null; // These are handled by the base className
      }
    };

    const content = renderSpinner();
    
    if (content) {
      return (
        <div
          ref={ref}
          className={cn(spinnerVariants({ variant, size, type: "dots", className }))}
          role="status"
          aria-label="Loading"
          {...props}
        >
          {content}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(spinnerVariants({ variant, size, type, className }))}
        role="status"
        aria-label="Loading"
        {...props}
      />
    );
  }
);

Spinner.displayName = "Spinner";

export { Spinner, spinnerVariants }; 