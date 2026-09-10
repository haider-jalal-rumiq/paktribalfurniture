"use client";

import { Check, LoaderCircle, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormSection, StickyActions } from "@/components/cms/cms-page";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { clientTypes } from "@/content/cms";
import { clientInputSchema } from "@/features/cms/client.schema";
import { postJson, submitRequest } from "@/lib/submit";
import type { Client } from "@/types/database";

export function ClientForm({ client }: { client?: Client }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(event.currentTarget);
    // The same schema the route uses, so the two can never drift.
    const parsed = clientInputSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the client details.");
      setSaving(false);
      return;
    }

    const result = client
      ? await submitRequest(
          `/api/cms/clients/${client.id}`,
          {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(parsed.data),
          },
          "The client could not be saved.",
        )
      : await postJson("/api/cms/clients", parsed.data, "The client could not be saved.");

    if (!result.ok || !result.id) {
      setError(result.message || "The client could not be saved.");
      setSaving(false);
      return;
    }

    setSaved(true);
    router.push(`/factory/clients/${result.id}`);
    router.refresh();
  }

  async function remove() {
    if (!client || !window.confirm(`Delete ${client.name}? This cannot be undone.`)) return;
    setDeleting(true);
    setError("");

    const result = await submitRequest(
      `/api/cms/clients/${client.id}`,
      { method: "DELETE" },
      "The client could not be deleted.",
    );
    if (!result.ok) {
      setError(result.message);
      setDeleting(false);
      return;
    }

    router.push("/factory/clients");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormSection title="Client details">
        <Field label="Client name" htmlFor="name">
          <Input id="name" name="name" defaultValue={client?.name ?? ""} required autoComplete="off" />
        </Field>
        <Field label="Type" htmlFor="type">
          <Select id="type" name="type" defaultValue={client?.type ?? "individual"} required>
            {clientTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Phone" htmlFor="phone">
          <Input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={client?.phone ?? ""} />
        </Field>
        <Field label="Address" htmlFor="address" className="sm:col-span-2">
          <Textarea id="address" name="address" rows={2} defaultValue={client?.address ?? ""} />
        </Field>
        <Field label="Notes" htmlFor="notes" className="sm:col-span-2">
          <Textarea id="notes" name="notes" rows={4} defaultValue={client?.notes ?? ""} />
        </Field>
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
          {saved ? "Saved — opening" : saving ? "Saving" : "Save client"}
        </Button>
        {client && (
          <Button type="button" variant="outline" size="lg" onClick={remove} disabled={saving || deleting}>
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
