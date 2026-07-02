export const A2A_URL =
  process.env.WASIAI_A2A_URL ?? "https://wasiai-a2a-production.up.railway.app";
export const A2A_KEY = process.env.A2A_KEY ?? "";

export const FACILITATOR_URL =
  process.env.WASIAI_FACILITATOR_URL ?? "https://wasiai-facilitator-production.up.railway.app";

/**
 * Bearer credential for the self-hosted wasiai-facilitator.
 *
 * POST-SUBMISSION CHANGE (Kite hackathon, finalists — pitch 2026-06-16).
 * This var was NOT part of the originally submitted demo. Since submission we
 * advanced our own infrastructure: the self-hosted `wasiai-facilitator` was
 * hardened (WFAC-AUDIT) and now requires caller auth — every /verify and
 * /settle call must carry `Authorization: Bearer <FACILITATOR_API_KEY>` or it
 * returns 401 UNAUTHORIZED. agentshop must send this bearer for the real Kite
 * settle to work. Set it in Vercel to the SAME value configured in the
 * facilitator's Railway env. See wasiai-facilitator/src/middleware/auth.ts.
 */
export const FACILITATOR_API_KEY = process.env.FACILITATOR_API_KEY ?? "";

export const KITE_CHAIN_ID = Number(process.env.KITE_CHAIN_ID ?? 2368);
export const KITE_RPC_URL =
  process.env.KITE_RPC_URL ?? "https://rpc-testnet.gokite.ai/";
export const PYUSD_ADDRESS = (process.env.PYUSD_ADDRESS ??
  "0x8E04D099b1a8Dd20E6caD4b2Ab2B405B98242ec9") as `0x${string}`;

export const SENDER_ADDRESS = (process.env.NEXT_PUBLIC_SENDER_ADDRESS ??
  "0xf432baf1315ccDB23E683B95b03fD54Dd3e447Ba") as `0x${string}`;

export const RECEIVER_ADDRESS = (process.env.NEXT_PUBLIC_RECEIVER_ADDRESS ??
  "0x94DCDb84207724A609B17e4838936832EA59B9eD") as `0x${string}`;

export const SENDER_PRIVATE_KEY = process.env.SENDER_PRIVATE_KEY ?? "";

/**
 * Onchain transfer cap (in PYUSD) for the testnet demo. The facilitator
 * enforces a 100 PYUSD per-settle cap; we keep ours well under that to
 * preserve OPERATOR wallet balance across multiple demo runs.
 * Real production has no cap — this is a testnet demo guardrail.
 */
export const ONCHAIN_AMOUNT_CAP_PYUSD = Number(
  process.env.ONCHAIN_AMOUNT_CAP_PYUSD ?? "0.5",
);

/**
 * Shared secret that authenticates callers of `POST /api/settle` (M3 remediation).
 *
 * The settle route signs REAL EIP-3009 authorizations and relays them to the
 * shared production facilitator, so it must not be world-callable. Callers must
 * send `Authorization: Bearer <SETTLE_API_SECRET>`. When this var is UNSET the
 * route fails CLOSED (every request → 401): you cannot authenticate against a
 * secret that does not exist. Set it in the deployment env (Vercel) to a
 * high-entropy value.
 */
export const SETTLE_API_SECRET = process.env.SETTLE_API_SECRET ?? "";

/**
 * Local per-IP rate limit for `POST /api/settle` (M3 remediation). Best-effort
 * in-memory fixed window — a floor of defense that does not rely on the
 * downstream facilitator caps. Overridable via env; low defaults for a demo
 * endpoint that moves funds.
 */
export const SETTLE_RATE_LIMIT_MAX = Number(
  process.env.SETTLE_RATE_LIMIT_MAX ?? "5",
);
export const SETTLE_RATE_LIMIT_WINDOW_MS = Number(
  process.env.SETTLE_RATE_LIMIT_WINDOW_MS ?? "60000",
);

/**
 * Local per-IP rate limit for the READ-side pipeline routes/actions
 * `/api/kyc`, `/api/discover`, `/api/match` (audit finding N4).
 *
 * Like `/api/settle`, these entry points can trigger REAL on-chain spend: in
 * real mode (A2A_KEY set, NEXT_PUBLIC_DEMO_MODE unset) each one calls
 * `composeOnA2A`, which debits the shared A2A_KEY budget. They were previously
 * world-callable with no auth or throttle, so anyone could spam them and drain
 * the shared key's budget to its cap (same vector M3 closed for settle).
 *
 * A demo run fires 3 pipeline calls (kyc -> discover -> match), and the UI has a
 * "Restart" button, so this bucket is separate from (and more generous than)
 * the settle bucket to avoid throttling legitimate re-runs. Bucketed under a
 * distinct `pipeline:` key namespace so pipeline traffic never eats into the
 * settle counter. Best-effort in-memory floor; the on-chain A2A budget cap is
 * the hard limit.
 */
export const API_RATE_LIMIT_MAX = Number(
  process.env.API_RATE_LIMIT_MAX ?? "30",
);
export const API_RATE_LIMIT_WINDOW_MS = Number(
  process.env.API_RATE_LIMIT_WINDOW_MS ?? "60000",
);

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export function hasRealModeConfig(): boolean {
  return Boolean(A2A_KEY && SENDER_PRIVATE_KEY && !isDemoMode());
}
