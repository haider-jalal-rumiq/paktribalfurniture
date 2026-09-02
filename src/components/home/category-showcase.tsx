import { CategoryCard } from "@/components/catalog/category-card";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { Reveal } from "@/components/motion";
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
    <section className="py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading title="A room-by-room catalogue." description="Browse by purpose, then enquire about the details that matter to your space." />
        </Reveal>
        <div className="mt-12 grid auto-rows-[minmax(18rem,auto)] gap-3 lg:grid-cols-12">
          {categories.map((category, index) => (
            <Reveal key={category.slug} className={spans[index]} delay={(index % 3) * 0.05}>
              <CategoryCard category={category} className="h-full" priority={index < 2} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
