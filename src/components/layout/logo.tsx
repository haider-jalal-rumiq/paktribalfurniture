import Image from "next/image";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/images/brand-horizontal.png"
      alt="Pak Tribal Furniture"
      width={1178}
      height={412}
      priority
      className={cn("h-auto w-[9.5rem] object-contain sm:w-[11rem]", className)}
    />
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/images/brand-mark.png"
      alt=""
      width={537}
      height={523}
      className={cn("h-10 w-10 object-contain", className)}
      aria-hidden="true"
    />
  );
}
