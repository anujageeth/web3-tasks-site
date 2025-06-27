"use client";
import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export function SimplifiedGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Make canvas size match its display size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.8;
    
    // Animation variables
    let rotation = 0;
    const colors = ["#4ADE80", "#22C55E", "#16A34A"]; // Green shades
    
    // Draw globe grid lines
    const drawGlobe = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw base globe
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#0f2d1a"; // Dark green background
      ctx.fill();
      
      // Draw longitude lines
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + rotation;
        ctx.beginPath();
        ctx.ellipse(
          centerX,
          centerY,
          radius * Math.abs(Math.cos(angle)),
          radius,
          0,
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.stroke();
      }
      
      // Draw latitude lines
      for (let i = 1; i < 6; i++) {
        const latRadius = (radius * i) / 6;
        ctx.beginPath();
        ctx.arc(centerX, centerY, latRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.stroke();
      }
      
      // Draw "connection" points
      const points = [];
      for (let i = 0; i < 20; i++) {
        const lat = Math.random() * Math.PI - Math.PI/2;
        const lng = Math.random() * Math.PI * 2 + rotation;
        
        const x = centerX + radius * Math.cos(lat) * Math.sin(lng);
        const y = centerY + radius * Math.sin(lat);
        
        points.push({x, y});
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.fill();
      }
      
      // Draw some connections between points
      for (let i = 0; i < 10; i++) {
        const p1 = points[Math.floor(Math.random() * points.length)];
        const p2 = points[Math.floor(Math.random() * points.length)];
        
        if (p1 !== p2) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)];
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      
      // Auto-rotate
      rotation += 0.005;
      requestAnimationFrame(drawGlobe);
    };
    
    drawGlobe();
    
    return () => {
      // Cleanup
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef}
      className="w-full h-full"
    />
  );
}