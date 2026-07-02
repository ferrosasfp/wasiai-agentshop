import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CorridorDiscoveryResult, Remittance } from "@/types/remittance";

/**
 * Tests for the demo pipeline Server Actions (audit finding N4).
 *
 * The actions run server-side and call the pipeline logic directly — the demo
 * no longer hits the now-Bearer-closed POST /api/kyc|discover|match from the
 * browser. Covered: happy path (result + trace), body validation, per-IP rate
 * limit. No network: with A2A_KEY unset the run* functions take the mock path.
 */

// next/headers only works inside a request scope; stub it so the actions can
// read a client IP for rate-limit bucketing under vitest.
let mockClientIp = "9.9.9.9";
vi.mock("next/headers", () => ({
  headers: () => ({
    get: (name: string) =>
      name === "x-forwarded-for" ? mockClientIp : null,
  }),
}));

const ENV_KEYS = ["A2A_KEY", "API_RATE_LIMIT_MAX", "API_RATE_LIMIT_WINDOW_MS"];
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

describe("pipeline Server Actions — happy path (mock, no network)", () => {
  it("kycAction returns a result + trace", async () => {
    const { kycAction } = await import("@/app/demo/pipeline-actions");
    const res = await kycAction({ remittance: validRemittance });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.result.source).toBe("demo-mode");
    expect(typeof res.result.isCompliant).toBe("boolean");
    expect(res.trace).toBeDefined();
  });

  it("discoverAction returns a result + trace", async () => {
    const { discoverAction } = await import("@/app/demo/pipeline-actions");
    const res = await discoverAction({ remittance: validRemittance });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.result.recommended).toBeDefined();
    expect(res.trace).toBeDefined();
  });

  it("matchAction returns a result + trace", async () => {
    const { matchAction } = await import("@/app/demo/pipeline-actions");
    const res = await matchAction({
      remittance: validRemittance,
      corridor: validCorridor,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.result.partnerName).toBeTruthy();
    expect(res.trace).toBeDefined();
  });
});

describe("pipeline Server Actions — body validation", () => {
  it("kycAction rejects a malformed body", async () => {
    const { kycAction } = await import("@/app/demo/pipeline-actions");
    const res = await kycAction({ remittance: { bad: true } });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error).toBe("invalid body");
  });

  it("matchAction rejects a body missing the corridor", async () => {
    const { matchAction } = await import("@/app/demo/pipeline-actions");
    const res = await matchAction({ remittance: validRemittance });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error).toBe("invalid body");
  });
});

describe("pipeline Server Actions — per-IP rate limit", () => {
  it("throttles once the shared pipeline bucket is exhausted", async () => {
    process.env.API_RATE_LIMIT_MAX = "1";
    process.env.API_RATE_LIMIT_WINDOW_MS = "60000";
    vi.resetModules();
    const { kycAction, discoverAction } = await import(
      "@/app/demo/pipeline-actions"
    );
    const first = await kycAction({ remittance: validRemittance });
    expect(first.ok).toBe(true);
    // Same IP, shared `pipeline:` bucket → the next call (any action) is blocked.
    const second = await discoverAction({ remittance: validRemittance });
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.error).toBe("rate limit exceeded");
    expect(second.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keeps a separate IP unaffected", async () => {
    process.env.API_RATE_LIMIT_MAX = "1";
    process.env.API_RATE_LIMIT_WINDOW_MS = "60000";
    vi.resetModules();
    const { kycAction } = await import("@/app/demo/pipeline-actions");
    mockClientIp = "1.1.1.1";
    expect((await kycAction({ remittance: validRemittance })).ok).toBe(true);
    mockClientIp = "2.2.2.2";
    expect((await kycAction({ remittance: validRemittance })).ok).toBe(true);
  });
});
