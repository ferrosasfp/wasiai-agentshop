import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import {
  SETTLE_API_SECRET,
  SETTLE_RATE_LIMIT_MAX,
  SETTLE_RATE_LIMIT_WINDOW_MS,
} from "@/infra/env";
import { buildCashOutMatch, pickPartner } from "@/core/payout";

/**
 * Security guard for `POST /api/settle` (audit finding M3).
 *
 * The settle route signs REAL EIP-3009 authorizations and relays them to the
 * shared production facilitator. Before this module it had no auth, no CSRF, no
 * rate limit and trusted `body.match.netDeliveredUSD` (attacker-controlled).
 * This module provides:
 *   1. Bearer-token authentication (constant-time) — fails CLOSED.
 *   2. A best-effort in-memory per-IP rate limit.
 *   3. Strict `zod` validation of the request body (zod was a dead dep).
 *   4. Server-side re-derivation of `netDeliveredUSD` so the settled amount
 *      never comes from the client.
 */

// ---------------------------------------------------------------------------
// zod schema — validates the SettleBody shape (mirrors src/types/remittance.ts)
// ---------------------------------------------------------------------------

export const remittanceSchema = z.object({
  id: z.string(),
  sender: z.object({
    name: z.string(),
    country: z.enum(["US", "CA", "ES"]),
    legalId: z.string(),
  }),
  receiver: z.object({
    name: z.string(),
    country: z.enum(["MX", "CO", "PE", "AR"]),
    city: z.string(),
    cashOutPreference: z.enum(["oxxo", "bank", "wallet"]),
  }),
  amountUSD: z.number().finite().positive(),
  purpose: z.enum(["family-support", "education", "medical", "general"]),
  createdAt: z.string(),
  status: z.enum([
    "pending",
    "validating",
    "discovering",
    "matching",
    "ready",
    "settling",
    "settled",
    "rejected",
  ]),
});

const corridorSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  fxRate: z.number().finite(),
  spreadBps: z.number().finite().optional(),
  feeFlatUSD: z.number().finite(),
  feePctBps: z.number().finite(),
  speedSeconds: z.number().finite(),
  reliabilityScore: z.number().finite(),
  liquidityUSD: z.number().finite(),
});

export const corridorDiscoverySchema = z.object({
  shortlist: z.array(corridorSchema),
  recommended: corridorSchema,
  rationale: z.string(),
  agentPromptId: z.string(),
});

const cashOutMatchSchema = z.object({
  partnerId: z.string(),
  partnerName: z.string(),
  partnerType: z.enum(["oxxo", "bank", "wallet"]),
  cityCoverage: z.string(),
  recipientFee: z.number().finite(),
  estimatedPayoutMinutes: z.number().finite(),
  netDeliveredLocal: z.number().finite(),
  localCurrency: z.enum(["MXN", "COP", "PEN", "ARS"]),
  netDeliveredUSD: z.number().finite(),
  exchangeRate: z.number().finite(),
});

export const settleBodySchema = z.object({
  remittance: remittanceSchema,
  corridor: corridorDiscoverySchema,
  match: cashOutMatchSchema,
});

export type SettleBody = z.infer<typeof settleBodySchema>;

// ---------------------------------------------------------------------------
// Pipeline body schemas — /api/kyc, /api/discover, /api/match (audit N4)
// Mirror the loose `{ remittance }` / `{ remittance, corridor }` shapes the
// routes and Server Actions accept, reusing the same field validators as settle.
// ---------------------------------------------------------------------------

export const kycBodySchema = z.object({ remittance: remittanceSchema });
export const discoverBodySchema = z.object({ remittance: remittanceSchema });
export const matchBodySchema = z.object({
  remittance: remittanceSchema,
  corridor: corridorDiscoverySchema,
});

// ---------------------------------------------------------------------------
// Authentication — constant-time Bearer check, fails CLOSED
// ---------------------------------------------------------------------------

