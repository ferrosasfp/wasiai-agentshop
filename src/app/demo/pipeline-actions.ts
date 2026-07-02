"use server";

import { headers } from "next/headers";
import { runKyc, type KycRun } from "@/application/run-kyc";
import { discoverCorridor, type CorridorRun } from "@/application/discover-corridor";
import { matchCashOut, type MatchRun } from "@/application/match-cashout";
import { API_RATE_LIMIT_MAX, API_RATE_LIMIT_WINDOW_MS } from "@/infra/env";
import {
  checkRateLimit,
  discoverBodySchema,
  getClientIp,
  kycBodySchema,
  matchBodySchema,
} from "@/infra/settle-guard";
import type { TraceEvent } from "@/types/trace";

/**
 * Server Actions backing the demo pipeline (audit finding N4).
 *
 * Why actions instead of `fetch("/api/kyc" | "/api/discover" | "/api/match")`
 * from the browser: those HTTP routes now require
 * `Authorization: Bearer <SETTLE_API_SECRET>` and fail CLOSED, because each one
 * can trigger REAL on-chain spend (in real mode they call `composeOnA2A`, which
 * debits the shared A2A_KEY budget). The Bearer secret can NEVER ship to a
 * client component (it would leak into the bundle and defeat the auth). These
 * actions run SERVER-SIDE, so the demo reaches the pipeline logic directly
 * without exposing the secret — exactly the pattern M3 used for settle.
 *
 * Defenses (mirroring the closed routes): a best-effort per-IP rate limit
 * under a dedicated `pipeline:` bucket (separate from the settle counter), and
 * strict `zod` validation of the input. In demo mode (`NEXT_PUBLIC_DEMO_MODE`)
 * the underlying run* functions return mocks with no spend; in real mode the
 * on-chain A2A budget cap is the hard limit.
 */

const RATE_OPTS = {
  max: API_RATE_LIMIT_MAX,
  windowMs: API_RATE_LIMIT_WINDOW_MS,
};

export type KycActionResult =
  | { ok: true; result: KycRun; trace: TraceEvent }
  | { ok: false; error: string; retryAfterSeconds?: number };

export type DiscoverActionResult =
  | { ok: true; result: CorridorRun; trace: TraceEvent }
  | { ok: false; error: string; retryAfterSeconds?: number };

export type MatchActionResult =
  | { ok: true; result: MatchRun; trace: TraceEvent }
  | { ok: false; error: string; retryAfterSeconds?: number };

function throttled(): { ok: false; error: string; retryAfterSeconds?: number } | null {
  // Bucket under a `pipeline:` namespace so pipeline traffic and settle traffic
  // keep independent per-IP counters.
  const ip = getClientIp(headers());
  const rate = checkRateLimit(`pipeline:${ip}`, Date.now(), RATE_OPTS);
  if (!rate.ok) {
    return {
      ok: false,
      error: "rate limit exceeded",
      retryAfterSeconds: rate.retryAfterSeconds,
    };
  }
  return null;
}

export async function kycAction(input: unknown): Promise<KycActionResult> {
  const limited = throttled();
  if (limited) return limited;

  const parsed = kycBodySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid body" };

  try {
    const result = await runKyc(parsed.data.remittance);
    return { ok: true, result, trace: result.trace };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "kyc failed" };
  }
}

export async function discoverAction(input: unknown): Promise<DiscoverActionResult> {
  const limited = throttled();
  if (limited) return limited;

  const parsed = discoverBodySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid body" };

  try {
    const result = await discoverCorridor(parsed.data.remittance);
    return { ok: true, result, trace: result.trace };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "discover failed" };
  }
}

export async function matchAction(input: unknown): Promise<MatchActionResult> {
  const limited = throttled();
  if (limited) return limited;

  const parsed = matchBodySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid body" };

  try {
    const result = await matchCashOut(parsed.data.remittance, parsed.data.corridor);
    return { ok: true, result, trace: result.trace };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "match failed" };
  }
}
