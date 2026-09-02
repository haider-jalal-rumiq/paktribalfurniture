import { cn } from "@/lib/utils";

export function SectionHeading({ title, description, eyebrow, className }: { title: string; description?: string; eyebrow?: string; className?: string }) {
  return (
    <div className={cn("max-w-3xl", className)}>
      {eyebrow && <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>}
      <h2 className="font-display text-4xl leading-[0.95] tracking-[-0.03em] text-ink sm:text-5xl lg:text-6xl">{title}</h2>
      {description && <p className="mt-5 max-w-2xl text-base leading-7 text-ink-soft sm:text-lg sm:leading-8">{description}</p>}
    </div>
  );
}
