import { decideAmlOutcome, classifySenderTier } from "@/core/compliance";
import { applyMidMarketRateAll, rankCorridors, totalCostUSD } from "@/core/corridor";
import { buildCashOutMatch, pickPartner } from "@/core/payout";
import { explorerTxUrl, kitescanUrl } from "@/core/settlement";
import { MOCK_CORRIDORS } from "@/lib/mock-data";
import { getCurrencyFor } from "@/infra/fx-rates";
import type {
  CashOutMatch,
  CorridorDiscoveryResult,
  KycResult,
  Remittance,
  SettlementReceipt,
} from "@/types/remittance";
import {
  RECEIVER_ADDRESS,
  SENDER_ADDRESS,
  SETTLE_CHAIN_ID,
  SETTLE_NETWORK,
} from "./env";

export function mockKyc(remittance: Remittance): KycResult {
  const aml = decideAmlOutcome({
    amountUSD: remittance.amountUSD,
    senderCountry: remittance.sender.country,
    receiverCountry: remittance.receiver.country,
    purpose: remittance.purpose,
  });
  const tier = classifySenderTier({
    amountUSD: remittance.amountUSD,
    purpose: remittance.purpose,
    hasLegalId: Boolean(remittance.sender.legalId),
  });
  const isCompliant = aml !== "blocked";
  return {
    isCompliant,
    amlCheck: aml,
    senderTier: tier,
    reason:
      aml === "clean"
        ? `Sender ${remittance.sender.name} verified · ${tier} tier · purpose ${remittance.purpose}`
        : aml === "flagged"
          ? `Manual review queued: amount ${remittance.amountUSD} crosses threshold for ${remittance.purpose}`
          : `Blocked corridor: ${remittance.receiver.country} not supported in this lane`,
    policyId: `policy-${remittance.purpose}-${tier}`,
  };
}

export function mockCorridorDiscovery(remittance: Remittance): CorridorDiscoveryResult {
  // Mock uses static fallback rates (no network) — only kicks in when isDemoMode
  // OR when a2a /compose fails. Real flow goes through the agent endpoint which
  // fetches live FX from open.er-api.com.
  const fallbackRates: Record<string, number> = { MX: 17.19, CO: 3778.6, PE: 3.43, AR: 1389.2 };
  const midRate = fallbackRates[remittance.receiver.country] ?? 17.19;
  const currency = getCurrencyFor(remittance.receiver.country);
  const adjusted = applyMidMarketRateAll(MOCK_CORRIDORS, midRate);
  const ranked = rankCorridors(adjusted, remittance.amountUSD, true);
  const recommended = ranked[0];
  const cost = totalCostUSD(recommended, remittance.amountUSD);
  return {
    shortlist: ranked.slice(0, 3),
    recommended,
    rationale: `Top route is ${recommended.name} via ${recommended.provider}. Effective USD/${currency} rate ${recommended.fxRate} (mid ${midRate.toFixed(4)}, fallback). Cost ${cost.toFixed(2)} USD on a ${remittance.amountUSD} USD transfer · ${recommended.speedSeconds < 60 ? "sub-minute" : Math.round(recommended.speedSeconds / 60) + "min"} delivery, reliability ${(recommended.reliabilityScore * 100).toFixed(1)}%.`,
    agentPromptId: `corridor-${recommended.id}-${Date.now()}`,
  };
}

export function mockCashOutMatch(
  remittance: Remittance,
  corridorDiscovery: CorridorDiscoveryResult,
): CashOutMatch {
  const partner = pickPartner({ remittance });
  return buildCashOutMatch({
    remittance,
    corridor: corridorDiscovery.recommended,
    partner,
  });
}

export function mockSettle(args: {
  remittance: Remittance;
  match: CashOutMatch;
  corridorId: string;
}): SettlementReceipt {
  const fakeHash = ("0x" +
    Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join(
      "",
    )) as `0x${string}`;
  return {
    txHash: fakeHash,
    chainId: SETTLE_CHAIN_ID,
    blockNumber: 1_500_000 + Math.floor(Math.random() * 100_000),
    fromWallet: SENDER_ADDRESS,
    toWallet: RECEIVER_ADDRESS,
    amountPYUSD: args.match.netDeliveredUSD,
    corridor: args.corridorId,
    partner: args.match.partnerName,
    network: SETTLE_NETWORK,
    facilitator: "wasiai-facilitator (demo mode)",
  };
}

export { explorerTxUrl, kitescanUrl };
