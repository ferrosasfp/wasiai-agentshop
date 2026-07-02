import { NextResponse } from "next/server";
import { discoverCorridor } from "@/application/discover-corridor";
import { API_RATE_LIMIT_MAX, API_RATE_LIMIT_WINDOW_MS } from "@/infra/env";
import { authenticateApi, checkRateLimit, getClientIp } from "@/infra/settle-guard";
import type { Remittance } from "@/types/remittance";

export async function POST(req: Request) {
  // N4 — authenticate first (fails CLOSED when SETTLE_API_SECRET is unset).
  // This EXTERNAL entry point can trigger real on-chain spend via composeOnA2A
  // (shared A2A_KEY budget). The demo UI does NOT call this route from the
  // browser (that would leak the secret); it uses the server-side Server Action
  // in src/app/demo/pipeline-actions.ts.
  if (!authenticateApi(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const rate = checkRateLimit(`pipeline:${getClientIp(req.headers)}`, Date.now(), {
    max: API_RATE_LIMIT_MAX,
    windowMs: API_RATE_LIMIT_WINDOW_MS,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds ?? 60) } },
    );
  }

  const body = (await req.json()) as { remittance: Remittance };
  if (!body?.remittance) {
    return NextResponse.json({ error: "remittance required" }, { status: 400 });
  }
  const result = await discoverCorridor(body.remittance);
  return NextResponse.json({ result, trace: result.trace });
}
