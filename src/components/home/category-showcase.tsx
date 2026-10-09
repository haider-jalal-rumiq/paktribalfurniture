import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { CategoryCard } from "@/components/catalog/category-card";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { MaskReveal, Parallax, ScrollScene, TileReveal } from "@/components/motion";
import { categories } from "@/content/catalog";

const spans = [
  "lg:col-span-7 lg:row-span-2",
  "lg:col-span-5",
  "lg:col-span-5",
  "lg:col-span-4",
  "lg:col-span-8",
  "lg:col-span-5",
  "lg:col-span-7",
  "lg:col-span-12",
] as const;

export function CategoryShowcase() {
  const [beds, sofas, chairs] = categories;

  return (
    <section className="overflow-hidden py-14 sm:py-20">
      <Container>
        <ScrollScene className="min-h-[43rem] sm:min-h-[49rem]">
          <div className="relative isolate h-[43rem] overflow-hidden rounded-[var(--radius-scene)] bg-ink text-white sm:h-[49rem]">
            <p aria-hidden="true" className="pointer-events-none absolute left-1/2 top-5 -z-10 -translate-x-1/2 whitespace-nowrap font-display text-[clamp(6.5rem,20vw,18rem)] font-semibold leading-none tracking-[-0.08em] text-white/[0.055]">
              CRAFTED
            </p>

            <Parallax className="absolute inset-x-[15%] bottom-[7.5rem] top-[8rem] z-0 sm:inset-x-[24%] sm:bottom-[5rem] sm:top-[6.5rem]" distance={28}>
              <Image
                src={sofas.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 52vw, 72vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-ink/15" aria-hidden="true" />
            </Parallax>

            <Parallax className="absolute -left-8 top-28 z-10 hidden h-56 w-44 overflow-hidden border border-white/20 bg-ink sm:block lg:left-10 lg:h-64 lg:w-52" distance={52}>
              <Image src={beds.image} alt="" fill sizes="13rem" className="object-cover" />
            </Parallax>

            <Parallax className="absolute -right-8 bottom-24 z-10 hidden h-48 w-40 overflow-hidden border border-white/20 bg-ink sm:block lg:right-10 lg:h-56 lg:w-48" distance={-42}>
              <Image src={chairs.image} alt="" fill sizes="12rem" className="object-cover" />
            </Parallax>

            <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-5 p-6 sm:p-9">
              <p className="max-w-48 text-xs font-bold uppercase tracking-[0.2em] text-white/65">Room by room</p>
              <Link href="/collections" className="group flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white">
                View catalogue
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-ink via-ink/88 to-transparent px-6 pb-7 pt-28 sm:px-9 sm:pb-9">
              <MaskReveal>
                <h2 className="max-w-4xl font-display text-[clamp(3.6rem,8.5vw,8.25rem)] leading-[0.77] tracking-[-0.055em]">
                  Made for the way <span className="italic text-white/78">you live.</span>
                </h2>
              </MaskReveal>
              <div className="mt-6 flex flex-col gap-5 border-t border-white/25 pt-5 sm:flex-row sm:items-end sm:justify-between">
                <p className="max-w-xl text-sm leading-6 text-white/68 sm:text-base sm:leading-7">
                  Browse by purpose, then enquire about the details that matter to your space.
                </p>
                <ArrowDownRight className="h-7 w-7 shrink-0 text-white/70" aria-hidden="true" />
              </div>
            </div>
          </div>
        </ScrollScene>

        <MaskReveal className="mt-20 sm:mt-28">
          <SectionHeading title="A room-by-room catalogue." description="Eight ways into the collection, from statement beds to useful storage and custom work." />
        </MaskReveal>
        <div className="mt-12 grid auto-rows-[minmax(18rem,auto)] gap-3 lg:grid-cols-12">
          {categories.map((category, index) => (
            <TileReveal key={category.slug} className={spans[index]} index={index}>
              <CategoryCard category={category} className="h-full" priority={index < 2} />
            </TileReveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
