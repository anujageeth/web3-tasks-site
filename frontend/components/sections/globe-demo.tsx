"use client";
import React from "react";
import { motion } from "framer-motion";
import { SimplifiedGlobe } from "../ui/globe-simplified";

export function GlobeDemo() {
  return (
    <div className="flex flex-row items-center justify-center py-20 h-screen md:h-auto dark:bg-transparent bg-transparent relative w-full">
      <div className="max-w-7xl mx-auto w-full relative overflow-hidden h-full md:h-[40rem] px-4">
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 1,
          }}
          className="div"
        >
          <h2 className="text-center text-xl md:text-4xl font-bold text-white">
            Complete Tasks Globally
          </h2>
          <p className="text-center text-base md:text-lg font-normal text-gray-300 max-w-md mt-2 mx-auto">
            Join communities and participate in web3 events from anywhere in the world
          </p>
        </motion.div>
        <div className="absolute w-full -bottom-20 h-72 md:h-full z-10">
          <SimplifiedGlobe />
        </div>
      </div>
    </div>
  );
}