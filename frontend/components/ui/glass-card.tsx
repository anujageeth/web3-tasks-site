"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  withBorder?: boolean;
  highlight?: boolean;
}

export const GlassCard = ({
  children,
  className,
  animate = false,
  withBorder = true,
  highlight = false,
}: GlassCardProps) => {
  return (
    <motion.div
      className={cn(
        "backdrop-blur-md bg-black/30 rounded-[32px] overflow-hidden",
        withBorder && "glass-border", 
        highlight && "shimmer-border",
        className
      )}
      initial={animate ? { opacity: 0, y: 20 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={animate ? { duration: 0.5 } : undefined}
      whileHover={animate ? { y: -5 } : undefined}
    >
      <div className="p-6 relative z-10">
        {children}
      </div>
    </motion.div>
  );
};