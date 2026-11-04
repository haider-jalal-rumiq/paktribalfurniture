"use client";

import type { ChangeEvent } from "react";
import Form from "next/form";

import { Field, Select } from "@/components/ui/field";
import { statusChoicesFor, type OrderFolder } from "@/content/cms";

interface OrderFiltersProps {
  byItems: boolean;
  clientId?: string;
  clients: Array<{ id: string; name: string }>;
  folder: OrderFolder;
  itemQuery?: string;
  status?: string;
}

export function OrderFilters({ byItems, clientId, clients, folder, itemQuery, status }: OrderFiltersProps) {
  const applyFilters = (event: ChangeEvent<HTMLSelectElement>) => {
    event.currentTarget.form?.requestSubmit();
  };

  return <Form
    action="/factory/orders"
    replace
    scroll={false}
    className="mb-6 grid items-end gap-3 sm:grid-cols-2"
  >
    {byItems && <input type="hidden" name="view" value="items" />}
    {folder === "delivered" && <input type="hidden" name="folder" value="delivered" />}
    {itemQuery && <input type="hidden" name="item" value={itemQuery} />}
    <Field label="Client" htmlFor="filterClient" className="min-w-0">
      <Select id="filterClient" name="client" value={clientId ?? ""} onChange={applyFilters}>
        <option value="">All clients</option>
        {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
      </Select>
    </Field>
    <Field label={byItems ? "Item status / urgency" : "Order status / urgency"} htmlFor="filterStatus" className="min-w-0">
      <Select id="filterStatus" name="status" value={status ?? ""} onChange={applyFilters}>
        <option value="">All statuses</option>
        {/* Urgency is an active-folder concern: a delivered order is no longer due. */}
        {folder === "active" && <option value="urgent">Urgent</option>}
        {statusChoicesFor(folder, byItems).map((row) => <option key={row.value} value={row.value}>{row.label}</option>)}
      </Select>
    </Field>
  </Form>;
}
