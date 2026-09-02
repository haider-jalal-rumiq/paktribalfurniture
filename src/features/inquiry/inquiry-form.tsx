"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight, LoaderCircle, MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { categories } from "@/content/catalog";
import { site, woodTypes } from "@/content/site";
import { inquirySchema, type InquiryInput } from "@/features/inquiry/inquiry.schema";

interface InquiryFormProps {
  categorySlug?: string;
  productId?: string;
  productName?: string;
  title?: string;
}

export function InquiryForm({ categorySlug = "", productId = "", productName = "", title = "Tell us what you are looking for" }: InquiryFormProps) {
  const pathname = usePathname();
  const [serverError, setServerError] = useState("");
  const [fallbackUrl, setFallbackUrl] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<InquiryInput>({
    resolver: zodResolver(inquirySchema),
    defaultValues: { name: "", phone: "", city: "", categorySlug, productId, productName, woodType: "", message: "", sourcePath: pathname, website: "" },
    shouldFocusError: true,
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError("");
    setFallbackUrl("");
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, sourcePath: pathname }),
      });
      const result = await response.json() as { message?: string; whatsappUrl?: string };
      if (!response.ok || !result.whatsappUrl) {
        setServerError(result.message ?? `We could not save your enquiry. You can contact us on ${site.whatsapp.display}.`);
        setFallbackUrl(result.whatsappUrl ?? "");
        return;
      }
      window.location.assign(result.whatsappUrl);
    } catch {
      setServerError(`We could not save your enquiry. You can contact us on ${site.whatsapp.display}.`);
    }
  });

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-4xl leading-none text-ink sm:text-5xl">{title}</h2>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted">Your enquiry is saved first, then WhatsApp opens with the details ready to send.</p>
      </div>
      <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} invalid={Boolean(errors.name)} {...register("name")} />
        </Field>
        <Field label="Phone number" htmlFor="phone" error={errors.phone?.message}>
          <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "phone-error" : undefined} invalid={Boolean(errors.phone)} {...register("phone")} />
        </Field>
        <Field label="City" htmlFor="city" error={errors.city?.message}>
          <Input id="city" autoComplete="address-level2" aria-invalid={Boolean(errors.city)} aria-describedby={errors.city ? "city-error" : undefined} invalid={Boolean(errors.city)} {...register("city")} />
        </Field>
        <Field label="Furniture category" htmlFor="categorySlug" error={errors.categorySlug?.message}>
          <Select id="categorySlug" aria-invalid={Boolean(errors.categorySlug)} aria-describedby={errors.categorySlug ? "categorySlug-error" : undefined} invalid={Boolean(errors.categorySlug)} {...register("categorySlug")}>
            <option value="">Choose a category</option>
            {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
          </Select>
        </Field>
        <Field label="Preferred wood" htmlFor="woodType" error={errors.woodType?.message} className="sm:col-span-2">
          <Select id="woodType" aria-invalid={Boolean(errors.woodType)} aria-describedby={errors.woodType ? "woodType-error" : undefined} invalid={Boolean(errors.woodType)} {...register("woodType")}>
            <option value="">No preference yet</option>
            {woodTypes.map((wood) => <option key={wood.slug} value={wood.slug}>{wood.name}</option>)}
          </Select>
        </Field>
        <Field label="What would you like to make or ask about?" htmlFor="message" error={errors.message?.message} className="sm:col-span-2">
          <Textarea id="message" rows={6} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "message-error" : undefined} invalid={Boolean(errors.message)} {...register("message")} />
        </Field>
        <input type="hidden" {...register("productId")} />
        <input type="hidden" {...register("productName")} />
        <input type="hidden" {...register("sourcePath")} />
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
        </div>
        {serverError && (
          <div role="alert" className="border border-accent/30 bg-accent/8 p-4 text-sm leading-6 text-accent-deep sm:col-span-2">
            <p>{serverError}</p>
            {fallbackUrl && <a href={fallbackUrl} className="mt-2 inline-flex items-center gap-1 font-bold underline underline-offset-4">Continue on WhatsApp <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></a>}
          </div>
        )}
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:col-span-2 sm:w-auto sm:justify-self-start">
          {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <MessageCircle className="h-4 w-4" aria-hidden="true" />}
          {isSubmitting ? "Saving enquiry" : "Save and continue to WhatsApp"}
        </Button>
      </form>
    </div>
  );
}
