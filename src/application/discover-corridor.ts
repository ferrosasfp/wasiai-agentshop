import { composeOnA2A } from "@/infra/a2a-client";
import { A2A_KEY, isDemoMode } from "@/infra/env";
import { mockCorridorDiscovery } from "@/infra/mock-adapter";
import type { CorridorDiscoveryResult, Remittance } from "@/types/remittance";

export interface CorridorRun extends CorridorDiscoveryResult {
  source: "a2a-compose" | "mock-fallback" | "demo-mode";
  latencyMs?: number;
}

export async function discoverCorridor(remittance: Remittance): Promise<CorridorRun> {
  if (isDemoMode() || !A2A_KEY) {
    return { ...mockCorridorDiscovery(remittance), source: "demo-mode" };
  }
  const started = Date.now();
  try {
    const response = await composeOnA2A(
      [
        {
          agent: "agentshop-corridor-discoverer",
          capability: "remit.corridor-find",
          input: {
            amountUSD: remittance.amountUSD,
            senderCountry: remittance.sender.country,
            receiverCountry: remittance.receiver.country,
            prioritizeSpeed: true,
          },
        },
      ],
      { chainKey: "kite-ozone-testnet" },
    );
    const result = response.steps[0].output as unknown as CorridorDiscoveryResult;
    return { ...result, source: "a2a-compose", latencyMs: Date.now() - started };
  } catch (err) {
    console.warn("[discover-corridor] a2a /compose failed, mock fallback:", err);
    return {
      ...mockCorridorDiscovery(remittance),
      source: "mock-fallback",
      latencyMs: Date.now() - started,
    };
  }
}
