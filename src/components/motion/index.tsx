"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "motion/react";

export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;

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
      initial={{ opacity: 0, transform: `translate3d(0, ${y}px, 0)` }}
      whileInView={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
      viewport={VIEWPORT}
      transition={{ duration: reduce ? 0.2 : 0.75, delay: reduce ? 0 : delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

interface MaskRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function MaskReveal({ children, className, delay = 0 }: MaskRevealProps) {
  const reduce = useReducedMotionSafe();
  const variants: Variants = {
    hidden: { opacity: 0, transform: "translate3d(0, 104%, 0)" },
    show: {
      opacity: 1,
      transform: "translate3d(0, 0, 0)",
      transition: { duration: reduce ? 0.2 : 0.72, delay: reduce ? 0 : delay, ease: EASE_OUT },
    },
  };

  return (
    <motion.div className="overflow-hidden" initial="hidden" whileInView="show" viewport={VIEWPORT}>
      <motion.div
        className={className}
        data-motion-reveal=""
        variants={variants}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  gap?: number;
  delay?: number;
}

export function Stagger({ children, className, gap = 0.06, delay = 0 }: StaggerProps) {
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
    hidden: { opacity: 0, transform: `translate3d(0, ${y}px, 0)` },
    show: {
      opacity: 1,
      transform: "translate3d(0, 0, 0)",
      transition: { duration: reduce ? 0.2 : 0.7, ease: EASE_OUT },
    },
  };
  return <motion.div data-motion-reveal="" className={className} variants={variants}>{children}</motion.div>;
}

interface TileRevealProps {
  children: ReactNode;
  className?: string;
  index?: number;
}

export function TileReveal({ children, className, index = 0 }: TileRevealProps) {
  const reduce = useReducedMotionSafe();
  const start = index % 2 === 0
    ? "translate3d(0, 10%, 0) scale(0.95)"
    : "translate3d(7%, 0, 0) scale(0.95)";

  return (
    <motion.div
      className={className}
      data-motion-reveal=""
      initial={{ opacity: 0, transform: start }}
      whileInView={{ opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" }}
      viewport={VIEWPORT}
      transition={{ duration: reduce ? 0.2 : 0.8, delay: reduce ? 0 : (index % 3) * 0.055, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

interface PanelRevealProps {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down";
  delay?: number;
}

export function PanelReveal({ children, className, direction = "up", delay = 0 }: PanelRevealProps) {
  const reduce = useReducedMotionSafe();
  const start = direction === "up" ? "translate3d(0, 14%, 0)" : "translate3d(0, -14%, 0)";

  return (
    <motion.div
      className={className}
      data-motion-reveal=""
      initial={{ opacity: 0, transform: start }}
      whileInView={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
      viewport={VIEWPORT}
      transition={{ duration: reduce ? 0.2 : 0.9, delay: reduce ? 0 : delay, ease: EASE_IN_OUT }}
    >
      {children}
    </motion.div>
  );
}

export function ScrollRail({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const transform = useTransform(
    scrollYProgress,
    [0, 1],
    ["translate3d(8%, 0, 0)", "translate3d(-18%, 0, 0)"],
  );

  return (
    <div ref={ref} className={className}>
      <motion.div data-motion-parallax="" style={{ transform }} className="w-max whitespace-nowrap">
        {children}
      </motion.div>
    </div>
  );
}

export function Parallax({ children, className, distance = 44 }: { children: ReactNode; className?: string; distance?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const transform = useTransform(
    scrollYProgress,
    [0, 1],
    [`translate3d(0, ${distance}px, 0)`, `translate3d(0, ${-distance}px, 0)`],
  );
  return (
    <div ref={ref} className={className}>
      <motion.div data-motion-parallax="" style={{ transform }} className="relative h-full w-full">
        {children}
      </motion.div>
    </div>
  );
}
