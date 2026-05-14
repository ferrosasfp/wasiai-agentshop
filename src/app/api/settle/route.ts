import { NextResponse } from "next/server";
import { settleRemittance } from "@/application/settle-remittance";
import { FACILITATOR_URL, KITE_CHAIN_ID, ONCHAIN_AMOUNT_CAP_PYUSD, SENDER_PRIVATE_KEY } from "@/infra/env";
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
    const onchainAmount = Math.min(body.match.netDeliveredUSD, ONCHAIN_AMOUNT_CAP_PYUSD);
    const trace: TraceEvent = {
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
            amount: `${onchainAmount}*10^18 atomic units (PYUSD)`,
            asset: "0x8E04D099b1a8Dd20E6caD4b2Ab2B405B98242ec9",
            payTo: receipt.toWallet,
            extra: { assetTransferMethod: "eip3009" },
          },
          payload: {
            signature: "0x... (EIP-3009 TransferWithAuthorization signed server-side)",
            authorization: {
              from: receipt.fromWallet,
              to: receipt.toWallet,
              nonce: "0x... (32 random bytes)",
              validBefore: "now + 300s",
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
        },
        summary: `${onchainAmount.toFixed(4)} PYUSD settled · KiteScan tx ${receipt.txHash.slice(0, 10)}...`,
      },
      metadata: {
        source: SENDER_PRIVATE_KEY ? "facilitator" : "demo-mode",
        latencyMs: Date.now() - started,
        downstreamTxHash: receipt.txHash,
        downstreamBlockNumber: receipt.blockNumber,
        chain: "kite-ozone-testnet",
        asset: "PYUSD",
      },
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json({ receipt, trace });
  } catch (e) {
    const message = e instanceof Error ? e.message : "settle failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
