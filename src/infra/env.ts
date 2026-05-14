export const A2A_URL =
  process.env.WASIAI_A2A_URL ?? "https://wasiai-a2a-production.up.railway.app";
export const A2A_KEY = process.env.A2A_KEY ?? "";

export const FACILITATOR_URL =
  process.env.WASIAI_FACILITATOR_URL ?? "https://wasiai-facilitator-production.up.railway.app";

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

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export function hasRealModeConfig(): boolean {
  return Boolean(A2A_KEY && SENDER_PRIVATE_KEY && !isDemoMode());
}
