import { cn } from "@/lib/utils";

/**
 * Sun over a lens — the "sundance" rays above an eye/lens outline.
 * Placeholder mark: swap for the client's real logo if they have vector art.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={cn("h-9 w-9", className)}
    >
      {[...Array(7)].map((_, index) => {
        const angle = -90 + (index - 3) * 22;
        const radians = (angle * Math.PI) / 180;
        return (
          <line
            key={index}
            x1={20 + Math.cos(radians) * 9}
            y1={22 + Math.sin(radians) * 9}
            x2={20 + Math.cos(radians) * 15}
            y2={22 + Math.sin(radians) * 15}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity={1 - Math.abs(index - 3) * 0.18}
          />
        );
      })}
      <path
        d="M6 26c4.6-5.8 9.3-8.7 14-8.7S29.4 20.2 34 26c-4.6 5.8-9.3 8.7-14 8.7S10.6 31.8 6 26Z"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="26" r="3.4" fill="currentColor" />
    </svg>
  );
}
