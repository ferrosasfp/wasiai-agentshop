import { NextResponse } from "next/server";
import { runKyc } from "@/application/run-kyc";
import type { Remittance } from "@/types/remittance";

export async function POST(req: Request) {
  const body = (await req.json()) as { remittance: Remittance };
  if (!body?.remittance) {
    return NextResponse.json({ error: "remittance required" }, { status: 400 });
  }
  const result = await runKyc(body.remittance);
  return NextResponse.json({ result });
}
