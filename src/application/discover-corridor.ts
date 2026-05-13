import { composeOnA2A } from "@/infra/a2a-client";
import { isDemoMode } from "@/infra/env";
import { mockCorridorDiscovery } from "@/infra/mock-adapter";
import type { CorridorDiscoveryResult, Remittance } from "@/types/remittance";

export async function discoverCorridor(
  remittance: Remittance,
): Promise<CorridorDiscoveryResult> {
  if (isDemoMode()) {
    return mockCorridorDiscovery(remittance);
  }
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
  return response.results[0].output as unknown as CorridorDiscoveryResult;
}
