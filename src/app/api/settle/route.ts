import { NextResponse } from "next/server";
import { settleRemittance } from "@/application/settle-remittance";
import type {
  CashOutMatch,
  CorridorDiscoveryResult,
  Remittance,
} from "@/types/remittance";

interface SettleBody {
  remittance: Remittance;
  corridor: CorridorDiscoveryResult;
  match: CashOutMatch;
}

export async function POST(req: Request) {
  const body = (await req.json()) as SettleBody;
  if (!body?.remittance || !body?.corridor || !body?.match) {
    return NextResponse.json(
      { error: "remittance, corridor, match required" },
      { status: 400 },
    );
  }

  try {
    const receipt = await settleRemittance({
      remittance: body.remittance,
      corridorDiscovery: body.corridor,
      match: body.match,
    });
    return NextResponse.json({ receipt });
  } catch (e) {
    const message = e instanceof Error ? e.message : "settle failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
