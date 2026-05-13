export type RemittanceStatus =
  | "pending"
  | "validating"
  | "discovering"
  | "matching"
  | "ready"
  | "settling"
  | "settled"
  | "rejected";

export interface Remittance {
  id: string;
  sender: {
    name: string;
    country: "US" | "CA" | "ES";
    legalId: string;
  };
  receiver: {
    name: string;
    country: "MX" | "CO" | "PE" | "AR";
    city: string;
    cashOutPreference: "oxxo" | "bank" | "wallet";
  };
  amountUSD: number;
  purpose: "family-support" | "education" | "medical" | "general";
  createdAt: string;
  status: RemittanceStatus;
}

export interface KycResult {
  isCompliant: boolean;
  amlCheck: "clean" | "flagged" | "blocked";
  senderTier: "verified" | "basic" | "pending";
  reason?: string;
  policyId: string;
}

export interface Corridor {
  id: string;
  name: string;
  provider: string;
  fxRate: number;
  feeFlatUSD: number;
  feePctBps: number;
  speedSeconds: number;
  reliabilityScore: number;
  liquidityUSD: number;
}

export interface CorridorDiscoveryResult {
  shortlist: Corridor[];
  recommended: Corridor;
  rationale: string;
  agentPromptId: string;
}

export interface CashOutMatch {
  partnerId: string;
  partnerName: string;
  partnerType: "oxxo" | "bank" | "wallet";
  cityCoverage: string;
  recipientFee: number;
  estimatedPayoutMinutes: number;
  netDeliveredMXN: number;
  netDeliveredUSD: number;
  exchangeRate: number;
}

export interface SettlementReceipt {
  txHash: `0x${string}`;
  chainId: number;
  blockNumber: number;
  fromWallet: `0x${string}`;
  toWallet: `0x${string}`;
  amountPYUSD: number;
  corridor: string;
  partner: string;
  network: string;
  facilitator: string;
}

export interface DemoPipelineState {
  remittance: Remittance | null;
  kyc: KycResult | null;
  corridor: CorridorDiscoveryResult | null;
  match: CashOutMatch | null;
  receipt: SettlementReceipt | null;
}
