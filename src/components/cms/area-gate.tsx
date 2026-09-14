"use client";
import { useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Lock, LockOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { AREA_LOCK_PIN, areaFor, isOpenPath, type LockedApp } from "@/lib/area-lock";

const storageKey = (area: LockedApp) => `ptf-area-unlocked-${area}`;

/**
 * The unlock flag as an external store (sessionStorage) so
 * useSyncExternalStore can read it without a setState-in-effect, and so the
 * server-rendered "locked" HTML can never mismatch the client's first paint
 * — the server snapshot is always false, and React reconciles the real
 * value right after hydration.
 */
const listeners = new Map<LockedApp, Set<() => void>>();

function subscribe(area: LockedApp, listener: () => void) {
  const set = listeners.get(area) ?? new Set();
  set.add(listener);
  listeners.set(area, set);
  return () => set.delete(listener);
}

function readUnlocked(area: LockedApp): boolean {
  return sessionStorage.getItem(storageKey(area)) === "1";
}

function writeUnlocked(area: LockedApp, value: boolean) {
  if (value) sessionStorage.setItem(storageKey(area), "1");
  else sessionStorage.removeItem(storageKey(area));
  for (const listener of listeners.get(area) ?? []) listener();
}

function PinScreen({ area }: { area: LockedApp }) {
  const [error, setError] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const pin = new FormData(event.currentTarget).get("pin");
    if (pin === AREA_LOCK_PIN) { writeUnlocked(area, true); return; }
    event.currentTarget.reset();
    setError(true);
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-canvas px-4">
      <form onSubmit={submit} className="w-full max-w-xs rounded-[var(--radius-card)] border border-hairline bg-surface p-6 text-center shadow-[var(--shadow-card)]">
        <Lock className="mx-auto h-8 w-8 text-accent" aria-hidden="true" />
        <h1 className="mt-3 font-display text-xl text-ink">This section is locked</h1>
        <p className="mt-1 text-sm text-muted">Enter the password to continue.</p>
        <Input
          name="pin"
          type="password"
          inputMode="numeric"
          autoFocus
          aria-label="Password"
          onChange={() => setError(false)}
          className="mt-4 text-center text-lg tracking-[0.3em]"
        />
        {error && <p role="alert" className="mt-2 text-sm text-accent-deep">Wrong password.</p>}
        <Button type="submit" className="mt-4 w-full">Unlock</Button>
      </form>
    </div>
  );
}

/**
 * Wraps every /factory and /shop page. An open tab's subtree renders
 * straight through; a locked one shows a PIN screen first, and the pass
 * carries to every other locked tab for the rest of this browser tab's
 * session (sessionStorage, so a fresh tab or a closed browser locks again).
 */
export function AreaGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const area = areaFor(pathname);
  const open = isOpenPath(pathname);

  const unlocked = useSyncExternalStore(
    (listener) => (area ? subscribe(area, listener) : () => {}),
    () => (area ? readUnlocked(area) : true),
    () => false,
  );

  if (!area || open) return <>{children}</>;

  if (!unlocked) return <PinScreen area={area} />;

  return (
    <>
      <div className="flex items-center justify-end gap-2 border-b border-hairline bg-canvas-deep px-4 py-2 text-xs print:hidden">
        <LockOpen className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
        <span className="text-muted">Unlocked for this visit</span>
        <button type="button" onClick={() => writeUnlocked(area, false)} className="font-semibold text-accent">
          Lock
        </button>
      </div>
      {children}
    </>
  );
}
