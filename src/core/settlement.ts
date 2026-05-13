const PYUSD_DECIMALS = 18;

export function pyusdToOnchainAmount(amount: number): bigint {
  return BigInt(Math.round(amount * 10 ** PYUSD_DECIMALS));
}

export function kitescanUrl(txHash: `0x${string}`, chainId: number): string {
  if (chainId === 2366) return `https://kitescan.ai/tx/${txHash}`;
  return `https://testnet.kitescan.ai/tx/${txHash}`;
}

export function shortHash(hash: string, len = 6): string {
  if (hash.length <= len * 2 + 2) return hash;
  return `${hash.slice(0, len + 2)}...${hash.slice(-len)}`;
}
