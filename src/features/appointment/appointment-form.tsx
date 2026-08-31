"use client";

import { useRef, useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import { Check, Loader2 } from "lucide-react";

import { useReducedMotionSafe } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { site } from "@/content/site";
import {
  APPOINTMENT_REASONS,
  PREFERRED_DAYS,
  PREFERRED_TIMES,
  appointmentSchema,
  type AppointmentInput,
  type AppointmentResponse,
} from "@/features/appointment/appointment.schema";

type Status = "idle" | "submitting" | "success" | "error";

export function AppointmentForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotionSafe();

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<AppointmentInput>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      reason: "New glasses",
      preferredDay: "Any weekday",
      preferredTime: "Any time",
      website: "",
    },
  });

  async function onSubmit(values: AppointmentInput) {
    setStatus("submitting");
    setFormError(null);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result: AppointmentResponse = await response.json();

      if (!result.success) {
        // Server-side field errors win — that pass is the authoritative one.
        if (result.errors) {
          for (const [field, message] of Object.entries(result.errors)) {
            setError(field as keyof AppointmentInput, { message });
          }
        }
        setFormError(result.message);
        setStatus("error");
        return;
      }

      setStatus("success");
      // Move focus to the confirmation so screen readers land on the outcome.
      requestAnimationFrame(() => successRef.current?.focus());
    } catch {
      setFormError(
        `We could not send that. Please call us at ${site.phone} and we will help right away.`,
      );
      setStatus("error");
    }
  }

  /** Focus the first invalid control when client-side validation fails. */
  function onInvalid(fieldErrors: FieldErrors<AppointmentInput>) {
    const first = Object.keys(fieldErrors)[0] as
      | keyof AppointmentInput
      | undefined;
    if (first) setFocus(first);
  }

  if (status === "success") {
    return (
      <motion.div
        ref={successRef}
        tabIndex={-1}
        role="status"
        initial={{ opacity: 0, y: reduce ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-start gap-4 rounded-[var(--radius-card)] border border-sage/30 bg-sage/8 p-8 focus:outline-none"
      >
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-sage text-canvas">
          <Check className="h-6 w-6" aria-hidden="true" />
        </span>
        <h3 className="font-display text-2xl text-ink">Request received</h3>
        <p className="max-w-md text-ink-soft">
          Thanks &mdash; we&apos;ll call to confirm within one business day. If
          you need us sooner, ring{" "}
          <a
            href={site.phoneHref}
            className="font-medium text-clay underline underline-offset-4"
          >
            {site.phone}
          </a>
          .
        </p>
      </motion.div>
    );
  }

  const busy = status === "submitting";

  return (
    <form
      // Built inside the handler: composing it during render would let the
      // lint rule (rightly) see a ref being read at render time.
      onSubmit={(event) => void handleSubmit(onSubmit, onInvalid)(event)}
      noValidate
      className="flex flex-col gap-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="name" error={errors.name?.message}>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Jane Whitehorse"
            invalid={Boolean(errors.name)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
        </Field>

        <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="(602) 555-0134"
            invalid={Boolean(errors.phone)}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            {...register("phone")}
          />
        </Field>
      </div>

      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          invalid={Boolean(errors.email)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
      </Field>

      <Field
        label="What do you need?"
        htmlFor="reason"
        error={errors.reason?.message}
      >
        <Select
          id="reason"
          invalid={Boolean(errors.reason)}
          {...register("reason")}
        >
          {APPOINTMENT_REASONS.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Preferred day" htmlFor="preferredDay">
          <Select id="preferredDay" {...register("preferredDay")}>
            {PREFERRED_DAYS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </Select>
        </Field>

        <Field label="Preferred time" htmlFor="preferredTime">
          <Select id="preferredTime" {...register("preferredTime")}>
            {PREFERRED_TIMES.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Anything else? (optional)"
        htmlFor="message"
        hint="Prescription on hand, frames you are after, insurance questions — whatever helps."
        error={errors.message?.message}
      >
        <Textarea
          id="message"
          rows={4}
          invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : "message-hint"}
          {...register("message")}
        />
      </Field>

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="website">Leave this field empty</label>
        <input
          id="website"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>

      <AnimatePresence>
        {formError && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-clay/30 bg-clay/8 px-4 py-3 text-sm text-clay-deep"
          >
            {formError}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <Button type="submit" size="lg" disabled={busy}>
          {busy && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {busy ? "Sending…" : "Request an appointment"}
        </Button>
        <p className="text-sm text-stone">
          Or call{" "}
          <a
            href={site.phoneHref}
            className="font-medium text-ink-soft underline underline-offset-4"
          >
            {site.phone}
          </a>
        </p>
      </div>
    </form>
  );
}
