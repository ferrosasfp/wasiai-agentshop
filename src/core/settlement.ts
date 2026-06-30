import {
  SETTLE_ASSET_DECIMALS,
  SETTLE_EXPLORER_TX_URL,
} from "@/infra/env";

/**
 * Convert a human asset amount (e.g. 0.5 USDC) into onchain atomic units using
 * the configured settlement asset decimals (default 6 for Fuji USDC; 18 for the
 * legacy Kite PYUSD path). Decimals are sourced from SETTLE_ASSET_DECIMALS so
 * the settle path stays correct when the chain/asset is reconfigured.
 */
export function toOnchainAmount(
  amount: number,
  decimals: number = SETTLE_ASSET_DECIMALS,
): bigint {
  return BigInt(Math.round(amount * 10 ** decimals));
}

/**
 * @deprecated legacy name — kept for back-compat. Use {@link toOnchainAmount}.
 * Delegates to the configurable converter (default decimals from env).
 */
export function pyusdToOnchainAmount(amount: number): bigint {
  return toOnchainAmount(amount);
}

/**
 * Block-explorer tx URL for the settlement chain. Built from the configurable
 * SETTLE_EXPLORER_TX_URL template (`{tx}` placeholder). Default points at
 * Avalanche Fuji Snowtrace.
 */
export function explorerTxUrl(txHash: `0x${string}`): string {
  return SETTLE_EXPLORER_TX_URL.replace("{tx}", txHash);
}

/**
 * @deprecated legacy name — kept for the receipt UI/back-compat. Now resolves
 * the explorer via the configurable template instead of hardcoded KiteScan.
 */
export function kitescanUrl(txHash: `0x${string}`, _chainId?: number): string {
  return explorerTxUrl(txHash);
}

export function shortHash(hash: string, len = 6): string {
  if (hash.length <= len * 2 + 2) return hash;
  return `${hash.slice(0, len + 2)}...${hash.slice(-len)}`;
}
