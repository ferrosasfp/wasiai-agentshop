import type { Remittance } from "@/types/remittance";

export const HIGH_RISK_COUNTRIES: ReadonlyArray<string> = [];

export const PURPOSE_RISK_WEIGHT: Record<Remittance["purpose"], number> = {
  "family-support": 0.1,
  education: 0.2,
  medical: 0.15,
  general: 0.35,
};

export function isAmountSuspicious(amountUSD: number): boolean {
  return amountUSD >= 3000;
}

export function classifySenderTier(args: {
  amountUSD: number;
  purpose: Remittance["purpose"];
  hasLegalId: boolean;
}): "verified" | "basic" | "pending" {
  if (!args.hasLegalId) return "pending";
  if (args.amountUSD < 500 && PURPOSE_RISK_WEIGHT[args.purpose] < 0.3) {
    return "verified";
  }
  return "basic";
}

export function decideAmlOutcome(args: {
  amountUSD: number;
  senderCountry: string;
  receiverCountry: string;
  purpose: Remittance["purpose"];
}): "clean" | "flagged" | "blocked" {
  if (HIGH_RISK_COUNTRIES.includes(args.receiverCountry)) return "blocked";
  if (isAmountSuspicious(args.amountUSD)) return "flagged";
  if (PURPOSE_RISK_WEIGHT[args.purpose] > 0.3 && args.amountUSD > 1000) {
    return "flagged";
  }
  return "clean";
}
