import { isDemoMode, RECEIVER_ADDRESS, SENDER_ADDRESS } from "@/infra/env";
import {
  settleOnFacilitator,
  type SignedAuthorization,
} from "@/infra/facilitator-client";
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
  signedAuthorization?: SignedAuthorization;
}): Promise<SettlementReceipt> {
  const { remittance, corridorDiscovery, match } = args;

  if (isDemoMode() || !args.signedAuthorization) {
    return mockSettle({
      remittance,
      match,
      corridorId: corridorDiscovery.recommended.id,
    });
  }

  return settleOnFacilitator({
    sender: SENDER_ADDRESS,
    receiver: RECEIVER_ADDRESS,
    amountPYUSD: match.netDeliveredUSD,
    corridor: corridorDiscovery.recommended,
    match,
    signedAuthorization: args.signedAuthorization,
  });
}
