"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type Variants } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;
const VIEWPORT = { once: true, margin: "0px 0px -10% 0px" } as const;

export function useReducedMotionSafe(): boolean {
  return useReducedMotion() ?? false;
}

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  id?: string;
}

export function Reveal({ children, className, delay = 0, y = 28, id }: RevealProps) {
  const reduce = useReducedMotionSafe();
  return (
    <motion.div
      id={id}
      className={className}
      data-motion-reveal=""
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: reduce ? 0 : 0.75, delay: reduce ? 0 : delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  gap?: number;
  delay?: number;
}

export function Stagger({ children, className, gap = 0.07, delay = 0 }: StaggerProps) {
  const reduce = useReducedMotionSafe();
  const variants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : gap, delayChildren: reduce ? 0 : delay } },
  };
  return (
    <motion.div className={className} variants={variants} initial="hidden" whileInView="show" viewport={VIEWPORT}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, y = 22 }: { children: ReactNode; className?: string; y?: number }) {
  const reduce = useReducedMotionSafe();
  const variants: Variants = {
    hidden: { opacity: 0, y },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.7, ease: EASE } },
  };
  return <motion.div data-motion-reveal="" className={className} variants={variants}>{children}</motion.div>;
}

export function Parallax({ children, className, distance = 44 }: { children: ReactNode; className?: string; distance?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  return (
    <div ref={ref} className={className}>
      <motion.div data-motion-parallax="" style={{ y }} className="relative h-full w-full">
        {children}
      </motion.div>
    </div>
  );
}
