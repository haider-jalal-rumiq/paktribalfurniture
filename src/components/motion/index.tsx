"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  animate,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "motion/react";

import { cn } from "@/lib/utils";

/**
 * Shared motion primitives.
 *
 * Every animation on the site is one of these — no per-component one-offs, so
 * timing and easing stay consistent and `prefers-reduced-motion` is honoured in
 * exactly one place.
 */

const EASE = [0.22, 1, 0.36, 1] as const;
const VIEWPORT = { once: true, margin: "0px 0px -12% 0px" } as const;

/**
 * `useReducedMotion` returns null until the media query resolves on the client.
 * Treat that as "no preference" so the server and first client render agree.
 */
export function useReducedMotionSafe(): boolean {
  return useReducedMotion() ?? false;
}

/* -------------------------------------------------------------------------- */
/* Reveal — a single element fading up as it scrolls into view.                */
/* -------------------------------------------------------------------------- */

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Travel distance in px. Ignored when motion is reduced. */
  y?: number;
  /** Anchor target, for sections linked to from elsewhere. */
  id?: string;
}

export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  id,
}: RevealProps) {
  const reduce = useReducedMotionSafe();

  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: reduce ? 0.3 : 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stagger — a group whose children enter in sequence.                         */
/* -------------------------------------------------------------------------- */

interface StaggerProps {
  children: ReactNode;
  className?: string;
  /** Seconds between children. */
  gap?: number;
  delay?: number;
}

export function Stagger({
  children,
  className,
  gap = 0.06,
  delay = 0,
}: StaggerProps) {
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: gap, delayChildren: delay } },
  };

  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  /**
   * Travel distance. Pass "100%" inside an `overflow-hidden` wrapper to get a
   * clip-style line reveal (used by the hero headline).
   */
  y?: number | string;
}

export function StaggerItem({ children, className, y = 20 }: StaggerItemProps) {
  const reduce = useReducedMotionSafe();

  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : y },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0.3 : 0.75, ease: EASE },
    },
  };

  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Parallax — slow vertical drift tied to scroll progress.                     */
/* -------------------------------------------------------------------------- */

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  /** Total travel in px across the element's time on screen. */
  distance?: number;
}

export function Parallax({
  children,
  className,
  distance = 60,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotionSafe();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);

  return (
    <div ref={ref} className={className}>
      {/* `relative`: next/image with `fill` needs a positioned ancestor. */}
      <motion.div
        style={reduce ? undefined : { y }}
        className="relative h-full w-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* CountUp — a number that ticks up the first time it is seen.                 */
/* -------------------------------------------------------------------------- */

interface CountUpProps {
  to: number;
  className?: string;
  /** Counting from 0 to 1951 looks absurd; start near the target instead. */
  from?: number;
  duration?: number;
}

export function CountUp({ to, className, from = 0, duration = 1.6 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, VIEWPORT);
  const reduce = useReducedMotionSafe();
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (!inView || reduce) return;

    // `animate` is the external system; setValue only runs from its callback.
    const controls = animate(from, to, {
      duration,
      ease: EASE,
      onUpdate: (latest: number) => setValue(Math.round(latest)),
    });

    return () => controls.stop();
  }, [inView, reduce, from, to, duration]);

  // Reduced motion never animates, so it renders the target outright.
  const display = reduce ? to : value;

  // The final value is always in the DOM for assistive tech and for crawlers,
  // even mid-animation.
  return (
    <span ref={ref} className={className} aria-label={String(to)}>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* DrawLine — the vertical rule on the lineage timeline.                       */
/* -------------------------------------------------------------------------- */

export function DrawLine({ className }: { className?: string }) {
  const reduce = useReducedMotionSafe();

  return (
    <motion.div
      className={cn("origin-top bg-hairline", className)}
      initial={{ scaleY: reduce ? 1 : 0 }}
      whileInView={{ scaleY: 1 }}
      viewport={VIEWPORT}
      transition={{ duration: reduce ? 0 : 1.2, ease: EASE }}
      aria-hidden="true"
    />
  );
}
