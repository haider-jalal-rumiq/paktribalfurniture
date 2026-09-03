"use client";

import Image from "next/image";
import { ArrowDownRight, MessageCircle } from "lucide-react";
import { motion } from "motion/react";

import { Container } from "@/components/layout/container";
import { EASE_IN_OUT, EASE_OUT, useReducedMotionSafe } from "@/components/motion";
import { ButtonLink } from "@/components/ui/button";

export function Hero() {
  const reduce = useReducedMotionSafe();
  const settle = reduce ? 0.2 : 0.72;

  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-ink pb-2 pt-16 sm:pb-2 sm:pt-16">
      <motion.div
        data-hero-frame=""
        data-motion-reveal=""
        className="absolute inset-0 overflow-hidden"
        initial={{ opacity: reduce ? 1 : 0.72, transform: reduce ? "none" : "scale(0.3)" }}
        animate={{ opacity: 1, transform: "scale(1)" }}
        transition={{ duration: reduce ? 0.2 : 1.05, delay: reduce ? 0 : 0.12, ease: EASE_IN_OUT }}
      >
        <Image
          src="/images/furniture/hero-living-room.jpg"
          alt="Green sofa in a warm, wood-accented interior"
          fill
          priority
          sizes="100vw"
          className="image-drift object-cover object-[62%_center] sm:object-center"
        />
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,14,12,0.82)_0%,rgba(8,14,12,0.48)_52%,rgba(8,14,12,0.3)_100%)]"
          initial={{ opacity: reduce ? 1 : 0.2 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduce ? 0.2 : 0.8, delay: reduce ? 0 : 0.5, ease: EASE_OUT }}
        />
      </motion.div>

      <Container className="relative z-10 flex min-h-[calc(100svh-4rem)] flex-col justify-end pb-8 pt-24 sm:pb-12 lg:pb-14">
        <motion.p
          data-motion-reveal=""
          className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-white/78"
          initial={{ opacity: 0, transform: "translate3d(0, 14px, 0)" }}
          animate={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
          transition={{ duration: settle, delay: reduce ? 0 : 0.68, ease: EASE_OUT }}
        >
          Pakistani woodcraft
        </motion.p>

        <h1 className="max-w-5xl font-display text-[clamp(3.7rem,9.4vw,9.5rem)] leading-[0.76] tracking-[-0.055em] text-white">
          <span className="block overflow-hidden pb-[0.08em]">
            <motion.span
              data-motion-reveal=""
              className="block"
              initial={{ opacity: 0, transform: "translate3d(0, 105%, 0)" }}
              animate={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
              transition={{ duration: settle, delay: reduce ? 0 : 0.76, ease: EASE_OUT }}
            >
              Furniture with
            </motion.span>
          </span>
          <span className="block overflow-hidden pb-[0.12em]">
            <motion.span
              data-motion-reveal=""
              className="block italic text-white/92"
              initial={{ opacity: 0, transform: "translate3d(0, 105%, 0)" }}
              animate={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
              transition={{ duration: settle, delay: reduce ? 0 : 0.84, ease: EASE_OUT }}
            >
              a sense of place.
            </motion.span>
          </span>
        </h1>

        <motion.div
          data-motion-reveal=""
          className="mt-6 flex max-w-4xl flex-col gap-6 sm:mt-7 sm:flex-row sm:items-end sm:justify-between"
          initial={{ opacity: 0, transform: "translate3d(0, 20px, 0)" }}
          animate={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
          transition={{ duration: settle, delay: reduce ? 0 : 1, ease: EASE_OUT }}
        >
          <p className="max-w-xl text-base leading-7 text-white/78 sm:text-lg sm:leading-8">
            Solid wood furniture shaped by Pakistani craft and made for the way your home lives.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/collections" size="lg">
              Explore collections
              <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink
              href="/contact#enquiry"
              size="lg"
              variant="outline"
              className="border-white/45 text-white hover:border-white hover:bg-white hover:text-ink"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Send an enquiry
            </ButtonLink>
          </div>
        </motion.div>

        <motion.div
          data-motion-reveal=""
          className="absolute right-6 top-28 hidden max-w-52 border border-white/25 bg-ink/55 p-5 text-white backdrop-blur-md lg:block"
          initial={{ opacity: 0, transform: "translate3d(0, -24px, 0)" }}
          animate={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
          transition={{ duration: settle, delay: reduce ? 0 : 1.08, ease: EASE_OUT }}
        >
          <p className="font-display text-2xl leading-tight">Choose the piece. Choose the wood.</p>
          <p className="mt-2 text-xs leading-5 text-white/68">Rosewood, cedar, pine, mango, or walnut.</p>
        </motion.div>
      </Container>
    </section>
  );
}
