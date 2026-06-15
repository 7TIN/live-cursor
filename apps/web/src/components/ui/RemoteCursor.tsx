"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { MousePointer2 } from "lucide-react";

interface RemoteCursorProps {
  x: number;
  y: number;
  userName?: string;
  color?: string;
  isVisible?: boolean;
}

export function RemoteCursor({
  x,
  y,
  userName,
  color = "blue",
  isVisible = true,
}: RemoteCursorProps) {
  const colorClasses = {
    blue: "fill-blue-500",
    red: "fill-red-500",
    green: "fill-green-500",
    purple: "fill-purple-500",
    pink: "fill-pink-500",
    yellow: "fill-yellow-500",
  };

  const colorClass =
    colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;
  const bgColorClass =
    {
      blue: "bg-blue-500",
      red: "bg-red-500",
      green: "bg-green-500",
      purple: "bg-purple-500",
      pink: "bg-pink-500",
      yellow: "bg-yellow-500",
    }[color as keyof typeof colorClasses] || "bg-blue-500";

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Cursor pointer */}
          <motion.div
            className="pointer-events-none fixed z-[9999]"
            style={{
              left: x,
              top: y,
              transform: "translate(-12px, -12px)",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <MousePointer2
              className={`${colorClass} stroke-white/20 drop-shadow-lg`}
              size={24}
            />
          </motion.div>

          {/* User label following cursor */}
          {userName && (
            <motion.div
              className="pointer-events-none fixed z-9998"
              style={{
                left: x,
                top: y,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
            >
              <div
                className={`${bgColorClass} text-white text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap font-medium ml-6 mt-4 border border-white/20`}
              >
                {userName}
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
