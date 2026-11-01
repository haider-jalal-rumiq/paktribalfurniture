import { CategoryShowcase } from "@/components/home/category-showcase";
import { CraftAndCustom } from "@/components/home/craft-and-custom";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";
import { Materials } from "@/components/home/materials";
import { site } from "@/content/site";
import { getPublishedProducts } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Solid-Wood Furniture from Islamabad",
  description: site.summary,
  path: "/",
});

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
