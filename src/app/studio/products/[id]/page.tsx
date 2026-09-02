import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { ProductEditor } from "@/features/studio/product-editor";
import { getStudioProduct } from "@/lib/catalog";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getStudioProduct(id);
  if (!product) notFound();
  return <div className="pb-24 pt-32 sm:pt-36"><Container><Link href="/studio" className="text-sm font-semibold text-accent">Back to Studio</Link><h1 className="mt-5 font-display text-5xl leading-none text-ink sm:text-6xl">Edit {product.name}</h1><div className="mt-10 border-t border-hairline pt-10"><ProductEditor product={product} /></div></Container></div>;
}
