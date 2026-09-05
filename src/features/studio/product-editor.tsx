"use client";

import Image from "next/image";
import { LoaderCircle, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { categories } from "@/content/catalog";
import { woodTypes } from "@/content/site";
import { submitRequest } from "@/lib/submit";
import type { Product } from "@/types/database";

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function ProductEditor({ product }: { product?: Product }) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const result = await submitRequest(product ? `/api/studio/products/${product.id}` : "/api/studio/products", { method: product ? "PUT" : "POST", body: new FormData(event.currentTarget) }, "The product could not be saved.");
    if (!result.ok || !result.id) {
      setError(result.message || "The product could not be saved.");
      setSaving(false);
      return;
    }
    router.push(`/studio/products/${result.id}`);
    router.refresh();
    setSaving(false);
  }

  async function deleteProduct() {
    if (!product || !window.confirm(`Delete ${product.name}? This cannot be undone.`)) return;
    setDeleting(true);
    setError("");
    const result = await submitRequest(`/api/studio/products/${product.id}`, { method: "DELETE" }, "The product could not be deleted.");
    if (!result.ok) {
      setError(result.message);
      setDeleting(false);
      return;
    }
    router.push("/studio");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Product name" htmlFor="name"><Input id="name" name="name" value={name} onChange={(event) => { setName(event.target.value); if (!slugTouched) setSlug(slugify(event.target.value)); }} required /></Field>
        <Field label="URL slug" htmlFor="slug" hint="Lowercase words separated by hyphens"><Input id="slug" name="slug" value={slug} onChange={(event) => { setSlugTouched(true); setSlug(slugify(event.target.value)); }} required /></Field>
        <Field label="Category" htmlFor="categorySlug"><Select id="categorySlug" name="categorySlug" defaultValue={product?.category_slug ?? ""} required><option value="" disabled>Choose a category</option>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</Select></Field>
        <Field label="Dimensions" htmlFor="dimensions" hint="Use the unit customers should see"><Input id="dimensions" name="dimensions" defaultValue={product?.dimensions ?? ""} /></Field>
        <Field label="Short description" htmlFor="shortDescription" className="sm:col-span-2"><Textarea id="shortDescription" name="shortDescription" rows={3} maxLength={220} defaultValue={product?.short_description ?? ""} required /></Field>
        <Field label="Full description" htmlFor="description" className="sm:col-span-2"><Textarea id="description" name="description" rows={8} defaultValue={product?.description ?? ""} /></Field>
        <Field label="Price note" htmlFor="priceNote" hint="For example: Price on enquiry"><Input id="priceNote" name="priceNote" defaultValue={product?.price_note ?? ""} /></Field>
        <Field label="Product photos" htmlFor="images" hint="JPEG, PNG, WebP, or AVIF. Up to 6 files, 8 MB each."><Input id="images" name="images" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple /></Field>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-ink-soft">Available woods</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {woodTypes.map((wood) => <label key={wood.slug} className="flex min-h-11 items-center gap-3 border border-hairline bg-surface px-4 text-sm text-ink"><input type="checkbox" name="woodTypes" value={wood.slug} defaultChecked={product?.wood_types.includes(wood.slug)} className="accent-accent" />{wood.name}</label>)}
        </div>
      </fieldset>

      {product?.image_urls.length ? (
        <fieldset>
          <legend className="text-sm font-semibold text-ink-soft">Current photos</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {product.image_urls.map((url) => <label key={url} className="group relative aspect-square overflow-hidden bg-canvas-deep"><Image src={url} alt="" fill sizes="25vw" className="object-cover" /><span className="absolute inset-x-2 bottom-2 bg-surface/92 p-2 text-xs font-semibold text-ink"><input type="checkbox" name="existingImageUrls" value={url} defaultChecked className="mr-2 accent-accent" />Keep photo</span></label>)}
          </div>
        </fieldset>
      ) : null}

      <div className="flex flex-wrap gap-5 border-y border-hairline py-5">
        <label className="flex items-center gap-3 text-sm font-semibold text-ink"><input type="checkbox" name="featured" defaultChecked={product?.featured} className="h-4 w-4 accent-accent" />Feature on home page</label>
        <label className="flex items-center gap-3 text-sm font-semibold text-ink"><input type="checkbox" name="published" defaultChecked={product?.published} className="h-4 w-4 accent-accent" />Publish in catalogue</label>
      </div>
      {error && <p role="alert" className="border border-accent/30 bg-accent/8 p-4 text-sm text-accent-deep">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={saving || deleting}>{saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}{saving ? "Saving product" : "Save product"}</Button>
        {product && <Button type="button" variant="outline" size="lg" onClick={deleteProduct} disabled={saving || deleting}>{deleting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}{deleting ? "Deleting" : "Delete product"}</Button>}
      </div>
    </form>
  );
}
