import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Regression guard for M3: POST /api/settle must stay Bearer-CLOSED for
 * external callers. The demo UI no longer touches this route (it uses the
 * server-side Server Action), so nothing legitimately calls it without the
 * secret. These tests fail if someone reopens the vector.
 */

let savedSecret: string | undefined;

beforeEach(() => {
  savedSecret = process.env.SETTLE_API_SECRET;
  vi.resetModules();
});

afterEach(() => {
  if (savedSecret === undefined) delete process.env.SETTLE_API_SECRET;
  else process.env.SETTLE_API_SECRET = savedSecret;
  vi.resetModules();
});

describe("POST /api/settle — Bearer required", () => {
  it("401 when SETTLE_API_SECRET is unset (fails closed) even with a bearer", async () => {
    delete process.env.SETTLE_API_SECRET;
    vi.resetModules();
    const { POST } = await import("@/app/api/settle/route");
    const req = new Request("http://localhost/api/settle", {
      method: "POST",
      headers: {
        authorization: "Bearer anything",
        "content-type": "application/json",
      },
      body: "{}",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("401 when the secret is configured but no bearer is presented", async () => {
    process.env.SETTLE_API_SECRET = "topsecret-123";
    vi.resetModules();
    const { POST } = await import("@/app/api/settle/route");
    const req = new Request("http://localhost/api/settle", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
