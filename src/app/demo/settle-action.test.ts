import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  CashOutMatch,
  CorridorDiscoveryResult,
  Remittance,
} from "@/types/remittance";

/**
 * Tests for the demo Server Action (M3 fix / BLQ-MED-1).
 *
 * The action runs server-side and calls the settle logic directly — the demo
 * "Settle" button no longer hits the Bearer-closed POST /api/settle from the
 * browser. Covered: happy path (receipt + traces), body validation, per-IP
 * rate limit. No network: with SENDER_PRIVATE_KEY unset, settleRemittance()
 * uses the pure mock adapter.
 */

// next/headers only works inside a request scope; stub it so the action can
// read a client IP for rate-limit bucketing under vitest.
let mockClientIp = "9.9.9.9";
vi.mock("next/headers", () => ({
  headers: () => ({
    get: (name: string) =>
      name === "x-forwarded-for" ? mockClientIp : null,
  }),
}));

const ENV_KEYS = [
  "SENDER_PRIVATE_KEY",
  "SETTLE_RATE_LIMIT_MAX",
  "SETTLE_RATE_LIMIT_WINDOW_MS",
];
let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = {};
  for (const k of ENV_KEYS) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
  mockClientIp = "9.9.9.9";
  vi.resetModules();
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  vi.resetModules();
});

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

const validInput = {
  remittance: validRemittance,
  corridor: validCorridor,
  match: clientMatch,
};

describe("settleAction — demo settle (server-side)", () => {
  it("returns a receipt + traces for a valid body (no network, mock adapter)", async () => {
    const { settleAction } = await import("@/app/demo/settle-action");
    const res = await settleAction(validInput);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.receipt.txHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(res.traces).toHaveLength(2);
    // amount is re-derived server-side, NOT the inflated client value, and
    // clamped to the on-chain cap (0.5 PYUSD).
    expect(res.receipt.amountPYUSD).not.toBe(clientMatch.netDeliveredUSD);
  });

  it("rejects a malformed body with ok:false", async () => {
    const { settleAction } = await import("@/app/demo/settle-action");
    const res = await settleAction({ remittance: { bad: true } });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error).toBe("invalid body");
  });

  it("throttles per-IP once the rate limit is hit", async () => {
    process.env.SETTLE_RATE_LIMIT_MAX = "1";
    process.env.SETTLE_RATE_LIMIT_WINDOW_MS = "60000";
    vi.resetModules();
    const { settleAction } = await import("@/app/demo/settle-action");
    const first = await settleAction(validInput);
    expect(first.ok).toBe(true);
    const second = await settleAction(validInput);
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.error).toBe("rate limit exceeded");
    expect(second.retryAfterSeconds).toBeGreaterThan(0);
  });
});
