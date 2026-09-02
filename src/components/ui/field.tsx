import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

const control =
  "w-full rounded-[var(--radius-ui)] border bg-surface px-4 py-3 text-base text-ink transition-colors duration-200 placeholder:text-muted focus:border-accent focus:outline-none disabled:opacity-60";

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Label + control + message. Wire the control's `aria-describedby` to
 * `{htmlFor}-error` / `{htmlFor}-hint` so screen readers announce both.
 */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-semibold tracking-tight text-ink-soft"
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${htmlFor}-error`}
          className="text-xs font-medium text-accent-deep"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({
  className,
  invalid,
  ...props
}: ComponentProps<"input"> & { invalid?: boolean }) {
  return (
    <input
      className={cn(
        control,
        invalid ? "border-accent-deep" : "border-hairline",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  invalid,
  ...props
}: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return (
    <textarea
      className={cn(
        control,
        "min-h-32 resize-y",
        invalid ? "border-accent-deep" : "border-hairline",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Native select keeps mobile interaction and keyboard behavior reliable.
 */
export function Select({
  className,
  invalid,
  ...props
}: ComponentProps<"select"> & { invalid?: boolean }) {
  return (
    <select
      className={cn(
        control,
        "appearance-none bg-[length:1.1rem] bg-[position:right_1rem_center] bg-no-repeat pr-11",
        invalid ? "border-accent-deep" : "border-hairline",
        className,
      )}
      {...props}
    />
  );
}
