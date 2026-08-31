"use client";

import Link from "next/link";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import { Menu, Phone, X } from "lucide-react";

import { navLinks } from "@/components/layout/nav";
import { useReducedMotionSafe } from "@/components/motion";
import { ButtonLink } from "@/components/ui/button";
import { site } from "@/content/site";
import { cn } from "@/lib/utils";

/**
 * Radix Dialog handles the parts that are easy to get wrong: focus trapping,
 * Escape to close, scroll lock, and `aria-modal` wiring.
 */
export function MobileNav({ overlay = false }: { overlay?: boolean }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotionSafe();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className={cn(
            "inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors lg:hidden",
            overlay
              ? "text-canvas hover:bg-white/15"
              : "text-ink hover:bg-ink/6",
          )}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </Dialog.Trigger>

      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                className="fixed inset-0 z-50 flex flex-col bg-canvas px-5 pb-10 pt-5 sm:px-8"
                initial={{ opacity: 0, y: reduce ? 0 : -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduce ? 0 : -16 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Dialog.Title className="sr-only">Menu</Dialog.Title>

                <div className="flex items-center justify-end">
                  <Dialog.Close
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/6"
                    aria-label="Close menu"
                  >
                    <X className="h-6 w-6" aria-hidden="true" />
                  </Dialog.Close>
                </div>

                <nav aria-label="Mobile" className="mt-6 flex-1">
                  <ul className="flex flex-col">
                    {navLinks.map((link, index) => (
                      <motion.li
                        key={link.href}
                        initial={{ opacity: 0, y: reduce ? 0 : 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: reduce ? 0 : 0.08 + index * 0.05,
                          duration: 0.4,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="border-b border-hairline"
                      >
                        <Link
                          href={link.href}
                          // The overlay would otherwise survive the route change.
                          onClick={() => setOpen(false)}
                          className="block py-5 font-display text-2xl text-ink"
                        >
                          {link.label}
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                </nav>

                <div className="flex flex-col gap-3">
                  <ButtonLink
                    href="/contact#appointment"
                    size="lg"
                    onClick={() => setOpen(false)}
                  >
                    Request an appointment
                  </ButtonLink>
                  <a
                    href={site.phoneHref}
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center justify-center gap-2 py-3 text-base font-medium text-ink-soft"
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {site.phone}
                  </a>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
