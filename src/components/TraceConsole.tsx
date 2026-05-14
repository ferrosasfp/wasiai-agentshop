"use client";

import type { TraceEvent, TraceSection } from "@/types/trace";
import { InfoTooltip } from "@/components/InfoTooltip";

interface Props {
  traces: TraceEvent[];
  activeSections?: Set<TraceSection>;
  inFlightSections?: Set<TraceSection>;
}

const SECTIONS: Array<{
  id: TraceSection;
  title: string;
  subtitle: string;
  tooltip: string;
}> = [
  {
    id: "00",
    title: "Marketplace · WasiAI A2A",
    subtitle: "GET /discover · agent lookup",
    tooltip:
      "Lookup-only. Returns the 3 agents registered in the WasiAI marketplace with their slug + price + chain + asset. Real HTTP GET (you see the latency). No payment, no compose, no transaction.",
  },
  {
    id: "02",
    title: "Agents shopping the marketplace",
    subtitle: "POST /compose × 3 · debits A2A_KEY budget",
    tooltip:
      "Three /compose calls to wasiai-a2a. The gateway routes each to the agent's endpoint and debits the A2A_KEY budget. Each agent returns a PLAN (KYC outcome, ranked corridors, picked partner). No money to receiver moves yet — that's sección 04.",
  },
  {
    id: "03",
    title: "Authorize the payout",
    subtitle: "EIP-3009 signature built server-side",
    tooltip:
      "Local cryptographic operation. The server constructs the EIP-712 TransferWithAuthorization typed data (domain: PYUSD on Kite Ozone, message: from/to/value/nonce) and signs it with SENDER_PRIVATE_KEY. Zero network. ~8ms. The 65-byte signature is the input for sección 04.",
  },
  {
    id: "04",
    title: "Settled onchain",
    subtitle: "POST facilitator/settle · KiteScan tx",
    tooltip:
      "The facilitator receives the signed authorization, pays the gas (gasless UX for the sender), and submits transferWithAuthorization to the PYUSD token contract on Kite Ozone. PYUSD tokens move onchain from sender to receiver. Returns the tx hash you can inspect on KiteScan.",
  },
];

const SOURCE_COLOR: Record<string, string> = {
  "a2a-compose": "text-emerald-400",
  "mock-fallback": "text-amber-400",
  "demo-mode": "text-sky-400",
  facilitator: "text-fuchsia-400",
  discovery: "text-indigo-400",
};

function sourceClass(source?: string): string {
  return SOURCE_COLOR[source ?? ""] ?? "text-slate-300";
}

function prettyJSON(value: unknown): string {
  if (value === undefined || value === null) return "null";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function TraceConsole({
  traces,
  activeSections,
  inFlightSections,
}: Props) {
  const grouped = SECTIONS.map((s) => ({
    ...s,
    events: traces.filter((t) => t.section === s.id),
    isInFlight: inFlightSections?.has(s.id) ?? false,
  })).filter(
    (g) =>
      g.events.length > 0 ||
      activeSections?.has(g.id) ||
      g.isInFlight,
  );

  return (
    <div className="lg:sticky lg:top-6 self-start">
      <div className="text-xs mono uppercase tracking-widest text-muted mb-4">
        ⌗ Inside the call · live trace
      </div>
      {grouped.length === 0 ? (
        <div className="bg-slate-950 text-slate-100 rounded-sm border border-slate-800 p-6 text-slate-500 text-xs mono">
          Press <span className="text-slate-300">▶ Start the demo</span> to see real
          /discover, /compose and /settle calls stream here in real time.
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map((g) => (
            <SectionBlock key={g.id} {...g} />
          ))}
        </div>
      )}
    </div>
  );
}

