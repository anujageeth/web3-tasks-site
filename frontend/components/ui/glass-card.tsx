"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlowingBorder } from "./glowing-border";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  withBorder?: boolean;
  highlight?: boolean;
  glowOnHover?: boolean;
}

export const GlassCard = ({
  children,
  className,
  animate = false,
  withBorder = true,
  highlight = false,
  glowOnHover = true,
}: GlassCardProps) => {
  const cardContent = (
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
      <div className="p-6 relative z-10">{children}</div>
    </motion.div>
  );

  if (glowOnHover) {
    return (
      <GlowingBorder
        glowColor="rgba(74, 222, 128, 0.4)"
        glowSize={20}
        borderRadius="32px"
      >
        {cardContent}
      </GlowingBorder>
    );
  }

  return cardContent;
};