"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface GlowingBorderProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  glowClassName?: string;
  glowColor?: string;
  borderRadius?: string;
  borderWidth?: number;
  glowSize?: number;
  animateGlow?: boolean;
}

export const GlowingBorder: React.FC<GlowingBorderProps> = ({
  children,
  className = "",
  containerClassName = "",
  glowClassName = "",
  glowColor = "rgba(74, 222, 128, 0.4)",
  borderRadius = "32px",
  borderWidth = 1,
  glowSize = 15,
  animateGlow = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current || !isHovered) return;
    
    const updateMousePosition = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePosition({ x, y });
    };
    
    window.addEventListener("mousemove", updateMousePosition);
    
    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
    };
  }, [isHovered]);

  return (
    <div
      ref={containerRef}
      className={`relative group ${containerClassName}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main content */}
      <div
        className={`relative z-10 transition-all duration-200 ${className}`}
        style={{
          borderRadius,
        }}
      >
        {children}
      </div>
      
      {/* Glow effect */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
          animateGlow ? "animate-glow" : ""
        } ${glowClassName}`}
        style={{
          borderRadius,
          pointerEvents: "none",
        }}
      >
        {/* Gradient border */}
        <div 
          className="absolute inset-0 -z-10"
          style={{
            background: "transparent",
            border: `${borderWidth}px solid ${glowColor}`,
            borderRadius,
            boxShadow: isHovered ? `0 0 ${glowSize}px ${glowColor}` : "none",
            transition: "box-shadow 0.3s ease",
          }}
        />
        
        {/* Moving glow effect */}
        {isHovered && (
          <div 
            className="absolute -z-10 transition-opacity duration-200"
            style={{
              width: `${glowSize * 2}px`,
              height: `${glowSize * 2}px`,
              background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
              borderRadius: "50%",
              left: mousePosition.x - glowSize,
              top: mousePosition.y - glowSize,
              opacity: 0.7,
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </div>
  );
};