function SectionBlock({
  id,
  title,
  subtitle,
  tooltip,
  events,
  isInFlight,
}: {
  id: TraceSection;
  title: string;
  subtitle: string;
  tooltip: string;
  events: TraceEvent[];
  isInFlight: boolean;
}) {
  return (
    <div className="bg-slate-950 text-slate-100 rounded-sm border border-slate-800 overflow-visible animate-in fade-in">
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50 overflow-visible">
        <div className="flex items-baseline gap-2">
          <span className="mono text-[10px] uppercase tracking-widest text-slate-400">
            {id}
          </span>
          <span className="font-medium text-sm text-slate-100">{title}</span>
          <span className="ml-1">
            <InfoTooltip dark>{tooltip}</InfoTooltip>
          </span>
        </div>
        <div className="mono text-[10px] text-slate-500 mt-1">{subtitle}</div>
      </div>

      {events.length === 0 ? (
        <div className="p-4 text-[10px] mono">
          {isInFlight ? (
            <span className="text-amber-400 inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              running...
            </span>
          ) : (
            <span className="text-slate-500 italic">waiting...</span>
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-800">
          {events.map((t, i) => (
            <TraceItem key={`${id}-${i}-${t.timestamp}`} t={t} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function TraceItem({ t, index }: { t: TraceEvent; index: number }) {
  const time = new Date(t.timestamp).toLocaleTimeString("en-US", {
    hour12: false,
  });
  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-slate-500 mono text-[10px]">#{index + 1}</span>
        <span className="text-slate-400 mono text-[10px]">{time}</span>
        <span className="ml-auto text-[10px] mono">
          {t.metadata?.latencyMs ? (
            <span className="text-slate-300">{t.metadata.latencyMs}ms</span>
          ) : null}
          {t.metadata?.costUsdc !== undefined ? (
            <span className="ml-2 text-amber-400">
              ${t.metadata.costUsdc.toFixed(3)} {t.metadata.asset ?? "USDC"}
            </span>
          ) : null}
        </span>
      </div>
      <div className="flex items-baseline gap-3 mb-1">
        <span className="text-slate-200 mono text-xs font-medium">{t.step}</span>
        <span className={`mono text-[10px] ${sourceClass(t.metadata?.source)}`}>
          {t.metadata?.source ?? "live"}
        </span>
      </div>
      <div className="text-slate-500 mono text-[10px] mb-3 break-all">
        {t.endpoint}
      </div>

      {t.request?.body !== undefined && (
        <details className="mb-2" open={index === 0}>
          <summary className="text-slate-400 mono text-[10px] cursor-pointer hover:text-slate-200">
            → request
          </summary>
          {t.request.headers && (
            <pre className="bg-black/40 mt-1 p-2 text-[10px] text-slate-400 overflow-x-auto mono">
              {Object.entries(t.request.headers)
                .map(([k, v]) => `${k}: ${v}`)
                .join("\n")}
            </pre>
          )}
          <pre className="bg-black/40 mt-1 p-2 text-[10px] text-slate-200 overflow-auto mono max-h-64">
            {prettyJSON(t.request.body)}
          </pre>
        </details>
      )}

      {(t.response?.body !== undefined || t.response?.summary) && (
        <details open={index === 0}>
          <summary className="text-slate-400 mono text-[10px] cursor-pointer hover:text-slate-200">
            ← response{t.response?.status ? ` ${t.response.status}` : ""}
          </summary>
          {t.response.summary && (
            <div className="bg-black/40 mt-1 p-2 text-[10px] text-emerald-300 mono">
              {t.response.summary}
            </div>
          )}
          {t.response.body !== undefined && (
            <pre className="bg-black/40 mt-1 p-2 text-[10px] text-slate-200 overflow-auto mono max-h-80">
              {prettyJSON(t.response.body)}
            </pre>
          )}
        </details>
      )}

      {t.metadata?.downstreamTxHash && (
        <div className="mt-2 text-[10px] mono">
          <span className="text-slate-500">
            {t.metadata.source === "facilitator" ? "kite tx · " : "downstream tx · "}
          </span>
          <a
            href={
              t.metadata.source === "facilitator"
                ? `https://testnet.kitescan.ai/tx/${t.metadata.downstreamTxHash}`
                : `https://snowtrace.io/tx/${t.metadata.downstreamTxHash}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-fuchsia-400 underline hover:text-fuchsia-300 break-all"
          >
            {t.metadata.downstreamTxHash.slice(0, 14)}...
            {t.metadata.downstreamTxHash.slice(-8)}
          </a>
          {t.metadata.downstreamBlockNumber ? (
            <span className="text-slate-500">
              {" "}
              block {t.metadata.downstreamBlockNumber.toLocaleString()}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
