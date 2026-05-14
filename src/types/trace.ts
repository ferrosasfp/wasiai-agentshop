export type TraceSection = "00" | "02" | "03" | "04";

export interface TraceEvent {
  section: TraceSection;
  step: string;
  endpoint: string;
  request?: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
  response?: {
    status?: number;
    body?: unknown;
    summary?: string;
  };
  metadata?: {
    latencyMs?: number;
    costUsdc?: number;
    source?: string;
    downstreamTxHash?: string;
    downstreamBlockNumber?: number;
    chain?: string;
    asset?: string;
  };
  timestamp: string;
}
