import { SENDER_PRIVATE_KEY } from "@/infra/env";
import { settleOnFacilitatorReal } from "@/infra/facilitator-client";
import { mockSettle } from "@/infra/mock-adapter";
import type {
  CashOutMatch,
  CorridorDiscoveryResult,
  Remittance,
  SettlementReceipt,
} from "@/types/remittance";

/**
 * Settle gate uses ONLY SENDER_PRIVATE_KEY presence, not NEXT_PUBLIC_DEMO_MODE.
 * Rationale: the demo flag controls the agent-call mocks (KYC/discover/match) for
 * reliability of the visible pipeline; the settle path is independently flipped to
 * real when we have a server-side key. This lets us show a REAL Kite tx hash on
 * KiteScan while keeping the upstream agent calls deterministic.
 */
export async function settleRemittance(args: {
  remittance: Remittance;
  corridorDiscovery: CorridorDiscoveryResult;
  match: CashOutMatch;
}): Promise<SettlementReceipt> {
  const { remittance, corridorDiscovery, match } = args;

  if (!SENDER_PRIVATE_KEY) {
    return mockSettle({
      remittance,
      match,
      corridorId: corridorDiscovery.recommended.id,
    });
  }

  return settleOnFacilitatorReal({
    amount: match.netDeliveredUSD,
    corridor: corridorDiscovery.recommended,
    match,
  });
}
