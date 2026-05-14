import { composeOnA2A, type ComposeTraceData } from "@/infra/a2a-client";
import { A2A_KEY, A2A_URL, isDemoMode } from "@/infra/env";
import { mockCashOutMatch } from "@/infra/mock-adapter";
import type { CashOutMatch, CorridorDiscoveryResult, Remittance } from "@/types/remittance";
import type { TraceEvent } from "@/types/trace";

export interface MatchRun extends CashOutMatch {
  source: "a2a-compose" | "mock-fallback" | "demo-mode";
  latencyMs?: number;
  trace: TraceEvent;
}

export async function matchCashOut(
  remittance: Remittance,
  corridorDiscovery: CorridorDiscoveryResult,
): Promise<MatchRun> {
  const baseInput = {
    receiverCountry: remittance.receiver.country,
    receiverCity: remittance.receiver.city,
    preference: remittance.receiver.cashOutPreference,
    corridorId: corridorDiscovery.recommended.id,
    amountUSD: remittance.amountUSD,
    netUsdToDeliver:
      remittance.amountUSD -
      corridorDiscovery.recommended.feeFlatUSD -
      (remittance.amountUSD * corridorDiscovery.recommended.feePctBps) / 10_000,
  };
  const step = "agentshop-cashout-matcher";
  const section = "02" as const;

  if (isDemoMode() || !A2A_KEY) {
    const result = mockCashOutMatch(remittance, corridorDiscovery);
    return {
      ...result,
      source: "demo-mode",
      trace: {
        section,
        step,
        endpoint: "mock (NEXT_PUBLIC_DEMO_MODE=true)",
        request: { body: baseInput },
        response: { body: result, summary: `partner ${result.partnerName}` },
        metadata: { source: "demo-mode" },
        timestamp: new Date().toISOString(),
      },
    };
  }

  const started = Date.now();
  const traceBox: { current?: ComposeTraceData } = {};
  try {
    const response = await composeOnA2A(
      [{ agent: step, capability: "remit.cashout-match", input: baseInput }],
      { chainKey: "kite-ozone-testnet", trace: traceBox },
    );
    const result = response.steps[0].output as unknown as CashOutMatch;
    const stepResult = response.steps[0];
    return {
      ...result,
      source: "a2a-compose",
      latencyMs: Date.now() - started,
      trace: {
        section,
        step,
        endpoint: `POST ${A2A_URL}/compose`,
        request: {
          method: "POST",
          url: traceBox.current?.url,
          headers: {
            "x-a2a-key": "wasi_a2a_***",
            "x-payment-chain": "kite-ozone-testnet",
          },
          body: traceBox.current?.requestBody,
        },
        response: {
          status: traceBox.current?.status,
          body: stepResult.output,
          summary: `partner ${result.partnerName} · billed ${stepResult.costUsdc ?? 0.01} PYUSD`,
        },
        metadata: {
          source: "a2a-compose",
          latencyMs: stepResult.latencyMs,
          costUsdc: stepResult.costUsdc,
          downstreamTxHash: stepResult.downstreamTxHash,
          downstreamBlockNumber: stepResult.downstreamBlockNumber,
          chain: "kite-ozone-testnet",
          asset: "PYUSD",
        },
        timestamp: new Date().toISOString(),
      },
    };
  } catch (err) {
    const fallback = mockCashOutMatch(remittance, corridorDiscovery);
    return {
      ...fallback,
      source: "mock-fallback",
      latencyMs: Date.now() - started,
      trace: {
        section,
        step,
        endpoint: `POST ${A2A_URL}/compose`,
        request: { body: baseInput },
        response: { summary: `fallback: ${(err as Error).message}` },
        metadata: { source: "mock-fallback", latencyMs: Date.now() - started },
        timestamp: new Date().toISOString(),
      },
    };
  }
}
