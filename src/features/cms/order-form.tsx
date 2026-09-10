"use client";

import Image from "next/image";
import { Check, LoaderCircle, Save, Trash2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormSection, StickyActions } from "@/components/cms/cms-page";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { orderStatuses } from "@/content/cms";
import { OrderItemEditor } from "@/features/cms/order-items";
import { orderInputSchema } from "@/features/cms/order.schema";
import { today } from "@/lib/cms-core";
import { submitRequest } from "@/lib/submit";
import type { Client, Order } from "@/types/database";

export function OrderForm({
  order,
  clients,
  photos = [],
  defaultClientId,
}: {
  order?: Order;
  clients: Pick<Client, "id" | "name" | "type">[];
  photos?: { path: string; url: string }[];
  defaultClientId?: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState(order?.items ?? []);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const body = new FormData(event.currentTarget);
    const checked = orderInputSchema.safeParse({ ...Object.fromEntries(body), items, existingImagePaths: body.getAll("existingImagePaths") });
    if (!checked.success) {
      setError(checked.error.issues[0]?.message ?? "Check the order details.");
      setSaving(false);
      return;
    }

    const result = await submitRequest(
      order ? `/api/cms/orders/${order.id}` : "/api/cms/orders",
      { method: order ? "PUT" : "POST", body },
      "The order could not be saved.",
    );

    if (!result.ok || !result.id) {
      setError(result.message || "The order could not be saved.");
      setSaving(false);
      return;
    }

    // Confirm the save before navigating. Opening the order page can be slow,
    // and a spinner that never resolves reads as "it failed" — which is how the
    // same order ends up entered twice.
    setSaved(true);
    router.push(`/factory/orders/${result.id}`);
    router.refresh();
  }

  async function remove() {
    if (!order || !window.confirm(`Delete order #${order.order_no}? This cannot be undone.`)) return;
    setDeleting(true);
    setError("");

    const result = await submitRequest(
      `/api/cms/orders/${order.id}`,
      { method: "DELETE" },
      "The order could not be deleted.",
    );
    if (!result.ok) {
      setError(result.message);
      setDeleting(false);
      return;
    }

    router.push("/factory/orders");
    router.refresh();
  }

  if (!clients.length) {
    return (
      <div className="rounded-[var(--radius-card)] border border-accent/30 bg-accent/8 p-5 text-sm leading-6 text-ink-soft">
        Add a client first — every order belongs to one.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormSection title="Who and what">
        <Field label="Client" htmlFor="clientId">
          <Select
            id="clientId"
            name="clientId"
            defaultValue={order?.client_id ?? defaultClientId ?? ""}
            required
          >
            <option value="" disabled>
              Choose a client
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Site or branch" htmlFor="siteLabel" hint="For example F-8, PWD, or a showroom floor">
          <Input id="siteLabel" name="siteLabel" defaultValue={order?.site_label ?? ""} />
        </Field>

        <Field label="What is being made" htmlFor="title" className="sm:col-span-2">
          <Input
            id="title"
            name="title"
            defaultValue={order?.title ?? ""}
            placeholder="6 dining chairs, rosewood"
            required
          />
        </Field>

        <Field label="Details" htmlFor="description" className="sm:col-span-2">
          <Textarea id="description" name="description" rows={3} defaultValue={order?.description ?? ""} />
        </Field>
      </FormSection>

      <FormSection title="Order items" hint="Each item has its own status. The overall order status is set separately.">
        <OrderItemEditor items={items} onChange={setItems} />
      </FormSection>

      <FormSection title="Status and timing">
        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" defaultValue={order?.status ?? "pending"} required>
            {orderStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Order date" htmlFor="orderDate">
          <Input
            id="orderDate"
            name="orderDate"
            type="date"
            defaultValue={order?.order_date ?? today()}
            required
          />
        </Field>

        <Field label="Expected delivery" htmlFor="expectedDate" hint="Drives the reminder two days before">
          <Input id="expectedDate" name="expectedDate" type="date" defaultValue={order?.expected_date ?? ""} />
        </Field>

        {/* A native checkbox, styled as a switch. The whole row is the target so
            it is thumb-friendly; `has-[:checked]` turns the row red so the state
            is obvious without reading the box. */}
        <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-[var(--radius-ui)] border border-hairline px-4 py-3 transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent/8 sm:col-span-2">
          <input
            type="checkbox"
            name="urgent"
            defaultChecked={order?.urgent ?? false}
            className="peer h-5 w-5 shrink-0 accent-accent"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-ink-soft">Urgent order</span>
            <span className="mt-0.5 block text-xs text-muted">
              Marks this order red in the orders list, and counts on the client row.
            </span>
          </span>
          <TriangleAlert
            className="h-5 w-5 shrink-0 text-hairline peer-checked:text-accent"
            aria-hidden="true"
          />
        </label>
      </FormSection>

      <FormSection title="Delivery">
        <Field label="Delivery address" htmlFor="deliveryAddress" className="sm:col-span-2">
          <Textarea
            id="deliveryAddress"
            name="deliveryAddress"
            rows={2}
            defaultValue={order?.delivery_address ?? ""}
          />
        </Field>

        <Field label="Contact phone" htmlFor="contactPhone" hint="If different from the client's number">
          <Input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            inputMode="tel"
            defaultValue={order?.contact_phone ?? ""}
          />
        </Field>

        <Field label="Notes" htmlFor="notes">
          <Input id="notes" name="notes" defaultValue={order?.notes ?? ""} />
        </Field>
      </FormSection>

      <FormSection title="Photos" hint="JPEG, PNG, WebP or AVIF. Up to 6 files, 8 MB each.">
        <Field label="Add photos" htmlFor="images" className="sm:col-span-2">
          <Input
            id="images"
            name="images"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="file:mr-3 file:rounded-[var(--radius-ui)] file:border-0 file:bg-wash file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink-soft"
          />
        </Field>

        {photos.length > 0 && (
          <div className="sm:col-span-2">
            <p className="text-sm font-semibold text-ink-soft">Current photos</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo) => (
                <label
                  key={photo.path}
                  className="relative aspect-square cursor-pointer overflow-hidden rounded-[var(--radius-ui)] bg-canvas-deep"
                >
                  <Image
                    src={photo.url}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 25vw, 50vw"
                    className="object-cover"
                    unoptimized
                  />
                  <span className="absolute inset-x-1.5 bottom-1.5 flex items-center gap-2 rounded-[var(--radius-ui)] bg-surface/92 px-2 py-1.5 text-xs font-semibold text-ink">
                    <input
                      type="checkbox"
                      name="existingImagePaths"
                      value={photo.path}
                      defaultChecked
                      className="accent-accent"
                    />
                    Keep
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </FormSection>

      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-card)] border border-accent/30 bg-accent/8 p-4 text-sm text-accent-deep"
        >
          {error}
        </p>
      )}

      <StickyActions>
        <Button type="submit" size="lg" disabled={saving || saved || deleting} className="flex-1 sm:flex-none">
          {saved ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : saving ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          {saved ? "Saved — opening" : saving ? "Saving" : "Save order"}
        </Button>
        {order && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={remove}
            disabled={saving || deleting}
          >
            {deleting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            )}
            {deleting ? "Deleting" : "Delete"}
          </Button>
        )}
      </StickyActions>
    </form>
  );
}
