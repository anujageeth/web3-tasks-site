"use client";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface WavyBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  colors?: string[];
  waveWidth?: number;
  backgroundFill?: string;
  blur?: number;
  speed?: "slow" | "fast";
}

export const WavyBackground = ({
  children,
  className,
  containerClassName,
  colors = ["#143d25", "#1e5535", "#0a0a0a"],
  waveWidth = 50,
  backgroundFill = "#0a0a0a",
  blur = 10,
  speed = "fast",
}: WavyBackgroundProps) => {
  const [amplitude] = useState(20);
  const [frequency] = useState(0.08);
  const [phase, setPhase] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      if (canvas && ctx) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const incrementPhase = () => {
      setPhase(prev => prev + (speed === "fast" ? 0.05 : 0.02));
    };

    const drawWaves = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fill the background
      ctx.fillStyle = backgroundFill;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw each wave
      for (let i = 0; i < colors.length; i++) {
        const spacing = canvas.height / colors.length;
        const y = spacing * (i + 0.5);
        
        ctx.beginPath();
        ctx.moveTo(0, y);
        
        for (let x = 0; x < canvas.width; x += 10) {
          const wavyY = y + Math.sin(x * frequency + phase + i) * amplitude;
          ctx.lineTo(x, wavyY);
        }
        
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        
        ctx.fillStyle = colors[i];
        ctx.fill();
      }
      
      incrementPhase();
      animationRef.current = requestAnimationFrame(drawWaves);
    };

    drawWaves();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, [amplitude, frequency, waveWidth, backgroundFill, colors, blur, speed, phase]);

  return (
    <div className={cn("relative w-full flex flex-col", containerClassName)}>
      <canvas
        className="absolute inset-0 z-0"
        ref={canvasRef}
        style={{ filter: `blur(${blur}px)` }}
      />
      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
};