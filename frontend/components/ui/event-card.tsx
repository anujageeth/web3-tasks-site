"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { FiClock, FiUsers, FiCheckSquare } from "react-icons/fi";

interface EventCardProps {
  event: {
    _id: string;
    title: string;
    description: string;
    isActive: boolean;
    imageUrl?: string;
    startDate: string;
    endDate: string;
    totalPoints: number;
    creator: {
      address: string;
      firstName?: string;
      lastName?: string;
    };
    participants: Array<any>;
  };
}

export function EventCard({ event }: EventCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [taskCount, setTaskCount] = useState<number>(0);
  
  // Custom colors
  const activeGreen = "#45ff94";
  const inactiveGray = "#a0a0a0";
  const profileBgColor = "#133220";
  const profileTextColor = "#6dffaa";
  const profileBorderColor = "rgba(109, 255, 170, 0.5)";
  const profileShadowColor = "rgba(109, 255, 170, 0.3)";
  
  const creatorName = event.creator.firstName || 
    `${event.creator.address.substring(0, 4)}...${event.creator.address.substring(event.creator.address.length - 4)}`;

  // Calculate days remaining
  const now = new Date();
  const endDate = new Date(event.endDate);
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Default background if no image
  const backgroundImage = event.imageUrl || 
    "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop";
    
  // Fetch task count for this event when component loads
  useEffect(() => {
    async function fetchTaskCount() {
      try {
        const response = await fetch(`/api/events/${event._id}/tasks/count`);
        if (response.ok) {
          const data = await response.json();
          setTaskCount(data.count);
        } else {
          // If API isn't implemented yet, estimate based on points
          // Each task might be worth ~10 points on average
          setTaskCount(Math.max(1, Math.round(event.totalPoints / 10)));
        }
      } catch (error) {
        // Fallback to estimation
        setTaskCount(Math.max(1, Math.round(event.totalPoints / 10)));
      }
    }
    
    fetchTaskCount();
  }, [event._id, event.totalPoints]);

  return (
    <motion.div 
      className="w-full group/card relative rounded-[32px] overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Background image */}
      <div
        className={cn(
          "absolute inset-0 bg-cover bg-center transition-transform duration-700",
          isHovered ? "scale-110" : "scale-100"
        )}
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      
      {/* Gradient overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-70 transition-opacity duration-300",
        isHovered ? "opacity-80" : "opacity-70"
      )}/>
      
      {/* Status badge */}
      <div className="absolute top-4 right-4 z-10">
        <span 
          style={{
            backgroundColor: event.isActive 
              ? `rgba(69, 255, 148, 0.15)` 
              : 'rgba(160, 160, 160, 0.15)',
            color: event.isActive ? activeGreen : inactiveGray,
            borderColor: event.isActive 
              ? `rgba(69, 255, 148, 0.4)` 
              : 'rgba(160, 160, 160, 0.4)',
            borderWidth: '1px',
            borderStyle: 'solid',
            backdropFilter: 'blur(8px)',
            padding: '0.25rem 0.625rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: '500',
          }}
        >
          {event.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Content container */}
      <div className="relative z-10 h-80 p-5 flex flex-col justify-between">
        {/* Top section - creator info */}
        <div className="flex items-center space-x-2">
          <div 
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '9999px',
              backgroundColor: profileBgColor,
              color: profileTextColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '500',
              border: `1px solid ${profileBorderColor}`,
              boxShadow: `0 0 15px ${profileShadowColor}`,
            }}
          >
            {creatorName[0].toUpperCase()}
          </div>
          <span className="text-gray-300 text-sm">by {creatorName}</span>
        </div>
        
        {/* Middle section - event info */}
        <div className="my-2">
          <motion.h2 
            className="font-bold text-xl text-white line-clamp-2 mb-1"
            animate={{ color: isHovered ? 'rgb(69, 255, 147)' : "#ffffff" }}
          >
            {event.title}
          </motion.h2>
          <p className="font-normal text-sm text-gray-200 line-clamp-2">
            {event.description}
          </p>
        </div>
        
        {/* Bottom section - stats */}
        <div>
          <motion.div 
            className="grid grid-cols-3 gap-2 mb-3"
            animate={{ y: isHovered ? 0 : 10, opacity: isHovered ? 1 : 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center py-2 px-1 rounded-lg bg-white/5 backdrop-blur-sm">
              <FiUsers 
                className="mb-1 w-4 h-4" 
                color="#6dffaa" 
                strokeWidth={2.5} 
              />
              <span className="text-xs text-gray-300">{event.participants.length}</span>
              <span className="text-[10px] text-gray-400">Participants</span>
            </div>
            <div className="flex flex-col items-center py-2 px-1 rounded-lg bg-white/5 backdrop-blur-sm">
              <FiClock 
                className="mb-1 w-4 h-4" 
                color="#ffd045" 
                strokeWidth={2.5} 
              />
              <span className="text-xs text-gray-300">{event.isActive ? `${daysRemaining}` : "0"}</span>
              <span className="text-[10px] text-gray-400">Days left</span>
            </div>
            <div className="flex flex-col items-center py-2 px-1 rounded-lg bg-white/5 backdrop-blur-sm">
              <FiCheckSquare 
                className="mb-1 w-4 h-4" 
                color="#6dffaa" 
                strokeWidth={2.5} 
              />
              <span className="text-xs text-gray-300">{taskCount}</span>
              <span className="text-[10px] text-gray-400">Tasks</span>
            </div>
          </motion.div>
          
          {/* Call to action */}
          <motion.div 
            className="flex justify-center"
            animate={{ 
              y: isHovered ? 0 : 10, 
              opacity: isHovered ? 1 : 0.7,
            }}
            transition={{ duration: 0.3 }}
          >
            <div 
              style={{
                backgroundColor: `rgba(69, 255, 148, 0.15)`,
                color: event.isActive ? activeGreen : inactiveGray,
                borderColor: `rgba(69, 255, 148, 0.4)`,
                borderRadius: '9999px',
                borderWidth: '1px',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'white',
                boxShadow: '0 10px 15px -3px rgba(19, 50, 32, 0.3)',
                width: '100%',
                textAlign: 'center',
              }}
            >
              View Details
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Animated border effect on hover with increased width */}
      <motion.div
        className="absolute inset-0 rounded-[32px] z-0 opacity-0 pointer-events-none"
        style={{
          border: isHovered ? "3px solid" : "2px solid", // Increased border width on hover
          borderImage: "linear-gradient(to right, #6dffaa, #133220, #6dffaa) 1",
          borderImageSlice: 1,
        }}
        animate={{
          opacity: isHovered ? 1 : 0,
          boxShadow: isHovered ? '0 0 20px rgba(109, 255, 170, 0.3)' : 'none'
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}