import { A2A_KEY, A2A_URL } from "./env";

export interface ComposeStep {
  agent: string;
  capability: string;
  input: Record<string, unknown>;
}

export interface ComposeStepResult {
  agent: unknown;
  output: Record<string, unknown>;
  costUsdc?: number;
  latencyMs?: number;
  downstreamTxHash?: `0x${string}`;
  downstreamBlockNumber?: number;
  downstreamSettledAmount?: string;
}

export interface ComposeResponse {
  success: boolean;
  output: Record<string, unknown>;
  steps: ComposeStepResult[];
  totalCostUsdc: number;
  totalLatencyMs: number;
  error?: string;
}

export async function composeOnA2A(
  steps: ComposeStep[],
  opts?: { chainKey?: string },
): Promise<ComposeResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-a2a-key": A2A_KEY,
  };
  if (opts?.chainKey) {
    headers["x-payment-chain"] = opts.chainKey;
  }
  const res = await fetch(`${A2A_URL}/compose`, {
    method: "POST",
    headers,
    body: JSON.stringify({ steps }),
  });
  if (!res.ok) {
    throw new Error(`A2A compose failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as ComposeResponse;
}
