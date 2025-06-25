"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

type NavItem = {
  name: string;
  link: string;
  icon?: React.ReactNode;
  onClick?: () => void;
};

export const FloatingNav = ({
  navItems,
  className,
}: {
  navItems: NavItem[];
  className?: string;
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      if (scrollPosition > 80) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "fixed bottom-10 inset-x-0 mx-auto z-50 flex items-center justify-center",
        className
      )}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: isScrolled ? 0.8 : 1 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-2 p-2 px-4 backdrop-blur-lg bg-black/20 border border-white/[0.2] shadow-xl rounded-full"
      >
        {navItems.map((navItem: NavItem, idx: number) => (
          <NavItemComponent key={`nav-item-${idx}`} navItem={navItem} />
        ))}
      </motion.div>
    </motion.div>
  );
};

const NavItemComponent = ({ navItem }: { navItem: NavItem }) => {
  const [hovering, setHovering] = useState(false);

  if (navItem.onClick) {
    return (
      <button
        className="relative px-4 py-2 rounded-full text-sm text-white hover:text-light-green transition-all duration-300 flex items-center gap-2"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onClick={navItem.onClick}
      >
        {navItem.icon}
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{
            opacity: hovering ? 1 : 0,
            width: hovering ? "auto" : 0,
          }}
          transition={{ duration: 0.2 }}
          className="whitespace-nowrap overflow-hidden text-sm"
        >
          {navItem.name}
        </motion.span>
      </button>
    );
  }

  return (
    <Link
      href={navItem.link}
      className="relative px-4 py-2 rounded-full text-sm text-white hover:text-light-green transition-all duration-300 flex items-center gap-2"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {navItem.icon}
      <motion.span
        initial={{ opacity: 0, width: 0 }}
        animate={{
          opacity: hovering ? 1 : 0,
          width: hovering ? "auto" : 0,
        }}
        transition={{ duration: 0.2 }}
        className="whitespace-nowrap overflow-hidden text-sm"
      >
        {navItem.name}
      </motion.span>
    </Link>
  );
};