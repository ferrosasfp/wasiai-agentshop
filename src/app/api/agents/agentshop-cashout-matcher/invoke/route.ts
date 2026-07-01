import { NextResponse } from "next/server";
import { applyMidMarketRate } from "@/core/corridor";
import { buildCashOutMatch, pickPartner } from "@/core/payout";
import { getRateFor } from "@/infra/fx-rates";
import { MOCK_CORRIDORS } from "@/lib/mock-data";
import type {
  CashOutMatch,
  Corridor,
  CorridorDiscoveryResult,
  Remittance,
} from "@/types/remittance";

interface MatchInput {
  receiverCountry?: Remittance["receiver"]["country"];
  receiverCity?: string;
  preference?: Remittance["receiver"]["cashOutPreference"];
  corridorId?: string;
  netUsdToDeliver?: number;
  amountUSD?: number;
  /** Injected by the a2a `passOutput` passthrough of the prior corridor step. */
  previousOutput?: CorridorDiscoveryResult;
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

  // Recover context from the corridor step when composed in a pipeline: the
  // gross amount (so we don't fall back to a placeholder) and the exact
  // corridor it recommended (so fee/FX stay consistent across steps).
  const prev = input.previousOutput;
  const amountUSD =
    input.amountUSD ?? prev?.amountUSD ?? input.netUsdToDeliver ?? 200;

  let corridor: Corridor;
  if (prev?.recommended) {
    // Already rate-adjusted by the corridor step — reuse verbatim.
    corridor = prev.recommended;
  } else {
    const baseCorridor =
      MOCK_CORRIDORS.find((c) => c.id === input.corridorId) ?? MOCK_CORRIDORS[1];
    const midRate = await getRateFor(input.receiverCountry);
    corridor = applyMidMarketRate(baseCorridor, midRate);
  }

  const fakeRemittance: Remittance = {
    id: "agent-call",
    sender: { name: "x", country: "US", legalId: "x" },
    receiver: {
      name: "x",
      country: input.receiverCountry,
      city: input.receiverCity ?? "—",
      cashOutPreference: input.preference,
    },
    amountUSD,
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
