import { NextResponse } from "next/server";
import { rankCorridors, totalCostUSD } from "@/core/corridor";
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

  if (!input.amountUSD) {
    return NextResponse.json({ error: "amountUSD required" }, { status: 400 });
  }

  const ranked = rankCorridors(MOCK_CORRIDORS, input.amountUSD, input.prioritizeSpeed ?? true);
  const recommended = ranked[0];
  const cost = totalCostUSD(recommended, input.amountUSD);

  const result: CorridorDiscoveryResult = {
    shortlist: ranked.slice(0, 3),
    recommended,
    rationale: `Top route is ${recommended.name} via ${recommended.provider}. Effective cost ${cost.toFixed(2)} USD on a ${input.amountUSD} USD transfer (${recommended.speedSeconds < 60 ? recommended.speedSeconds + "s" : Math.round(recommended.speedSeconds / 60) + "min"} delivery, reliability ${(recommended.reliabilityScore * 100).toFixed(1)}%).`,
    agentPromptId: `corridor-${recommended.id}-${Date.now()}`,
  };

  return NextResponse.json(result);
}
