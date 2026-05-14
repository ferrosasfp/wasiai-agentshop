import { composeOnA2A } from "@/infra/a2a-client";
import { A2A_KEY, isDemoMode } from "@/infra/env";
import { mockCashOutMatch } from "@/infra/mock-adapter";
import type { CashOutMatch, CorridorDiscoveryResult, Remittance } from "@/types/remittance";

export interface MatchRun extends CashOutMatch {
  source: "a2a-compose" | "mock-fallback" | "demo-mode";
  latencyMs?: number;
}

export async function matchCashOut(
  remittance: Remittance,
  corridorDiscovery: CorridorDiscoveryResult,
): Promise<MatchRun> {
  if (isDemoMode() || !A2A_KEY) {
    return { ...mockCashOutMatch(remittance, corridorDiscovery), source: "demo-mode" };
  }
  const started = Date.now();
  try {
    const response = await composeOnA2A(
      [
        {
          agent: "agentshop-cashout-matcher",
          capability: "remit.cashout-match",
          input: {
            receiverCountry: remittance.receiver.country,
            receiverCity: remittance.receiver.city,
            preference: remittance.receiver.cashOutPreference,
            corridorId: corridorDiscovery.recommended.id,
            amountUSD: remittance.amountUSD,
            netUsdToDeliver:
              remittance.amountUSD -
              corridorDiscovery.recommended.feeFlatUSD -
              (remittance.amountUSD * corridorDiscovery.recommended.feePctBps) / 10_000,
          },
        },
      ],
      { chainKey: "kite-ozone-testnet" },
    );
    const result = response.steps[0].output as unknown as CashOutMatch;
    return { ...result, source: "a2a-compose", latencyMs: Date.now() - started };
  } catch (err) {
    console.warn("[match-cashout] a2a /compose failed, mock fallback:", err);
    return {
      ...mockCashOutMatch(remittance, corridorDiscovery),
      source: "mock-fallback",
      latencyMs: Date.now() - started,
    };
  }
}
