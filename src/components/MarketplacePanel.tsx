"use client";

import { useEffect, useState } from "react";

interface DiscoveredAgent {
  slug: string;
  name: string;
  priceUsdc: number;
  payment?: { chain?: string; asset?: string; method?: string };
}

interface DiscoveryResponse {
  agents: DiscoveredAgent[];
  totalEstimatedFee: number;
  discoveryEndpoint: string;
  composeEndpoint: string;
  facilitatorEndpoint: string;
  latencyMs: number;
  registry: string;
}

import type { TraceEvent } from "@/types/trace";
import { InfoTooltip } from "@/components/InfoTooltip";

interface MarketplacePanelProps {
  onTrace?: (trace: TraceEvent) => void;
  trigger?: number; // bump this number to (re-)trigger discovery
}

export function MarketplacePanel({ onTrace, trigger = 0 }: MarketplacePanelProps = {}) {
  const [data, setData] = useState<DiscoveryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (trigger === 0) return;
    setLoading(true);
    setData(null);
    fetch("/api/marketplace", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (d.trace && onTrace) onTrace(d.trace as TraceEvent);
      })
      .catch(() => {
        /* silent fallback */
      })
      .finally(() => setLoading(false));
  }, [trigger, onTrace]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs mono uppercase tracking-widest text-muted">
          00 · Marketplace · WasiAI A2A
        </span>
        <InfoTooltip>
          Discovery-only: the chatbot calls wasiai-a2a /discover to list agents available
          on the marketplace. No payment, no compose, no transaction yet — just a lookup.
          Returns slug + price + chain + asset per agent so the chatbot can build a pipeline.
        </InfoTooltip>
      </div>

      <div className="border border-line p-6 bg-white">
        <div className="flex items-baseline justify-between mb-4">
          <div className="serif text-xl">
            {loading
              ? "Discovering agents..."
              : data
                ? `Discovered ${data.agents.length} agents`
                : "Idle · press Start to discover"}
          </div>
          <div className="text-xs mono text-muted">
            {data ? `${data.latencyMs}ms via /discover` : "—"}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {(data?.agents ?? []).map((a, idx) => (
            <div
              key={a.slug}
              className="flex items-center justify-between py-2 border-b border-line last:border-b-0"
            >
              <div className="flex items-baseline gap-3">
                <span className="mono text-xs text-muted">{idx + 1}.</span>
                <span className="font-medium text-sm">{a.name}</span>
                <span className="mono text-xs text-muted">{a.slug}</span>
              </div>
              <div className="mono text-xs">
                <span className="font-medium">${a.priceUsdc}</span>
                <span className="text-muted">
                  {" "}
                  {a.payment?.asset ?? "PYUSD"} · {a.payment?.chain ?? "kite-ozone-testnet"}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-sm text-muted">Querying wasiai-a2a /discover...</div>
          )}
        </div>

        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mono text-muted pt-3 border-t border-line">
            <div>
              <span className="text-ink font-medium">Composed pipeline:</span>{" "}
              KYC → corridor → cash-out
            </div>
            <div>
              <span className="text-ink font-medium">Total agent fees:</span> $
              {data.totalEstimatedFee.toFixed(3)} PYUSD via x402
            </div>
            <div className="md:col-span-2">
              <span className="text-ink font-medium">Stack:</span>{" "}
              <code className="text-[10px]">a2a /discover</code> →{" "}
              <code className="text-[10px]">a2a /compose</code> →{" "}
              <code className="text-[10px]">facilitator /settle</code> on Kite Ozone
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
