import { NextResponse } from "next/server";
import { settleRemittance } from "@/application/settle-remittance";
import {
  FACILITATOR_URL,
  KITE_CHAIN_ID,
  ONCHAIN_AMOUNT_CAP_PYUSD,
  PYUSD_ADDRESS,
  SENDER_PRIVATE_KEY,
} from "@/infra/env";
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

    return NextResponse.json({ receipt, traces: [signTrace, settleTrace] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "settle failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