/**
 * Generic `Authorization: Bearer <SETTLE_API_SECRET>` check for the money-path
 * HTTP routes. Shared by `/api/settle` AND the pipeline routes `/api/kyc`,
 * `/api/discover`, `/api/match` (audit finding N4) — all of which can trigger
 * REAL on-chain spend and therefore must not be world-callable.
 *
 * Fails CLOSED: if `SETTLE_API_SECRET` is unset/empty every request is rejected
 * (you cannot authenticate against a non-existent secret). Uses a constant-time
 * comparison to avoid leaking the secret via timing.
 */
export function authenticateApi(req: Request): boolean {
  const secret = SETTLE_API_SECRET;
  if (!secret) return false; // fail closed — no secret configured

  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return false;
  const presented = match[1].trim();

  const a = Buffer.from(presented);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false; // timingSafeEqual requires equal length
  return timingSafeEqual(a, b);
}

/**
 * Validates `Authorization: Bearer <SETTLE_API_SECRET>` for `/api/settle`.
 * Thin alias over {@link authenticateApi} kept for the M3 call-sites; the
 * timing-safe comparison lives in one place only.
 */
export function authenticateSettle(req: Request): boolean {
  return authenticateApi(req);
}

// ---------------------------------------------------------------------------
// Rate limit — best-effort in-memory fixed window per key (IP)
//
// MNR-1 (audit): this window lives in process memory, so it does NOT survive a
// multi-instance / serverless fan-out — each instance keeps its own counter.
// Acceptable for a testnet demo (the on-chain 0.5 PYUSD cap is the hard limit);
// move to a shared store (Redis/Upstash) before mainnet.
// ---------------------------------------------------------------------------

interface WindowState {
  count: number;
  resetAt: number;
}

const rateState = new Map<string, WindowState>();

/** Minimal shape shared by `Request.headers` and Next's `headers()`. */
export interface HeaderReader {
  get(name: string): string | null;
}

/**
 * Best-effort client IP for rate-limit bucketing. MNR-2 (audit): trusts the
 * first `x-forwarded-for` hop, which a caller can spoof to dodge the per-IP
 * throttle. Acceptable for a testnet demo (the on-chain 0.5 PYUSD cap +
 * server-side amount re-derivation are the hard limits); harden with a
 * platform-provided IP before any mainnet/high-value use.
 */
export function getClientIp(headers: HeaderReader): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds?: number;
}

/**
 * Optional per-call overrides for {@link checkRateLimit}. When omitted the
 * settle defaults (`SETTLE_RATE_LIMIT_*`) apply, so existing settle call-sites
 * are unchanged. The pipeline routes/actions pass their own, more generous
 * `API_RATE_LIMIT_*` window (audit N4).
 */
export interface RateLimitOptions {
  max?: number;
  windowMs?: number;
}

export function checkRateLimit(
  key: string,
  now: number = Date.now(),
  opts?: RateLimitOptions,
): RateLimitResult {
  const windowMs = opts?.windowMs ?? SETTLE_RATE_LIMIT_WINDOW_MS;
  const max = opts?.max ?? SETTLE_RATE_LIMIT_MAX;

  const state = rateState.get(key);
  if (!state || now >= state.resetAt) {
    rateState.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (state.count >= max) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((state.resetAt - now) / 1000)),
    };
  }

  state.count += 1;
  return { ok: true };
}

/** Test-only: clears the in-memory rate-limit window state. */
export function __resetRateLimit(): void {
  rateState.clear();
}

// ---------------------------------------------------------------------------
// Server-side re-derivation of the settled amount (never trust the client)
// ---------------------------------------------------------------------------

/**
 * Recomputes `netDeliveredUSD` from the remittance amount + recommended
 * corridor + the server-side partner catalog, ignoring the client-supplied
 * `match.netDeliveredUSD`. Clamped to >= 0; the caller still applies the strict
 * upper-bound `ONCHAIN_AMOUNT_CAP_PYUSD`.
 */
export function deriveTrustedNetDeliveredUSD(body: SettleBody): number {
  const partner = pickPartner({ remittance: body.remittance });
  const rederived = buildCashOutMatch({
    remittance: body.remittance,
    corridor: body.corridor.recommended,
    partner,
  });
  return Math.max(0, rederived.netDeliveredUSD);
}
