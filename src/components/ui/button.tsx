import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const button = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-ui)] font-semibold tracking-[-0.01em] transition-[transform,background-color,color,border-color] duration-200 ease-[var(--ease-out-soft)] hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-55",
  {
    variants: {
      variant: {
        primary: "bg-accent text-white hover:bg-accent-deep",
        secondary: "bg-ink text-canvas hover:bg-ink-soft",
        outline:
          "border border-hairline bg-transparent text-ink hover:border-ink hover:bg-ink hover:text-canvas",
        ghost: "text-ink hover:bg-wash",
      },
      size: {
        sm: "px-4 py-2 text-sm",
        md: "px-5 py-3 text-sm",
        lg: "px-7 py-4 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonVariants = VariantProps<typeof button>;

export function Button({
  className,
  variant,
  size,
  ...props
}: ComponentProps<"button"> & ButtonVariants) {
  return (
    <button className={cn(button({ variant, size }), className)} {...props} />
  );
}

export function ButtonLink({
  className,
  variant,
  size,
  ...props
}: ComponentProps<typeof Link> & ButtonVariants) {
  return (
    <Link className={cn(button({ variant, size }), className)} {...props} />
  );
}
