import { composeOnA2A, type ComposeTraceData } from "@/infra/a2a-client";
import { A2A_KEY, A2A_URL, isDemoMode } from "@/infra/env";
import { mockCorridorDiscovery } from "@/infra/mock-adapter";
import type { CorridorDiscoveryResult, Remittance } from "@/types/remittance";
import type { TraceEvent } from "@/types/trace";

export interface CorridorRun extends CorridorDiscoveryResult {
  source: "a2a-compose" | "mock-fallback" | "demo-mode";
  latencyMs?: number;
  trace: TraceEvent;
}

export async function discoverCorridor(remittance: Remittance): Promise<CorridorRun> {
  const baseInput = {
    amountUSD: remittance.amountUSD,
    senderCountry: remittance.sender.country,
    receiverCountry: remittance.receiver.country,
    prioritizeSpeed: true,
  };
  const step = "agentshop-corridor-discoverer";

  if (isDemoMode() || !A2A_KEY) {
    const result = mockCorridorDiscovery(remittance);
    return {
      ...result,
      source: "demo-mode",
      trace: {
        step,
        endpoint: "mock (NEXT_PUBLIC_DEMO_MODE=true)",
        request: { body: baseInput },
        response: { body: result, summary: `recommended ${result.recommended.name}` },
        metadata: { source: "demo-mode" },
        timestamp: new Date().toISOString(),
      },
    };
  }

  const started = Date.now();
  const traceBox: { current?: ComposeTraceData } = {};
  try {
    const response = await composeOnA2A(
      [{ agent: step, capability: "remit.corridor-find", input: baseInput }],
      { chainKey: "kite-ozone-testnet", trace: traceBox },
    );
    const result = response.steps[0].output as unknown as CorridorDiscoveryResult;
    const stepResult = response.steps[0];
    return {
      ...result,
      source: "a2a-compose",
      latencyMs: Date.now() - started,
      trace: {
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
          summary: `recommended ${result.recommended.name} · billed ${stepResult.costUsdc ?? 0.05} PYUSD`,
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
    const fallback = mockCorridorDiscovery(remittance);
    return {
      ...fallback,
      source: "mock-fallback",
      latencyMs: Date.now() - started,
      trace: {
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
