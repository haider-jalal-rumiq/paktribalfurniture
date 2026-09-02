import type { ComponentProps, ElementType } from "react";

import { cn } from "@/lib/utils";

export function Container({
  className,
  as,
  ...props
}: ComponentProps<"div"> & { as?: ElementType }) {
  const Tag = as ?? "div";
  return (
    <Tag
      className={cn("mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-12", className)}
      {...props}
    />
  );
}
