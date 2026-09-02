import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion";
import { InquiryForm } from "@/features/inquiry/inquiry-form";
import { getCategory } from "@/content/catalog";
import { woodTypes } from "@/content/site";
import { getProductBySlug } from "@/lib/catalog";
import { breadcrumbSchema, JsonLd, pageMetadata, productSchema } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return pageMetadata({ title: product.name, description: product.short_description, path: `/collections/${product.slug}`, image: product.image_urls[0] });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const category = getCategory(product.category_slug);
  const images = product.image_urls.length ? product.image_urls : [category?.image ?? "/images/furniture/workshop.jpg"];
  const productWoods = woodTypes.filter((wood) => product.wood_types.includes(wood.slug));

  return (
    <>
      <JsonLd data={productSchema(product)} />
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Collections", path: "/collections" }, { name: product.name, path: `/collections/${product.slug}` }])} />
      <div className="pb-20 pt-28 sm:pb-28 sm:pt-32">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div className="grid gap-3 sm:grid-cols-2">
              {images.map((image, index) => (
                <Reveal key={`${image}-${index}`} className={index === 0 ? "sm:col-span-2" : undefined}>
                  <div className={index === 0 ? "relative aspect-[5/4] overflow-hidden bg-canvas-deep" : "relative aspect-square overflow-hidden bg-canvas-deep"}>
                    <Image src={image} alt={`${product.name}${images.length > 1 ? ` view ${index + 1}` : ""}`} fill priority={index === 0} sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" />
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{category?.name ?? "Furniture"}</p>
              <h1 className="mt-4 font-display text-5xl leading-[0.9] tracking-[-0.04em] text-ink sm:text-6xl">{product.name}</h1>
              <p className="mt-6 text-lg leading-8 text-ink-soft">{product.short_description}</p>
              {product.description && <div className="mt-6 whitespace-pre-line text-sm leading-7 text-muted">{product.description}</div>}
              <dl className="mt-8 divide-y divide-hairline border-y border-hairline">
                {productWoods.length > 0 && <div className="grid grid-cols-[7rem_1fr] gap-4 py-4"><dt className="text-sm font-bold text-ink">Wood</dt><dd className="text-sm text-ink-soft">{productWoods.map((wood) => wood.name).join(", ")}</dd></div>}
                {product.dimensions && <div className="grid grid-cols-[7rem_1fr] gap-4 py-4"><dt className="text-sm font-bold text-ink">Dimensions</dt><dd className="text-sm text-ink-soft">{product.dimensions}</dd></div>}
                {product.price_note && <div className="grid grid-cols-[7rem_1fr] gap-4 py-4"><dt className="text-sm font-bold text-ink">Price</dt><dd className="text-sm text-ink-soft">{product.price_note}</dd></div>}
              </dl>
              <a href="#enquiry" className="mt-8 inline-flex min-h-12 items-center bg-accent px-6 font-semibold text-white transition-colors hover:bg-accent-deep">Enquire about this piece</a>
            </Reveal>
          </div>
          <Reveal id="enquiry" className="scroll-mt-28 mt-20 border border-hairline bg-surface p-6 sm:p-10 lg:p-14">
            <InquiryForm categorySlug={product.category_slug} productId={product.id} productName={product.name} title={`Enquire about ${product.name}`} />
          </Reveal>
        </Container>
      </div>
    </>
  );
}
