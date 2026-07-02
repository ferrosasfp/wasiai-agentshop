import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  CorridorDiscoveryResult,
  Remittance,
} from "@/types/remittance";

/**
 * Regression guard for audit finding N4: the pipeline routes
 * `POST /api/kyc`, `/api/discover`, `/api/match` must stay Bearer-CLOSED for
 * external callers. Each can trigger REAL on-chain spend via composeOnA2A
 * (shared A2A_KEY budget), so anonymous access = budget-drain. The demo UI no
 * longer touches these routes (it uses the server-side Server Actions in
 * src/app/demo/pipeline-actions.ts). These tests fail if the vector reopens.
 */

const ENV_KEYS = [
  "SETTLE_API_SECRET",
  "A2A_KEY",
  "API_RATE_LIMIT_MAX",
  "API_RATE_LIMIT_WINDOW_MS",
];
let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = {};
  for (const k of ENV_KEYS) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
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

const ROUTES = [
  {
    name: "/api/kyc",
    path: "@/app/api/kyc/route",
    body: { remittance: validRemittance },
  },
  {
    name: "/api/discover",
    path: "@/app/api/discover/route",
    body: { remittance: validRemittance },
  },
  {
    name: "/api/match",
    path: "@/app/api/match/route",
    body: { remittance: validRemittance, corridor: validCorridor },
  },
] as const;

function req(body: unknown, opts?: { bearer?: string }): Request {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-forwarded-for": "1.2.3.4",
  };
  if (opts?.bearer !== undefined) headers.authorization = `Bearer ${opts.bearer}`;
  return new Request("http://localhost/api", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe.each(ROUTES)("POST $name — Bearer required (N4)", ({ path, body }) => {
  it("401 when SETTLE_API_SECRET is unset (fails closed) even with a bearer", async () => {
    delete process.env.SETTLE_API_SECRET;
    vi.resetModules();
    const { POST } = await import(path);
    const res = await POST(req(body, { bearer: "anything" }));
    expect(res.status).toBe(401);
  });

  it("401 when the secret is configured but no bearer is presented", async () => {
    process.env.SETTLE_API_SECRET = "topsecret-123";
    vi.resetModules();
    const { POST } = await import(path);
    const res = await POST(req(body));
    expect(res.status).toBe(401);
  });

  it("401 when the bearer is wrong", async () => {
    process.env.SETTLE_API_SECRET = "topsecret-123";
    vi.resetModules();
    const { POST } = await import(path);
    const res = await POST(req(body, { bearer: "wrong" }));
    expect(res.status).toBe(401);
  });

  it("429 once the per-IP rate limit is exceeded (valid bearer)", async () => {
    process.env.SETTLE_API_SECRET = "topsecret-123";
    process.env.API_RATE_LIMIT_MAX = "1";
    process.env.API_RATE_LIMIT_WINDOW_MS = "60000";
    // A2A_KEY unset -> run* functions take the mock path (no network).
    delete process.env.A2A_KEY;
    vi.resetModules();
    const { POST } = await import(path);
    const first = await POST(req(body, { bearer: "topsecret-123" }));
    expect(first.status).toBe(200);
    const second = await POST(req(body, { bearer: "topsecret-123" }));
    expect(second.status).toBe(429);
    expect(second.headers.get("Retry-After")).toBeTruthy();
  });
});
