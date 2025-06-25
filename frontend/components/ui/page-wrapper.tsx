"use client";

import React, { useEffect, useRef } from "react";
import { useMotionValue, useSpring, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const PageWrapper = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 70 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate mouse position relative to center of element
        mouseX.set(e.clientX - centerX);
        mouseY.set(e.clientY - centerY);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [mouseX, mouseY]);

  return (
    <div
      ref={ref}
      className={cn("relative min-h-screen", className)}
    >
      <motion.div
        className="pointer-events-none fixed inset-0 z-[-1]"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgb(18, 142, 70, 0.3), rgba(10, 10, 10, 0) 60%)`,
          transform: "translate(-50%, -50%)",
          x,
          y,
          opacity: 0.6,
        }}
      />
      <div className="relative z-10 min-h-screen p-8">{children}</div>
    </div>
  );
};