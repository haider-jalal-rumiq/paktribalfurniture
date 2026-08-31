"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

import { useReducedMotionSafe } from "@/components/motion";

/** Cross-fade between routes. Templates remount on navigation; layouts do not. */
export default function Template({ children }: { children: ReactNode }) {
  const reduce = useReducedMotionSafe();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0.15 : 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
