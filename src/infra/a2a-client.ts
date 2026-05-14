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

export interface ComposeTraceData {
  url: string;
  requestBody: { steps: ComposeStep[] };
  responseBody: ComposeResponse;
  status: number;
  latencyMs: number;
}

export async function composeOnA2A(
  steps: ComposeStep[],
  opts?: { chainKey?: string; trace?: { current?: ComposeTraceData } },
): Promise<ComposeResponse> {
  const url = `${A2A_URL}/compose`;
  const started = Date.now();
  const realHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "x-a2a-key": A2A_KEY,
  };
  if (opts?.chainKey) realHeaders["x-payment-chain"] = opts.chainKey;

  const res = await fetch(url, {
    method: "POST",
    headers: realHeaders,
    body: JSON.stringify({ steps }),
  });
  const text = await res.text();
  let parsed: ComposeResponse;
  try {
    parsed = JSON.parse(text) as ComposeResponse;
  } catch {
    throw new Error(`A2A compose returned non-JSON: ${res.status} ${text.slice(0, 200)}`);
  }
  if (opts?.trace) {
    opts.trace.current = {
      url,
      requestBody: { steps },
      responseBody: parsed,
      status: res.status,
      latencyMs: Date.now() - started,
    };
  }
  if (!res.ok) {
    throw new Error(`A2A compose failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return parsed;
}
