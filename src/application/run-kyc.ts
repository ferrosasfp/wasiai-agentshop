import { composeOnA2A } from "@/infra/a2a-client";
import { isDemoMode } from "@/infra/env";
import { mockKyc } from "@/infra/mock-adapter";
import type { KycResult, Remittance } from "@/types/remittance";

export async function runKyc(remittance: Remittance): Promise<KycResult> {
  if (isDemoMode()) {
    return mockKyc(remittance);
  }
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
  return response.results[0].output as unknown as KycResult;
}
