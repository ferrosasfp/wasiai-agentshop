import { pyusdToOnchainAmount } from "@/core/settlement";
import type { CashOutMatch, Corridor, SettlementReceipt } from "@/types/remittance";
import {
  FACILITATOR_API_KEY,
  FACILITATOR_URL,
  KITE_CHAIN_ID,
  ONCHAIN_AMOUNT_CAP_PYUSD,
  PYUSD_ADDRESS,
  RECEIVER_ADDRESS,
  SENDER_ADDRESS,
} from "./env";
import { signTransferAuthorization } from "./eip3009-signer";

const FACILITATOR_TIMEOUT_MS = 10_000;

interface X402Authorization {
  from: `0x${string}`;
  to: `0x${string}`;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: `0x${string}`;
}

interface X402CanonicalBody {
  x402Version: 2;
  resource: { url: string };
  accepted: {
    scheme: "exact";
    network: string;
    amount: string;
    asset: `0x${string}`;
    payTo: `0x${string}`;
    maxTimeoutSeconds: number;
    extra: { assetTransferMethod: "eip3009" };
  };
  payload: {
    signature: `0x${string}`;
    authorization: X402Authorization;
  };
}

interface FacilitatorSettleResponse {
  settled?: boolean;
  transactionHash?: `0x${string}`;
  blockNumber?: number;
  amount?: string;
  from?: string;
  to?: string;
  asset?: string;
  network?: string;
  error?: { code?: string; message?: string; http?: number };
}

function buildCanonicalBody(args: {
  authorization: X402Authorization;
  signature: `0x${string}`;
}): X402CanonicalBody {
  return {
    x402Version: 2,
    resource: { url: "https://wasiai-agentshop.vercel.app/remit" },
    accepted: {
      scheme: "exact",
      network: `eip155:${KITE_CHAIN_ID}`,
      amount: args.authorization.value,
      asset: PYUSD_ADDRESS,
      payTo: args.authorization.to,
      maxTimeoutSeconds: 300,
      extra: { assetTransferMethod: "eip3009" },
    },
    payload: {
      signature: args.signature,
      authorization: args.authorization,
    },
  };
}

export async function settleOnFacilitatorReal(args: {
  amountPYUSD: number;
  corridor: Corridor;
  match: CashOutMatch;
}): Promise<SettlementReceipt> {
  // Apply testnet demo cap: facilitator enforces a 100 PYUSD per-settle cap,
  // and OPERATOR wallet only has ~8 PYUSD on Kite Ozone testnet. The UI shows
  // the full conceptual amount ($200 / 3,784 MXN); onchain we settle the cap.
  // Production would skip this cap entirely.
  const onchainAmountPYUSD = Math.min(args.amountPYUSD, ONCHAIN_AMOUNT_CAP_PYUSD);
  const valueOnchain = pyusdToOnchainAmount(onchainAmountPYUSD);
  const signed = await signTransferAuthorization({
    to: RECEIVER_ADDRESS,
    valueOnchain,
    timeoutSeconds: 300,
  });

  const body = buildCanonicalBody({
    authorization: {
      from: signed.from,
      to: signed.to,
      value: signed.value,
      validAfter: signed.validAfter,
      validBefore: signed.validBefore,
      nonce: signed.nonce,
    },
    signature: signed.signature,
  });

  // POST-SUBMISSION CHANGE (Kite hackathon, finalists — pitch 2026-06-16).
  // The submitted demo called the facilitator /settle WITHOUT auth. Since then
  // we improved our own stack: the self-hosted wasiai-facilitator was hardened
  // (WFAC-AUDIT) and now enforces caller auth on /verify and /settle. Without
  // `Authorization: Bearer <FACILITATOR_API_KEY>` it replies 401 UNAUTHORIZED,
  // which surfaced here as a 500 from /api/settle. We attach the bearer so the
  // real PYUSD settle on Kite Ozone keeps working against the upgraded
  // facilitator. Auth contract: wasiai-facilitator/src/middleware/auth.ts.
  const res = await fetch(`${FACILITATOR_URL}/settle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(FACILITATOR_API_KEY
        ? { Authorization: `Bearer ${FACILITATOR_API_KEY}` }
        : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(FACILITATOR_TIMEOUT_MS),
  });

  const result = (await res.json().catch(() => null)) as FacilitatorSettleResponse | null;
  if (!res.ok || !result) {
    const detail = result?.error?.message ?? JSON.stringify(result) ?? "(no body)";
    throw new Error(`Facilitator /settle HTTP ${res.status}: ${detail}`);
  }
  if (result.settled !== true || !result.transactionHash) {
    const detail = result.error?.message ?? `settled=${result.settled} tx=${result.transactionHash ?? "none"}`;
    throw new Error(`Facilitator did not settle: ${detail}`);
  }

  return {
    txHash: result.transactionHash,
    chainId: KITE_CHAIN_ID,
    blockNumber: result.blockNumber ?? 0,
    fromWallet: SENDER_ADDRESS,
    toWallet: RECEIVER_ADDRESS,
    amountPYUSD: onchainAmountPYUSD,
    corridor: args.corridor.id,
    partner: args.match.partnerName,
    network: `eip155:${KITE_CHAIN_ID}`,
    facilitator: "wasiai-facilitator",
  };
}
