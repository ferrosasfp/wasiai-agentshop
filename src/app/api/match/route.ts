import { NextResponse } from "next/server";
import { matchCashOut } from "@/application/match-cashout";
import type { CorridorDiscoveryResult, Remittance } from "@/types/remittance";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    remittance: Remittance;
    corridor: CorridorDiscoveryResult;
  };
  if (!body?.remittance || !body?.corridor) {
    return NextResponse.json(
      { error: "remittance and corridor required" },
      { status: 400 },
    );
  }
  const result = await matchCashOut(body.remittance, body.corridor);
  return NextResponse.json({ result });
}
