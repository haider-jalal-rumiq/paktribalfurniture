"use client";

import { Bell, BellOff, LoaderCircle, Share } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { postJson, submitRequest } from "@/lib/submit";

type State = "loading" | "unsupported" | "needs-install" | "off" | "on" | "blocked";

/**
 * VAPID keys travel as base64url; PushManager wants raw bytes. Backed by an
 * explicit ArrayBuffer so the result satisfies BufferSource.
 */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function PushToggle({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function detect() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        // iOS only exposes PushManager once the app is on the Home Screen.
        setState(isIos() && !isStandalone() ? "needs-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setState("blocked");
        return;
      }
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const subscription = await registration?.pushManager.getSubscription();
      setState(subscription ? "on" : "off");
    }
    void detect();
  }, []);

  async function enable() {
    setBusy(true);
    setError("");
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "off");
        setBusy(false);
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const result = await postJson(
        "/api/cms/push/subscribe",
        { ...subscription.toJSON(), label: navigator.platform || undefined },
        "Notifications could not be enabled.",
      );

      if (!result.ok) {
        await subscription.unsubscribe();
        setError(result.message);
        setBusy(false);
        return;
      }

      setState("on");
    } catch {
      setError("Notifications could not be enabled on this device.");
    }
    setBusy(false);
  }

  async function disable() {
    setBusy(true);
    setError("");
    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        await submitRequest(
          "/api/cms/push/subscribe",
          {
            method: "DELETE",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          },
          "Notifications could not be turned off.",
        );
        await subscription.unsubscribe();
      }
      setState("off");
    } catch {
      setError("Notifications could not be turned off on this device.");
    }
    setBusy(false);
  }

  if (state === "loading") {
    return <p className="text-sm text-muted">Checking this device…</p>;
  }

  if (state === "needs-install") {
    return (
      <div className="flex items-start gap-3 border border-hairline bg-canvas-deep p-4 text-sm leading-6 text-ink-soft">
        <Share className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        <p>
          On iPhone, notifications only work once this is on your Home Screen. Tap{" "}
          <strong>Share</strong>, then <strong>Add to Home Screen</strong>, open it from there, and
          come back to this page.
        </p>
      </div>
    );
  }

  if (state === "unsupported") {
    return (
      <p className="text-sm text-muted">
        This browser cannot show notifications. The dashboard still lists everything due soon.
      </p>
    );
  }

  if (state === "blocked") {
    return (
      <p className="text-sm text-accent-deep">
        Notifications are blocked for this site. Re-allow them in your browser settings, then reload.
      </p>
    );
  }

  return (
    <div>
      <Button type="button" variant={state === "on" ? "outline" : "primary"} onClick={state === "on" ? disable : enable} disabled={busy}>
        {busy ? (
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : state === "on" ? (
          <BellOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Bell className="h-4 w-4" aria-hidden="true" />
        )}
        {state === "on" ? "Turn off on this device" : "Turn on for this device"}
      </Button>
      {state === "on" && (
        <p className="mt-3 text-sm text-muted">
          This device will be notified two days before an order is due.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-accent-deep">
          {error}
        </p>
      )}
    </div>
  );
}
