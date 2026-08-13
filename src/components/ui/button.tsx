import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-semibold transition-[background-color,color,box-shadow,border-color] duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-cream min-h-11 px-5",
  {
    variants: {
      variant: {
        primary:
          "bg-navy text-cream hover:bg-navy-deep shadow-[0_8px_20px_rgba(11,31,58,0.12)]",
        accent: "bg-teal text-white hover:bg-[#0a6b63] shadow-[0_8px_20px_rgba(12,122,112,0.18)]",
        secondary:
          "border border-navy/15 bg-transparent text-navy hover:bg-navy/[0.04]",
        ghost: "text-navy hover:bg-navy/[0.05]",
        cream: "bg-cream text-navy hover:bg-white",
      },
      size: {
        default: "h-11",
        lg: "h-12 px-6 text-base",
        sm: "h-10 px-4 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
