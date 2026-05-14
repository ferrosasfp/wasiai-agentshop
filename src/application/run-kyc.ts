import { composeOnA2A } from "@/infra/a2a-client";
import { A2A_KEY, isDemoMode } from "@/infra/env";
import { mockKyc } from "@/infra/mock-adapter";
import type { KycResult, Remittance } from "@/types/remittance";

export interface KycRun extends KycResult {
  source: "a2a-compose" | "mock-fallback" | "demo-mode";
  latencyMs?: number;
}

export async function runKyc(remittance: Remittance): Promise<KycRun> {
  if (isDemoMode() || !A2A_KEY) {
    return { ...mockKyc(remittance), source: "demo-mode" };
  }
  const started = Date.now();
  try {
    const response = await composeOnA2A(
      [
        {
          agent: "agentshop-kyc-validator",
          capability: "remit.kyc-check",
          input: {
            senderName: remittance.sender.name,
            senderCountry: remittance.sender.country,
            legalId: remittance.sender.legalId,
            amountUSD: remittance.amountUSD,
            receiverCountry: remittance.receiver.country,
            purpose: remittance.purpose,
          },
        },
      ],
      { chainKey: "kite-ozone-testnet" },
    );
    const result = response.results[0].output as unknown as KycResult;
    return { ...result, source: "a2a-compose", latencyMs: Date.now() - started };
  } catch (err) {
    console.warn("[run-kyc] a2a /compose failed, mock fallback:", err);
    return { ...mockKyc(remittance), source: "mock-fallback", latencyMs: Date.now() - started };
  }
}
