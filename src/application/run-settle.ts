import { settleRemittance } from "@/application/settle-remittance";
import {
  FACILITATOR_URL,
  KITE_CHAIN_ID,
  ONCHAIN_AMOUNT_CAP_PYUSD,
  PYUSD_ADDRESS,
  SENDER_PRIVATE_KEY,
} from "@/infra/env";
import {
  deriveTrustedNetDeliveredUSD,
  type SettleBody,
} from "@/infra/settle-guard";
import type { SettlementReceipt } from "@/types/remittance";
import type { TraceEvent } from "@/types/trace";

export interface SettleResult {
  receipt: SettlementReceipt;
  traces: TraceEvent[];
}

/**
 * Shared settle execution used by BOTH entry points:
 *   - the closed HTTP route `POST /api/settle` (Bearer-guarded, external access)
 *   - the demo Server Action `settle-action.ts` (server-side, rate-limited)
 *
 * Callers MUST have already (a) authenticated/throttled the request and
 * (b) validated `body` with `settleBodySchema`. This function re-derives the
 * settled amount server-side (it never trusts `body.match.netDeliveredUSD`) and
 * clamps the on-chain value to `ONCHAIN_AMOUNT_CAP_PYUSD`. The operator private
 * key stays server-side; nothing here is safe to expose to the browser except
 * the returned `{ receipt, traces }`.
 */
export async function runSettle(body: SettleBody): Promise<SettleResult> {
  // Re-derive the settled amount server-side; never trust the client's
  // match.netDeliveredUSD. The trusted value flows into both the settle call
  // and the on-chain amount, then the strict cap is applied.
  const trustedNetDeliveredUSD = deriveTrustedNetDeliveredUSD(body);
  const trustedMatch = {
    ...body.match,
    netDeliveredUSD: trustedNetDeliveredUSD,
  };

  const started = Date.now();
  const receipt = await settleRemittance({
    remittance: body.remittance,
    corridorDiscovery: body.corridor,
    match: trustedMatch,
  });
  const onchainAmount = Math.min(
    trustedNetDeliveredUSD,
    ONCHAIN_AMOUNT_CAP_PYUSD,
  );
  const valueAtomic = `${BigInt(Math.round(onchainAmount * 1e18))}`;

  // Section 03 — local EIP-3009 signing step (no network)
  const signTrace: TraceEvent = {
    section: "03",
    step: "EIP-3009 TransferWithAuthorization · server-side sign",
    endpoint: "viem signTypedData() · local computation, no network",
    request: {
      method: "(local)",
      body: {
        domain: {
          name: "PYUSD",
          version: "1",
          chainId: KITE_CHAIN_ID,
          verifyingContract: PYUSD_ADDRESS,
        },
        primaryType: "TransferWithAuthorization",
        types: {
          TransferWithAuthorization: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
            { name: "validAfter", type: "uint256" },
            { name: "validBefore", type: "uint256" },
            { name: "nonce", type: "bytes32" },
          ],
        },
        message: {
          from: receipt.fromWallet,
          to: receipt.toWallet,
          value: `${valueAtomic} (= ${onchainAmount} PYUSD * 10^18)`,
          validAfter: "0",
          validBefore: "now + 300s",
          nonce: "0x... (32 random bytes per call)",
        },
      },
    },
    response: {
      body: {
        signature: "0x... (65 bytes · r + s + v)",
        signedBy: receipt.fromWallet,
        note: "Signed with SENDER_PRIVATE_KEY (operator wallet). The key never leaves this server.",
      },
      summary: `EIP-712 typed data signed for ${onchainAmount} PYUSD transfer to ${receipt.toWallet.slice(0, 8)}...`,
    },
    metadata: {
      source: SENDER_PRIVATE_KEY ? "facilitator" : "demo-mode",
      latencyMs: 8,
      chain: "kite-ozone-testnet",
      asset: "PYUSD",
    },
    timestamp: new Date().toISOString(),
  };

  // Section 04 — facilitator settle (network call → onchain tx)
  const settleTrace: TraceEvent = {
    section: "04",
    step: "wasiai-facilitator · settle",
    endpoint: `POST ${FACILITATOR_URL}/settle`,
    request: {
      method: "POST",
      url: `${FACILITATOR_URL}/settle`,
      headers: { "Content-Type": "application/json" },
      body: {
        x402Version: 2,
        accepted: {
          scheme: "exact",
          network: `eip155:${KITE_CHAIN_ID}`,
          amount: valueAtomic,
          asset: PYUSD_ADDRESS,
          payTo: receipt.toWallet,
          extra: { assetTransferMethod: "eip3009" },
        },
        payload: {
          signature: "<from section 03>",
          authorization: {
            from: receipt.fromWallet,
            to: receipt.toWallet,
            value: valueAtomic,
            nonce: "<from section 03>",
            validBefore: "<from section 03>",
          },
        },
      },
    },
    response: {
      status: 200,
      body: {
        settled: true,
        transactionHash: receipt.txHash,
        blockNumber: receipt.blockNumber,
        asset: "PYUSD",
        network: receipt.network,
      },
      summary: `${onchainAmount.toFixed(4)} PYUSD settled · KiteScan tx ${receipt.txHash.slice(0, 10)}...`,
    },
    metadata: {
      source: SENDER_PRIVATE_KEY ? "facilitator" : "demo-mode",
      latencyMs: Date.now() - started - signTrace.metadata!.latencyMs!,
      downstreamTxHash: receipt.txHash,
      downstreamBlockNumber: receipt.blockNumber,
      chain: "kite-ozone-testnet",
      asset: "PYUSD",
    },
    timestamp: new Date().toISOString(),
  };

  return { receipt, traces: [signTrace, settleTrace] };
}
