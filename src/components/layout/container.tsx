import type { ComponentProps, ElementType } from "react";

import { cn } from "@/lib/utils";

/** The one content width used across the site. */
export function Container({
  className,
  as,
  ...props
}: ComponentProps<"div"> & { as?: ElementType }) {
  const Tag = as ?? "div";
  return (
    <Tag
      className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}
      {...props}
    />
  );
}
