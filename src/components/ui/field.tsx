import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

const control =
  "w-full rounded-xl border bg-surface px-4 py-3 text-base text-ink transition-colors duration-200 placeholder:text-stone/80 focus:border-clay focus:outline-none disabled:opacity-60";

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
        className="text-sm font-medium tracking-tight text-ink-soft"
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="text-xs text-stone">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${htmlFor}-error`}
          className="text-xs font-medium text-clay-deep"
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
        invalid ? "border-clay-deep" : "border-hairline",
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
        invalid ? "border-clay-deep" : "border-hairline",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Native <select>. Accessible and correct on mobile for free — a custom
 * listbox would be more code and less reliable.
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
        "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%238C8073%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:1.1rem] bg-[position:right_1rem_center] bg-no-repeat pr-11",
        invalid ? "border-clay-deep" : "border-hairline",
        className,
      )}
      {...props}
    />
  );
}
