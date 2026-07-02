import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  CashOutMatch,
  CorridorDiscoveryResult,
  Remittance,
} from "@/types/remittance";

/**
 * Security-guard tests for POST /api/settle (audit finding M3).
 *
 * Covers: Bearer auth (fail-closed), per-IP rate limit, zod body validation,
 * and server-side re-derivation of netDeliveredUSD (client value ignored).
 * No network / no on-chain — deriveTrustedNetDeliveredUSD is pure.
 */

const GUARD_KEYS = [
  "SETTLE_API_SECRET",
  "SETTLE_RATE_LIMIT_MAX",
  "SETTLE_RATE_LIMIT_WINDOW_MS",
];

let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = {};
  for (const k of GUARD_KEYS) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
  vi.resetModules();
});

afterEach(() => {
  for (const k of GUARD_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  vi.resetModules();
});

function bearerReq(token?: string): Request {
  const headers: Record<string, string> = { "x-forwarded-for": "1.2.3.4" };
  if (token !== undefined) headers.authorization = `Bearer ${token}`;
  return new Request("http://localhost/api/settle", { method: "POST", headers });
}

const validRemittance: Remittance = {
  id: "rem-1",
  sender: { name: "Maria", country: "US", legalId: "X" },
  receiver: {
    name: "Mama",
    country: "MX",
    city: "Oaxaca de Juárez",
    cashOutPreference: "oxxo",
  },
  amountUSD: 100,
  purpose: "family-support",
  createdAt: new Date().toISOString(),
  status: "ready",
};

const validCorridor: CorridorDiscoveryResult = {
  shortlist: [],
  recommended: {
    id: "corr-1",
    name: "USD→MXN",
    provider: "acme",
    fxRate: 17,
    feeFlatUSD: 2,
    feePctBps: 50,
    speedSeconds: 60,
    reliabilityScore: 0.9,
    liquidityUSD: 1_000_000,
  },
  rationale: "best",
  agentPromptId: "p1",
};

const clientMatch: CashOutMatch = {
  partnerId: "ptr-oxxo-mexico",
  partnerName: "OXXO",
  partnerType: "oxxo",
  cityCoverage: "Oaxaca de Juárez",
  recipientFee: 0.45,
  estimatedPayoutMinutes: 5,
  netDeliveredLocal: 1,
  localCurrency: "MXN",
  netDeliveredUSD: 999999, // attacker-inflated — must be ignored
  exchangeRate: 17,
};

describe("authenticateSettle — fail closed", () => {
  it("rejects when SETTLE_API_SECRET is unset (no secret to auth against)", async () => {
    const { authenticateSettle } = await import("@/infra/settle-guard");
    expect(authenticateSettle(bearerReq("anything"))).toBe(false);
    expect(authenticateSettle(bearerReq())).toBe(false);
  });

  it("rejects missing/wrong bearer and accepts the exact secret", async () => {
    process.env.SETTLE_API_SECRET = "topsecret-123";
    vi.resetModules();
    const { authenticateSettle } = await import("@/infra/settle-guard");
    expect(authenticateSettle(bearerReq())).toBe(false); // no header
    expect(authenticateSettle(bearerReq("wrong"))).toBe(false);
    expect(authenticateSettle(bearerReq("topsecret-123"))).toBe(true);
  });
});

describe("checkRateLimit — per-key fixed window", () => {
  it("allows up to max then blocks with retry-after", async () => {
    process.env.SETTLE_RATE_LIMIT_MAX = "3";
    process.env.SETTLE_RATE_LIMIT_WINDOW_MS = "60000";
    vi.resetModules();
    const { checkRateLimit, __resetRateLimit } = await import(
      "@/infra/settle-guard"
    );
    __resetRateLimit();
    const now = 1_000_000;
    expect(checkRateLimit("ip-a", now).ok).toBe(true);
    expect(checkRateLimit("ip-a", now).ok).toBe(true);
    expect(checkRateLimit("ip-a", now).ok).toBe(true);
    const blocked = checkRateLimit("ip-a", now);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    // separate key is unaffected
    expect(checkRateLimit("ip-b", now).ok).toBe(true);
    // window rollover resets
    expect(checkRateLimit("ip-a", now + 60_001).ok).toBe(true);
  });
});

describe("settleBodySchema — strict validation", () => {
  it("accepts a well-formed body and rejects malformed ones", async () => {
    const { settleBodySchema } = await import("@/infra/settle-guard");
    expect(
      settleBodySchema.safeParse({
        remittance: validRemittance,
        corridor: validCorridor,
        match: clientMatch,
      }).success,
    ).toBe(true);

    expect(settleBodySchema.safeParse({}).success).toBe(false);
    expect(
      settleBodySchema.safeParse({
        remittance: { ...validRemittance, amountUSD: -5 },
        corridor: validCorridor,
        match: clientMatch,
      }).success,
    ).toBe(false);
  });
});

describe("deriveTrustedNetDeliveredUSD — ignores client value", () => {
  it("recomputes from remittance + corridor + catalog partner", async () => {
    const { deriveTrustedNetDeliveredUSD } = await import(
      "@/infra/settle-guard"
    );
    const trusted = deriveTrustedNetDeliveredUSD({
      remittance: validRemittance,
      corridor: validCorridor,
      match: clientMatch,
    });
    // amount 100 − corridorCost(2 + 0.5) − oxxo fee 0.45 = 97.05
    expect(trusted).toBeCloseTo(97.05, 2);
    expect(trusted).not.toBe(clientMatch.netDeliveredUSD);
  });
});
