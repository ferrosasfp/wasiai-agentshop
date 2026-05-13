import { pyusdToOnchainAmount } from "@/core/settlement";
import type { CashOutMatch, Corridor, SettlementReceipt } from "@/types/remittance";
import { FACILITATOR_URL, KITE_CHAIN_ID, PYUSD_ADDRESS } from "./env";

export interface SignedAuthorization {
  signature: `0x${string}`;
  nonce: `0x${string}`;
  validAfter: number;
  validBefore: number;
}

interface FacilitatorSettleRequest {
  chainId: number;
  asset: `0x${string}`;
  from: `0x${string}`;
  to: `0x${string}`;
  amount: string;
  signature: `0x${string}`;
  nonce: `0x${string}`;
  validAfter: number;
  validBefore: number;
  scheme: "exact";
  network: string;
}

export async function settleOnFacilitator(args: {
  sender: `0x${string}`;
  receiver: `0x${string}`;
  amountPYUSD: number;
  corridor: Corridor;
  match: CashOutMatch;
  signedAuthorization: SignedAuthorization;
}): Promise<SettlementReceipt> {
  const body: FacilitatorSettleRequest = {
    chainId: KITE_CHAIN_ID,
    asset: PYUSD_ADDRESS,
    from: args.sender,
    to: args.receiver,
    amount: pyusdToOnchainAmount(args.amountPYUSD).toString(),
    signature: args.signedAuthorization.signature,
    nonce: args.signedAuthorization.nonce,
    validAfter: args.signedAuthorization.validAfter,
    validBefore: args.signedAuthorization.validBefore,
    scheme: "exact",
    network: `eip155:${KITE_CHAIN_ID}`,
  };

  const res = await fetch(`${FACILITATOR_URL}/settle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Facilitator settle failed: ${res.status} ${await res.text()}`);
  }

  const result = (await res.json()) as {
    txHash: `0x${string}`;
    blockNumber: number;
    from: `0x${string}`;
  };

  return {
    txHash: result.txHash,
    chainId: KITE_CHAIN_ID,
    blockNumber: result.blockNumber,
    fromWallet: result.from,
    toWallet: args.receiver,
    amountPYUSD: args.amountPYUSD,
    corridor: args.corridor.id,
    partner: args.match.partnerName,
    network: `eip155:${KITE_CHAIN_ID}`,
    facilitator: "wasiai-facilitator",
  };
}
