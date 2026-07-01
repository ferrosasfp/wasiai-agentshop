import { NextResponse } from "next/server";
import {
  applyMidMarketRateAll,
  rankCorridors,
  totalCostUSD,
} from "@/core/corridor";
import { getRateFor, getCurrencyFor, getFxRates } from "@/infra/fx-rates";
import { MOCK_CORRIDORS } from "@/lib/mock-data";
import type { CorridorDiscoveryResult } from "@/types/remittance";

interface CorridorInput {
  amountUSD?: number;
  senderCountry?: string;
  receiverCountry?: string;
  prioritizeSpeed?: boolean;
}

export async function POST(req: Request) {
  const body = (await req.json()) as CorridorInput | { input?: CorridorInput };
  const input: CorridorInput =
    "input" in body && body.input ? body.input : (body as CorridorInput);

  if (!input.amountUSD || !input.receiverCountry) {
    return NextResponse.json(
      { error: "amountUSD and receiverCountry required" },
      { status: 400 },
    );
  }

  const midRate = await getRateFor(input.receiverCountry);
  const currency = getCurrencyFor(input.receiverCountry);
  const fxData = await getFxRates();
  const adjusted = applyMidMarketRateAll(MOCK_CORRIDORS, midRate);
  const ranked = rankCorridors(adjusted, input.amountUSD, input.prioritizeSpeed ?? true);
  const recommended = ranked[0];
  const cost = totalCostUSD(recommended, input.amountUSD);

  const result: CorridorDiscoveryResult = {
    shortlist: ranked.slice(0, 3),
    recommended,
    rationale: `Top route is ${recommended.name} via ${recommended.provider}. Effective USD/${currency} rate ${recommended.fxRate} (mid ${midRate.toFixed(4)} · spread ${recommended.spreadBps ?? 0} bps). Cost ${cost.toFixed(2)} USD on a ${input.amountUSD} USD transfer · ${recommended.speedSeconds < 60 ? recommended.speedSeconds + "s" : Math.round(recommended.speedSeconds / 60) + "min"} delivery · reliability ${(recommended.reliabilityScore * 100).toFixed(1)}%. FX source: ${fxData.source} (${fxData.date}).`,
    agentPromptId: `corridor-${recommended.id}-${Date.now()}`,
    amountUSD: input.amountUSD,
    netUsdToDeliver: Math.round((input.amountUSD - cost) * 100) / 100,
  };

  return NextResponse.json(result);
}
