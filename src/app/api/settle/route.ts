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
  signature?: `0x${string}`;
  nonce?: `0x${string}`;
  validAfter?: number;
  validBefore?: number;
}

export async function POST(req: Request) {
  const body = (await req.json()) as SettleBody;
  if (!body?.remittance || !body?.corridor || !body?.match) {
    return NextResponse.json(
      { error: "remittance, corridor, match required" },
      { status: 400 },
    );
  }

  const signedAuthorization =
    body.signature && body.nonce && body.validBefore !== undefined
      ? {
          signature: body.signature,
          nonce: body.nonce,
          validAfter: body.validAfter ?? 0,
          validBefore: body.validBefore,
        }
      : undefined;

  const receipt = await settleRemittance({
    remittance: body.remittance,
    corridorDiscovery: body.corridor,
    match: body.match,
    signedAuthorization,
  });
  return NextResponse.json({ receipt });
}
