import { NextResponse } from "next/server";
import { settleRemittance } from "@/application/settle-remittance";
import {
  FACILITATOR_URL,
  ONCHAIN_AMOUNT_CAP_PYUSD,
  SENDER_PRIVATE_KEY,
  SETTLE_ASSET_ADDRESS,
  SETTLE_ASSET_SYMBOL,
  SETTLE_CHAIN_ID,
  SETTLE_EIP712_DOMAIN_NAME,
  SETTLE_EIP712_DOMAIN_VERSION,
  SETTLE_NETWORK,
  SETTLE_NETWORK_LABEL,
} from "@/infra/env";
import { toOnchainAmount } from "@/core/settlement";
import type {
  CashOutMatch,
  CorridorDiscoveryResult,
  Remittance,
} from "@/types/remittance";
import type { TraceEvent } from "@/types/trace";

interface SettleBody {
  remittance: Remittance;
  corridor: CorridorDiscoveryResult;
  match: CashOutMatch;
}

export async function POST(req: Request) {
  const body = (await req.json()) as SettleBody;
  if (!body?.remittance || !body?.corridor || !body?.match) {
    return NextResponse.json(
      { error: "remittance, corridor, match required" },
      { status: 400 },
    );
  }

  const started = Date.now();
  try {
    const receipt = await settleRemittance({
      remittance: body.remittance,
      corridorDiscovery: body.corridor,
      match: body.match,
    });
    const onchainAmount = Math.min(
      body.match.netDeliveredUSD,
      ONCHAIN_AMOUNT_CAP_PYUSD,
    );
    const valueAtomic = `${toOnchainAmount(onchainAmount)}`;

    // Section 03 — local EIP-3009 signing step (no network)
    const signTrace: TraceEvent = {
      section: "03",
      step: "EIP-3009 TransferWithAuthorization · server-side sign",
      endpoint: "viem signTypedData() · local computation, no network",
      request: {
        method: "(local)",
        body: {
          domain: {
            name: SETTLE_EIP712_DOMAIN_NAME,
            version: SETTLE_EIP712_DOMAIN_VERSION,
            chainId: SETTLE_CHAIN_ID,
            verifyingContract: SETTLE_ASSET_ADDRESS,
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
            value: `${valueAtomic} (= ${onchainAmount} ${SETTLE_ASSET_SYMBOL} atomic units)`,
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
        summary: `EIP-712 typed data signed for ${onchainAmount} ${SETTLE_ASSET_SYMBOL} transfer to ${receipt.toWallet.slice(0, 8)}...`,
      },
      metadata: {
        source: SENDER_PRIVATE_KEY ? "facilitator" : "demo-mode",
        latencyMs: 8,
        chain: SETTLE_NETWORK_LABEL,
        asset: SETTLE_ASSET_SYMBOL,
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
            network: SETTLE_NETWORK,
            amount: valueAtomic,
            asset: SETTLE_ASSET_ADDRESS,
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
          asset: SETTLE_ASSET_SYMBOL,
          network: receipt.network,
        },
        summary: `${onchainAmount.toFixed(4)} ${SETTLE_ASSET_SYMBOL} settled · ${SETTLE_NETWORK_LABEL} tx ${receipt.txHash.slice(0, 10)}...`,
      },
      metadata: {
        source: SENDER_PRIVATE_KEY ? "facilitator" : "demo-mode",
        latencyMs: Date.now() - started - signTrace.metadata!.latencyMs!,
        downstreamTxHash: receipt.txHash,
        downstreamBlockNumber: receipt.blockNumber,
        chain: SETTLE_NETWORK_LABEL,
        asset: SETTLE_ASSET_SYMBOL,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ receipt, traces: [signTrace, settleTrace] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "settle failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
