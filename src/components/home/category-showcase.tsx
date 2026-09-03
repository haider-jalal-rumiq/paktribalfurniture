import { CategoryCard } from "@/components/catalog/category-card";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { MaskReveal, TileReveal } from "@/components/motion";
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
  return (
    <section className="py-2 sm:py-8">
      <Container>
        <MaskReveal>
          <SectionHeading title="A room-by-room catalogue." description="Browse by purpose, then enquire about the details that matter to your space." />
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
