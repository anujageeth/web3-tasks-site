"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const buttonVariants = tv({
  base: "relative inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  variants: {
    variant: {
      primary: "bg-light-green text-black hover:bg-opacity-90 shadow-md",
      secondary: "bg-rgba(255,255,255,0.1) text-white border border-border hover:bg-white/20",
      outline: "border border-light-green bg-transparent text-light-green hover:bg-light-green/10",
      ghost: "bg-transparent text-white hover:bg-white/10",
      danger: "bg-red-500/15 text-red-500 border border-red-500/30 hover:bg-red-500/25",
      accent: "bg-accent-yellow text-black hover:bg-opacity-90 shadow-md",
    },
    size: {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 py-2",
      lg: "h-12 px-6 text-lg",
    },
    glowing: {
      true: "animate-pulse",
      false: "",
    },
    gradient: {
      true: "bg-gradient-to-r from-light-green to-dark-green text-white border-0",
      false: "",
    },
  },
  compoundVariants: [
    {
      gradient: true,
      variant: "primary",
      className: "from-light-green to-dark-green text-white",
    },
    {
      gradient: true,
      variant: "accent",
      className: "from-accent-yellow to-yellow-600 text-black",
    },
  ],
  defaultVariants: {
    variant: "primary",
    size: "md",
    glowing: false,
    gradient: false,
  },
});

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  animate?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, glowing, gradient, animate = false, ...props }, ref) => {
    const Component = animate ? motion.button : "button";
    
    return (
      <Component
        ref={ref}
        className={cn(buttonVariants({ variant, size, glowing, gradient, className }))}
        {...(animate && {
          whileHover: { scale: 1.02 },
          whileTap: { scale: 0.98 },
        })}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };