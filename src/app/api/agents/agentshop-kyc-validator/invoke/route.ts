import { NextResponse } from "next/server";
import { decideAmlOutcome, classifySenderTier } from "@/core/compliance";
import type { KycResult, Remittance } from "@/types/remittance";

interface KycInput {
  senderName?: string;
  senderCountry?: Remittance["sender"]["country"];
  legalId?: string;
  amountUSD?: number;
  receiverCountry?: Remittance["receiver"]["country"];
  purpose?: Remittance["purpose"];
}

export async function POST(req: Request) {
  const body = (await req.json()) as KycInput | { input?: KycInput };
  const input: KycInput =
    "input" in body && body.input ? body.input : (body as KycInput);

  if (!input.senderName || !input.amountUSD || !input.receiverCountry) {
    return NextResponse.json(
      { error: "senderName, amountUSD, receiverCountry required" },
      { status: 400 },
    );
  }

  const aml = decideAmlOutcome({
    amountUSD: input.amountUSD,
    senderCountry: input.senderCountry ?? "US",
    receiverCountry: input.receiverCountry,
    purpose: input.purpose ?? "family-support",
  });
  const tier = classifySenderTier({
    amountUSD: input.amountUSD,
    purpose: input.purpose ?? "family-support",
    hasLegalId: Boolean(input.legalId),
  });

  const result: KycResult = {
    isCompliant: aml !== "blocked",
    amlCheck: aml,
    senderTier: tier,
    reason: `${input.senderName} · ${tier} tier · ${aml} AML for ${input.purpose ?? "family-support"}`,
    policyId: `policy-${input.purpose ?? "family-support"}-${tier}`,
  };

  return NextResponse.json(result);
}
