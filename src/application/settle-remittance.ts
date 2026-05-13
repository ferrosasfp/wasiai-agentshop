import { isDemoMode, SENDER_PRIVATE_KEY } from "@/infra/env";
import { settleOnFacilitatorReal } from "@/infra/facilitator-client";
import { mockSettle } from "@/infra/mock-adapter";
import type {
  CashOutMatch,
  CorridorDiscoveryResult,
  Remittance,
  SettlementReceipt,
} from "@/types/remittance";

export async function settleRemittance(args: {
  remittance: Remittance;
  corridorDiscovery: CorridorDiscoveryResult;
  match: CashOutMatch;
}): Promise<SettlementReceipt> {
  const { remittance, corridorDiscovery, match } = args;

  if (isDemoMode() || !SENDER_PRIVATE_KEY) {
    return mockSettle({
      remittance,
      match,
      corridorId: corridorDiscovery.recommended.id,
    });
  }

  return settleOnFacilitatorReal({
    amountPYUSD: match.netDeliveredUSD,
    corridor: corridorDiscovery.recommended,
    match,
  });
}
