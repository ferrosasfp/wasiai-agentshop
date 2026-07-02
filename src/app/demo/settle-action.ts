"use server";

import { headers } from "next/headers";
import { runSettle } from "@/application/run-settle";
import type { SettleResult } from "@/application/run-settle";
import {
  checkRateLimit,
  getClientIp,
  settleBodySchema,
} from "@/infra/settle-guard";

/**
 * Server Action backing the demo "Settle" button (M3 fix / BLQ-MED-1).
 *
 * Why an action instead of `fetch("/api/settle")` from the browser:
 * `POST /api/settle` now requires `Authorization: Bearer <SETTLE_API_SECRET>`
 * and fails CLOSED. The secret can NEVER be sent from a client component (it
 * would leak into the bundle and defeat the auth). This action runs
 * SERVER-SIDE, so it reaches the settle logic directly without exposing the
 * secret — the operator private key and SETTLE_API_SECRET stay on the server.
 *
 * Trade-off: like the rest of the demo (anonymous pipeline invocation), this
 * action is callable by anyone who loads the page. It is bounded by the same
 * defenses as the closed route: a per-IP rate limit (below), server-side
 * re-derivation of the settled amount, and the on-chain 0.5 PYUSD cap.
 */
export type SettleActionResult =
  | { ok: true; receipt: SettleResult["receipt"]; traces: SettleResult["traces"] }
  | { ok: false; error: string; retryAfterSeconds?: number };

export async function settleAction(input: unknown): Promise<SettleActionResult> {
  // Rate-limit first (best-effort in-memory, shared with the HTTP route).
  const ip = getClientIp(headers());
  const rate = checkRateLimit(ip);
  if (!rate.ok) {
    return {
      ok: false,
      error: "rate limit exceeded",
      retryAfterSeconds: rate.retryAfterSeconds,
    };
  }

  // Strict body validation — same schema the HTTP route enforces.
  const parsed = settleBodySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid body" };
  }

  try {
    const { receipt, traces } = await runSettle(parsed.data);
    return { ok: true, receipt, traces };
  } catch (e) {
    const message = e instanceof Error ? e.message : "settle failed";
    return { ok: false, error: message };
  }
}
