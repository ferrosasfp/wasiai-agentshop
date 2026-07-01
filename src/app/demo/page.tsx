"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { settleAction } from "@/app/demo/settle-action";
import { RemittancePicker } from "@/components/RemittancePicker";
import { PipelineProgress } from "@/components/PipelineProgress";
import { Settlement } from "@/components/Settlement";
import { MarketplacePanel } from "@/components/MarketplacePanel";
import { TraceConsole } from "@/components/TraceConsole";
import { BrandIcon } from "@/components/BrandIcon";
import type {
  CashOutMatch,
  CorridorDiscoveryResult,
  KycResult,
  Remittance,
  SettlementReceipt,
} from "@/types/remittance";
import type { TraceEvent, TraceSection } from "@/types/trace";

type RunMeta = { source?: string; latencyMs?: number };

export default function DemoPage() {
  const [started, setStarted] = useState(0);
  const [remittance, setRemittance] = useState<Remittance | null>(null);
  const [kyc, setKyc] = useState<(KycResult & RunMeta) | null>(null);
  const [corridor, setCorridor] = useState<(CorridorDiscoveryResult & RunMeta) | null>(null);
  const [match, setMatch] = useState<(CashOutMatch & RunMeta) | null>(null);
  const [receipt, setReceipt] = useState<SettlementReceipt | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [traces, setTraces] = useState<TraceEvent[]>([]);
  const [activeSections, setActiveSections] = useState<Set<TraceSection>>(new Set());
  const [inFlightSections, setInFlightSections] = useState<Set<TraceSection>>(new Set());

  const addTrace = useCallback((t: TraceEvent | undefined) => {
    if (!t) return;
    setTraces((prev) => [...prev, t]);
    // When a section's first trace arrives, drop in-flight indicator for 00.
    // (02 keeps "running" until full pipeline finishes; handled in finally block.)
    if (t.section === "00") {
      setInFlightSections((prev) => {
        const next = new Set(prev);
        next.delete("00");
        return next;
      });
    }
  }, []);

  function activate(section: TraceSection, inFlight = true) {
    setActiveSections((prev) => new Set([...prev, section]));
    if (inFlight) {
      setInFlightSections((prev) => new Set([...prev, section]));
    }
  }

  function finish(section: TraceSection) {
    setInFlightSections((prev) => {
      const next = new Set(prev);
      next.delete(section);
      return next;
    });
  }

  function handleStart() {
    setStarted((n) => n + 1);
    setRemittance(null);
    setKyc(null);
    setCorridor(null);
    setMatch(null);
    setReceipt(null);
    setError(null);
    setTraces([]);
    setActiveSections(new Set(["00"]));
    setInFlightSections(new Set(["00"]));
  }

  async function runPipeline(rem: Remittance) {
    setRemittance(rem);
    setKyc(null);
    setCorridor(null);
    setMatch(null);
    setReceipt(null);
    setError(null);
    setIsRunning(true);
    activate("02", true);

    try {
      const kycRes = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remittance: rem }),
      }).then((r) => r.json());
      setKyc(kycRes.result);
      addTrace(kycRes.trace);

      if (!kycRes.result?.isCompliant) {
        setError(`KYC blocked: ${kycRes.result?.reason ?? "unknown reason"}`);
        return;
      }
      await sleep(200);

      const corRes = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remittance: rem }),
      }).then((r) => r.json());
      setCorridor(corRes.result);
      addTrace(corRes.trace);
      await sleep(200);

      const matchRes = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remittance: rem, corridor: corRes.result }),
      }).then((r) => r.json());
      setMatch(matchRes.result);
      addTrace(matchRes.trace);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pipeline failed");
    } finally {
      setIsRunning(false);
      finish("02");
    }
  }

  async function handleSettle() {
    if (!remittance || !corridor || !match) return;
    setIsSettling(true);
    setError(null);
    activate("03", true);
    activate("04", true);
    try {
      // Server Action (runs server-side): the SETTLE_API_SECRET / operator key
      // never reach the browser. The external POST /api/settle route stays
      // Bearer-closed for outside callers.
      const res = await settleAction({ remittance, corridor, match });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setReceipt(res.receipt);
      res.traces.forEach((t: TraceEvent) => addTrace(t));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Settle failed");
    } finally {
      setIsSettling(false);
      finish("03");
      finish("04");
    }
  }

  return (
    <div className="landing-root">
    <main className="px-6 py-12 md:px-12 md:py-16 mx-auto max-w-[1600px]">
      <Link href="/" className="inline-flex items-center gap-2 text-xs mono uppercase tracking-widest text-muted hover:text-ink">
        <span className="brand-mark"><BrandIcon /></span>
        <span>← WasiAgentShop</span>
      </Link>

      <h1 className="serif text-4xl md:text-5xl mt-8 mb-4 leading-tight max-w-4xl">
        Pick a remittance. Watch the agents shop the marketplace.
      </h1>
      <p className="text-sm text-muted mb-12 max-w-3xl">
        We&rsquo;ll walk through <span className="font-medium text-ink">4 phases</span>:
        discovery, agent shopping, authorization, settlement. Each phase reveals live in the
        right column as it happens. Three autonomous agents (KYC compliance, corridor
        discovery, cash-out matching) are paid in PYUSD on Kite Ozone via{" "}
        <code className="text-[11px]">wasiai-a2a /compose</code>. Final settlement is a
        gasless EIP-3009 transfer via the self-hosted facilitator, producing a real tx hash
        on KiteScan.
      </p>

      <div className="mb-10 flex items-center gap-4">
        <button
          type="button"
          onClick={handleStart}
          className="bg-ink text-paper px-8 py-3 mono text-xs uppercase tracking-widest hover:bg-accent transition-colors"
        >
          {started === 0 ? "▶ Start the demo" : "↻ Restart"}
        </button>
        {started > 0 && (
          <span className="text-xs mono text-muted">
            run #{started} · click restart to clean state and re-run
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-10">
          <MarketplacePanel onTrace={addTrace} trigger={started} />

          {started > 0 && (
            <RemittancePicker onSelect={runPipeline} disabled={isRunning || isSettling} />
          )}

          {remittance && (
            <PipelineProgress
              kyc={kyc}
              corridor={corridor}
              match={match}
              isRunning={isRunning}
              receiverCountry={remittance.receiver.country}
            />
          )}

          {match && remittance && (
            <Settlement
              receipt={receipt}
              match={match}
              receiverCountry={remittance.receiver.country}
              onSettle={handleSettle}
              canSettle={!!match}
              isSettling={isSettling}
            />
          )}

          {error && (
            <div className="border border-red-500 p-4 text-sm text-red-600 mono">
              {error}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <TraceConsole
            traces={traces}
            activeSections={activeSections}
            inFlightSections={inFlightSections}
          />
        </div>
      </div>
    </main>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
