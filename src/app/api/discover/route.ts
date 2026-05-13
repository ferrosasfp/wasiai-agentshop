import { NextResponse } from "next/server";
import { discoverCorridor } from "@/application/discover-corridor";
import type { Remittance } from "@/types/remittance";

export async function POST(req: Request) {
  const body = (await req.json()) as { remittance: Remittance };
  if (!body?.remittance) {
    return NextResponse.json({ error: "remittance required" }, { status: 400 });
  }
  const result = await discoverCorridor(body.remittance);
  return NextResponse.json({ result });
}
