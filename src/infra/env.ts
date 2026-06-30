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

// ---------------------------------------------------------------------------
// Legacy Kite / PYUSD vars (kept for back-compat). These are NO LONGER the
// settlement chain by default — see the SETTLE_* block below. They remain so
// existing env files and any non-settlement reference keeps resolving.
// ---------------------------------------------------------------------------
export const KITE_CHAIN_ID = Number(process.env.KITE_CHAIN_ID ?? 2368);
export const KITE_RPC_URL =
  process.env.KITE_RPC_URL ?? "https://rpc-testnet.gokite.ai/";
export const PYUSD_ADDRESS = (process.env.PYUSD_ADDRESS ??
  "0x8E04D099b1a8Dd20E6caD4b2Ab2B405B98242ec9") as `0x${string}`;

// ---------------------------------------------------------------------------
// Settlement chain config — DEFAULT: Avalanche Fuji USDC (testnet C-chain).
//
// The remittance is liquidated on whatever chain/asset this block resolves to.
// Defaults target Avalanche Fuji (chainId 43113) with native Circle USDC
// (0x5425890298aed601595a70AB815c96711a31Bc65, 6 decimals). The self-hosted
// wasiai-facilitator already settles REAL on this chain/asset.
//
// EIP-712 domain for Fuji USDC is the canonical Circle template:
//   name="USD Coin", version="2", verifyingContract=<USDC>, chainId=43113.
// Source of truth: wasiai-facilitator/src/chains/avalanche.ts (USDC_FUJI).
//
// Everything is overridable by env so the same build can target Kite/PYUSD,
// Base, or Avalanche mainnet without code changes (no hardcodes).
// ---------------------------------------------------------------------------
export const SETTLE_CHAIN_ID = Number(
  process.env.SETTLE_CHAIN_ID ?? "43113",
);
export const SETTLE_RPC_URL =
  process.env.SETTLE_RPC_URL ?? "https://api.avax-test.network/ext/bc/C/rpc";
export const SETTLE_ASSET_ADDRESS = (process.env.SETTLE_ASSET_ADDRESS ??
  "0x5425890298aed601595a70AB815c96711a31Bc65") as `0x${string}`;
export const SETTLE_ASSET_SYMBOL = process.env.SETTLE_ASSET_SYMBOL ?? "USDC";
export const SETTLE_ASSET_DECIMALS = Number(
  process.env.SETTLE_ASSET_DECIMALS ?? "6",
);
export const SETTLE_NETWORK =
  process.env.SETTLE_NETWORK ?? `eip155:${SETTLE_CHAIN_ID}`;
export const SETTLE_EIP712_DOMAIN_NAME =
  process.env.SETTLE_EIP712_DOMAIN_NAME ?? "USD Coin";
export const SETTLE_EIP712_DOMAIN_VERSION =
  process.env.SETTLE_EIP712_DOMAIN_VERSION ?? "2";
// Block-explorer tx URL template — `{tx}` is replaced with the tx hash.
export const SETTLE_EXPLORER_TX_URL =
  process.env.SETTLE_EXPLORER_TX_URL ??
  "https://testnet.snowtrace.io/tx/{tx}";
// Human-readable network label shown in the receipt UI.
export const SETTLE_NETWORK_LABEL =
  process.env.SETTLE_NETWORK_LABEL ?? "Avalanche Fuji testnet";
// Client-exposed explorer template (`{tx}` placeholder) for the trace console.
// Must be NEXT_PUBLIC_* to be readable in client components.
export const NEXT_PUBLIC_SETTLE_EXPLORER_TX_URL =
  process.env.NEXT_PUBLIC_SETTLE_EXPLORER_TX_URL ??
  "https://testnet.snowtrace.io/tx/{tx}";

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

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export function hasRealModeConfig(): boolean {
  return Boolean(A2A_KEY && SENDER_PRIVATE_KEY && !isDemoMode());
}
