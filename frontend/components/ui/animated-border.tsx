"use client";
import { cn } from "@/lib/utils";
import React, { useState, useRef, useEffect } from "react";

interface AnimatedBorderProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  duration?: number;
  borderWidth?: number;
  borderGradient?: string;
  animate?: boolean;
  as?: React.ElementType;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const AnimatedBorder = ({
  children,
  className,
  containerClassName,
  duration = 8,
  borderWidth = 1,
  borderGradient = "linear-gradient(to right,rgb(0, 255, 94), #143d25)",
  animate = true,
  onClick,
  as: Tag = "div",
  onMouseEnter,
  onMouseLeave,
}: AnimatedBorderProps) => {
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [isAnimating, setIsAnimating] = useState(animate);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isAnimating) {
      intervalRef.current = setInterval(() => {
        setRotationDegrees((prev) => (prev + 1) % 360);
      }, (duration * 1000) / 360);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [duration, isAnimating]);

  const handleMouseEnter = () => {
    setIsAnimating(true);
    onMouseEnter?.();
  };

  const handleMouseLeave = () => {
    if (!animate) {
      setIsAnimating(false);
    }
    onMouseLeave?.();
  };

  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden p-[1px]",
        containerClassName
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="absolute inset-0 rounded-lg z-0"
        style={{
          background: borderGradient,
          transform: `rotate(${rotationDegrees}deg)`,
          transformOrigin: "center",
        }}
      />
      <Tag
        className={cn(
          "relative bg-background rounded-lg z-10",
          className
        )}
        onClick={onClick}
      >
        {children}
      </Tag>
    </div>
  );
};