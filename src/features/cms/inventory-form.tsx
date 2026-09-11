"use client";
import { LoaderCircle, Save, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormSection, StickyActions } from "@/components/cms/cms-page";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { inventoryInputSchema } from "@/features/cms/inventory.schema";
import { submitRequest } from "@/lib/submit";
import type { InventoryItem } from "@/types/database";

export function InventoryForm({ item, photo }: { item?: InventoryItem; photo?: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const body = new FormData(event.currentTarget);
    const checked = inventoryInputSchema.safeParse(Object.fromEntries(body));
    if (!checked.success) { setError(checked.error.issues[0]?.message ?? "Check the item."); return; }

    setSaving(true);
    const result = await submitRequest(
      item ? `/api/cms/inventory/${item.id}` : "/api/cms/inventory",
      { method: item ? "PUT" : "POST", body },
      "The item could not be saved.",
    );
    if (!result.ok) { setError(result.message); setSaving(false); return; }
    router.push("/factory/inventory");
    router.refresh();
  }

  async function remove() {
    if (!item || !window.confirm(`Remove ${item.name} from the inventory? This cannot be undone.`)) return;
    setDeleting(true);
    const result = await submitRequest(`/api/cms/inventory/${item.id}`, { method: "DELETE" }, "The item could not be removed.");
    if (!result.ok) { setError(result.message); setDeleting(false); return; }
    router.push("/factory/inventory");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormSection title="Item" hint="The code number is what an invoice line uses to take stock out.">
        <Field label="Code no." htmlFor="code" hint="For example PTF-LMP-01. Must be unique.">
          <Input id="code" name="code" maxLength={40} defaultValue={item?.code ?? ""} required />
        </Field>
        <Field label="Item name" htmlFor="name">
          <Input id="name" name="name" maxLength={200} defaultValue={item?.name ?? ""} required />
        </Field>
        <Field label="Quantity in stock" htmlFor="quantity">
          <Input id="quantity" name="quantity" type="number" min={0} max={1000000} step={1} defaultValue={item?.quantity ?? 0} required />
        </Field>
        <Field label="Note" htmlFor="note">
          <Input id="note" name="note" maxLength={400} defaultValue={item?.note ?? ""} placeholder="Optional" />
        </Field>
      </FormSection>

      <FormSection title="Picture" hint="JPEG, PNG, WebP or AVIF, up to 8 MB.">
        <Field label={photo ? "Replace the picture" : "Add a picture"} htmlFor="image" className="sm:col-span-2">
          <Input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif"
            className="file:mr-3 file:rounded-[var(--radius-ui)] file:border-0 file:bg-wash file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink-soft" />
        </Field>
        {photo && (
          <div className="sm:col-span-2">
            <div className="relative aspect-square w-36 overflow-hidden rounded-[var(--radius-ui)] bg-canvas-deep">
              <Image src={photo} alt="" fill sizes="144px" className="object-cover" unoptimized />
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" name="removeImage" className="h-4 w-4 accent-accent" />
              Remove this picture
            </label>
          </div>
        )}
      </FormSection>

      {error && <p role="alert" className="rounded-[var(--radius-card)] border border-accent/30 bg-accent/8 p-4 text-sm text-accent-deep">{error}</p>}

      <StickyActions>
        <Button type="submit" size="lg" disabled={saving || deleting}>
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          {saving ? "Saving" : "Save item"}
        </Button>
        {item && (
          <Button type="button" variant="outline" size="lg" onClick={remove} disabled={saving || deleting}>
            {deleting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
            {deleting ? "Removing" : "Remove"}
          </Button>
        )}
      </StickyActions>
    </form>
  );
}
