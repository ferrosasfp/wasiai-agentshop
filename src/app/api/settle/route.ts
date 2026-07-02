import { NextResponse } from "next/server";
import { runSettle } from "@/application/run-settle";
import {
  authenticateSettle,
  checkRateLimit,
  getClientIp,
  settleBodySchema,
} from "@/infra/settle-guard";

export async function POST(req: Request) {
  // M3 — authenticate first (fails CLOSED when SETTLE_API_SECRET is unset).
  // This is the EXTERNAL entry point: it MUST require the Bearer secret. The
  // demo UI does NOT call this route from the browser (that would leak the
  // secret); it uses the server-side Server Action in src/app/demo/settle-action.ts.
  if (!authenticateSettle(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // M3 — local per-IP rate limit (does not depend on facilitator caps).
  const rate = checkRateLimit(getClientIp(req.headers));
  if (!rate.ok) {
    return NextResponse.json(
      { error: "rate limit exceeded" },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds ?? 60) },
      },
    );
  }

  // M3 — strict body validation with zod (previously a dead dependency).
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const parsed = settleBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await runSettle(parsed.data);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "settle failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
