"use client";

import Link from "next/link";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import { Camera, Menu, MessageCircle, X } from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { navLinks } from "@/components/layout/nav";
import { useReducedMotionSafe } from "@/components/motion";
import { ButtonLink } from "@/components/ui/button";
import { site } from "@/content/site";
import { cn } from "@/lib/utils";

export function MobileNav({ overlay = false }: { overlay?: boolean }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotionSafe();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className={cn(
            "inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-ui)] text-ink hover:bg-wash lg:hidden",
            overlay && "text-white hover:bg-white/10",
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
              <motion.div className="fixed inset-0 z-50 bg-ink/35 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-canvas p-6 shadow-2xl"
                initial={{ x: reduce ? 0 : "100%" }}
                animate={{ x: 0 }}
                exit={{ x: reduce ? 0 : "100%" }}
                transition={{ duration: reduce ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <Dialog.Title className="sr-only">Menu</Dialog.Title>
                <div className="flex items-center justify-between">
                  <Logo />
                  <Dialog.Close className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-ui)] text-ink hover:bg-wash" aria-label="Close menu">
                    <X className="h-6 w-6" aria-hidden="true" />
                  </Dialog.Close>
                </div>
                <nav aria-label="Mobile navigation" className="mt-12 flex-1">
                  <ul>
                    {navLinks.map((link, index) => (
                      <motion.li
                        key={link.href}
                        className="border-b border-hairline"
                        initial={{ opacity: 0, y: reduce ? 0 : 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: reduce ? 0 : 0.06 + index * 0.05 }}
                      >
                        <Link href={link.href} onClick={() => setOpen(false)} className="block py-5 font-display text-3xl text-ink">
                          {link.label}
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                </nav>
                <div className="space-y-3">
                  <ButtonLink href="/contact#enquiry" size="lg" className="w-full" onClick={() => setOpen(false)}>
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    Send an enquiry
                  </ButtonLink>
                  <a href={site.instagramUrl} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-ink-soft">
                    <Camera className="h-4 w-4" aria-hidden="true" />
                    Instagram
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
