"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export const CursorGlow = () => {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateMousePosition = (ev: MouseEvent) => {
      setMousePosition({ x: ev.clientX, y: ev.clientY });
      setIsVisible(true);
    };
    
    const handleMouseLeave = () => {
      setIsVisible(false);
    };
    
    window.addEventListener("mousemove", updateMousePosition);
    document.addEventListener("mouseleave", handleMouseLeave);
    
    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <motion.div
      className={`cursor-glow ${isVisible ? 'visible' : ''}`}
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(74, 222, 128, 0.5) 0%, transparent 70%)',
        zIndex: 9999,
        opacity: isVisible ? 1 : 0,
        transform: 'translate(-55%, -55%)', // Center the glow on the cursor
      }}
      animate={{
        left: mousePosition.x,
        top: mousePosition.y,
      }}
      transition={{
        type: "spring",
        mass: 0.1,
        stiffness: 10, // Increased for faster response
        damping: 1,    // Increased for less wobble
      }}
    />
  );
};