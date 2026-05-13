import { A2A_KEY, A2A_URL } from "./env";

export interface ComposeStep {
  agent: string;
  capability: string;
  input: Record<string, unknown>;
}

export interface ComposeResponse {
  results: Array<{
    agent: string;
    output: Record<string, unknown>;
  }>;
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
