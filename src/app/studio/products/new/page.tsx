import Link from "next/link";

import { Container } from "@/components/layout/container";
import { ProductEditor } from "@/features/studio/product-editor";

export default function NewProductPage() {
  return <div className="pb-24 pt-32 sm:pt-36"><Container><Link href="/studio" className="text-sm font-semibold text-accent">Back to Studio</Link><h1 className="mt-5 font-display text-5xl leading-none text-ink sm:text-6xl">Add a product</h1><div className="mt-10 border-t border-hairline pt-10"><ProductEditor /></div></Container></div>;
}
