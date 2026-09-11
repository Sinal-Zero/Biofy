import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-semibold transition-[transform,background-color,border-color,color,box-shadow,filter] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 motion-reduce:transform-none motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-primary/80 bg-primary text-primary-foreground shadow-sm hover:bg-primary/94 hover:border-primary",
        destructive:
          "border border-destructive/80 bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/92",
        outline:
          "border border-border/90 bg-background/30 text-foreground hover:border-foreground/16 hover:bg-accent/55 hover:text-accent-foreground",
        secondary:
          "border border-border/75 bg-secondary/85 text-secondary-foreground hover:bg-secondary",
        ghost: "text-muted-foreground hover:bg-accent/55 hover:text-foreground",
        link: "rounded-none text-primary underline-offset-4 hover:underline active:scale-100",
        hero:
          "border border-primary/80 bg-primary text-primary-foreground shadow-sm hover:bg-primary/94 hover:border-primary",
        soft: "border border-border/80 bg-surface-2/65 text-foreground hover:bg-accent/60",
        success:
          "border border-success/80 bg-success text-success-foreground hover:brightness-[1.03]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-[9px] px-3 text-xs",
        lg: "h-11 px-5 text-[0.94rem] sm:px-6",
        xl: "h-12 px-6 text-base sm:px-7",
        icon: "h-10 w-10",
        "icon-sm": "h-9 w-9 rounded-[9px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
