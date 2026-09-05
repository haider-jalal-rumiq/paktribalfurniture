/**
 * The one place a CMS form talks to the server.
 *
 * `fetch` REJECTS on a network failure — server down, wifi dropped, phone in a
 * dead spot — it does not return a non-ok response. A bare `await fetch(...)`
 * therefore throws straight past the `setSaving(false)` line and leaves the
 * button spinning forever with no message. On a phone in a workshop that is not
 * an edge case, so every call goes through here instead: this never throws, and
 * it never hangs indefinitely.
 */

export interface SubmitResult {
  ok: boolean;
  id?: string;
  /** Always a usable sentence when `ok` is false; empty string on success. */
  message: string;
}

/** Generous, because an order can carry six photos over a slow uplink. */
const TIMEOUT_MS = 90_000;

export async function submitRequest(
  url: string,
  init: RequestInit,
  fallbackMessage = "That could not be saved.",
): Promise<SubmitResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const result = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
    };

    if (!response.ok) {
      return {
        ok: false,
        message:
          result.message ??
          (response.status === 401
            ? "Your session has expired. Sign in again."
            : fallbackMessage),
      };
    }

    return { ok: true, id: result.id, message: "" };
  } catch (error) {
    if ((error as Error)?.name === "AbortError") {
      return {
        ok: false,
        message:
          "That took too long and was stopped. Check the list before trying again — it may have saved.",
      };
    }
    return {
      ok: false,
      message: "Could not reach the server. Check your connection and try again.",
    };
  } finally {
    clearTimeout(timer);
  }
}

export const postJson = (url: string, body: unknown, fallbackMessage?: string) =>
  submitRequest(
    url,
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
    fallbackMessage,
  );
