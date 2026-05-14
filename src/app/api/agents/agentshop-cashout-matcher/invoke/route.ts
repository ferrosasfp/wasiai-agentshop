import { NextResponse } from "next/server";
import { applyMidMarketRate } from "@/core/corridor";
import { buildCashOutMatch, pickPartner } from "@/core/payout";
import { getRateFor } from "@/infra/fx-rates";
import { MOCK_CORRIDORS } from "@/lib/mock-data";
import type { CashOutMatch, Remittance } from "@/types/remittance";

interface MatchInput {
  receiverCountry?: Remittance["receiver"]["country"];
  receiverCity?: string;
  preference?: Remittance["receiver"]["cashOutPreference"];
  corridorId?: string;
  netUsdToDeliver?: number;
  amountUSD?: number;
}

export async function POST(req: Request) {
  const body = (await req.json()) as MatchInput | { input?: MatchInput };
  const input: MatchInput =
    "input" in body && body.input ? body.input : (body as MatchInput);

  if (!input.receiverCountry || !input.preference) {
    return NextResponse.json(
      { error: "receiverCountry, preference required" },
      { status: 400 },
    );
  }

  const baseCorridor =
    MOCK_CORRIDORS.find((c) => c.id === input.corridorId) ?? MOCK_CORRIDORS[1];
  const midRate = await getRateFor(input.receiverCountry);
  const corridor = applyMidMarketRate(baseCorridor, midRate);

  const fakeRemittance: Remittance = {
    id: "agent-call",
    sender: { name: "x", country: "US", legalId: "x" },
    receiver: {
      name: "x",
      country: input.receiverCountry,
      city: input.receiverCity ?? "—",
      cashOutPreference: input.preference,
    },
    amountUSD: input.amountUSD ?? input.netUsdToDeliver ?? 200,
    purpose: "family-support",
    createdAt: new Date().toISOString(),
    status: "matching",
  };

  const partner = pickPartner({ remittance: fakeRemittance });
  const result: CashOutMatch = buildCashOutMatch({
    remittance: fakeRemittance,
    corridor,
    partner,
  });

  return NextResponse.json(result);
}
