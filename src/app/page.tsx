import { CategoryShowcase } from "@/components/home/category-showcase";
import { CraftAndCustom } from "@/components/home/craft-and-custom";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";
import { Materials } from "@/components/home/materials";
import { getPublishedProducts } from "@/lib/catalog";

export default async function HomePage() {
  const products = await getPublishedProducts();
  return (
    <>
      <Hero />
      <CategoryShowcase />
      <Materials />
      <FeaturedProducts products={products} />
      <CraftAndCustom />
    </>
  );
}
