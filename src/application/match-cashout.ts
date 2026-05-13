import { composeOnA2A } from "@/infra/a2a-client";
import { isDemoMode } from "@/infra/env";
import { mockCashOutMatch } from "@/infra/mock-adapter";
import type { CashOutMatch, CorridorDiscoveryResult, Remittance } from "@/types/remittance";

export async function matchCashOut(
  remittance: Remittance,
  corridorDiscovery: CorridorDiscoveryResult,
): Promise<CashOutMatch> {
  if (isDemoMode()) {
    return mockCashOutMatch(remittance, corridorDiscovery);
  }
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
          netUsdToDeliver:
            remittance.amountUSD -
            corridorDiscovery.recommended.feeFlatUSD -
            (remittance.amountUSD * corridorDiscovery.recommended.feePctBps) / 10_000,
        },
      },
    ],
    { chainKey: "kite-ozone-testnet" },
  );
  return response.results[0].output as unknown as CashOutMatch;
}
