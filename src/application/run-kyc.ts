import { composeOnA2A, type ComposeTraceData } from "@/infra/a2a-client";
import { A2A_KEY, A2A_URL, isDemoMode } from "@/infra/env";
import { mockKyc } from "@/infra/mock-adapter";
import type { KycResult, Remittance } from "@/types/remittance";
import type { TraceEvent } from "@/types/trace";

export interface KycRun extends KycResult {
  source: "a2a-compose" | "mock-fallback" | "demo-mode";
  latencyMs?: number;
  trace: TraceEvent;
}

export async function runKyc(remittance: Remittance): Promise<KycRun> {
  const baseInput = {
    senderName: remittance.sender.name,
    senderCountry: remittance.sender.country,
    legalId: remittance.sender.legalId,
    amountUSD: remittance.amountUSD,
    receiverCountry: remittance.receiver.country,
    purpose: remittance.purpose,
  };
  const step = "agentshop-kyc-validator";

  if (isDemoMode() || !A2A_KEY) {
    const result = mockKyc(remittance);
    return {
      ...result,
      source: "demo-mode",
      trace: {
        step,
        endpoint: "mock (NEXT_PUBLIC_DEMO_MODE=true)",
        request: { body: baseInput },
        response: { body: result, summary: `${result.amlCheck} · ${result.senderTier}` },
        metadata: { source: "demo-mode" },
        timestamp: new Date().toISOString(),
      },
    };
  }

  const started = Date.now();
  const traceBox: { current?: ComposeTraceData } = {};
  try {
    const response = await composeOnA2A(
      [{ agent: step, capability: "remit.kyc-check", input: baseInput }],
      { chainKey: "kite-ozone-testnet", trace: traceBox },
    );
    const result = response.steps[0].output as unknown as KycResult;
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
          summary: `${result.amlCheck} · ${result.senderTier} · billed ${stepResult.costUsdc ?? 0.001} PYUSD`,
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
    const fallback = mockKyc(remittance);
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
