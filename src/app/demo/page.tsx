"use client";

import { useState } from "react";
import Link from "next/link";
import { RemittancePicker } from "@/components/RemittancePicker";
import { PipelineProgress } from "@/components/PipelineProgress";
import { Settlement } from "@/components/Settlement";
import type {
  CashOutMatch,
  CorridorDiscoveryResult,
  KycResult,
  Remittance,
  SettlementReceipt,
} from "@/types/remittance";

export default function DemoPage() {
  const [remittance, setRemittance] = useState<Remittance | null>(null);
  const [kyc, setKyc] = useState<KycResult | null>(null);
  const [corridor, setCorridor] = useState<CorridorDiscoveryResult | null>(null);
  const [match, setMatch] = useState<CashOutMatch | null>(null);
  const [receipt, setReceipt] = useState<SettlementReceipt | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runPipeline(rem: Remittance) {
    setRemittance(rem);
    setKyc(null);
    setCorridor(null);
    setMatch(null);
    setReceipt(null);
    setError(null);
    setIsRunning(true);

    try {
      const kycRes = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remittance: rem }),
      }).then((r) => r.json());
      setKyc(kycRes.result);

      if (!kycRes.result?.isCompliant) {
        setError(`KYC blocked: ${kycRes.result?.reason ?? "unknown reason"}`);
        return;
      }
      await sleep(400);

      const corRes = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remittance: rem }),
      }).then((r) => r.json());
      setCorridor(corRes.result);
      await sleep(400);

      const matchRes = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remittance: rem, corridor: corRes.result }),
      }).then((r) => r.json());
      setMatch(matchRes.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pipeline failed");
    } finally {
      setIsRunning(false);
    }
  }

  async function handleSettle() {
    if (!remittance || !corridor || !match) return;
    setIsSettling(true);
    setError(null);
    try {
      const res = await fetch("/api/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remittance,
          corridor,
          match,
          // Demo mode skips real signing; real mode would inject signed EIP-3009 here
        }),
      }).then((r) => r.json());
      setReceipt(res.receipt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Settle failed");
    } finally {
      setIsSettling(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-12 md:px-16 md:py-16 max-w-4xl mx-auto">
      <Link href="/" className="text-xs mono uppercase tracking-widest text-muted hover:text-ink">
        ← WasiAgentShop
      </Link>

      <h1 className="serif text-4xl md:text-5xl mt-8 mb-4 leading-tight">
        Pick a remittance. Watch the agents shop the marketplace.
      </h1>
      <p className="text-sm text-muted mb-12 max-w-2xl">
        Three autonomous agents work in sequence: KYC compliance, corridor discovery, and
        cash-out matching — each paid in PYUSD on Kite Ozone. Final settlement is a gasless
        EIP-3009 transfer to the receiver.
      </p>

      <div className="space-y-12">
        <RemittancePicker onSelect={runPipeline} disabled={isRunning || isSettling} />

        {remittance && (
          <PipelineProgress
            kyc={kyc}
            corridor={corridor}
            match={match}
            isRunning={isRunning}
            receiverCountry={remittance.receiver.country}
          />
        )}

        {match && (
          <Settlement
            receipt={receipt}
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
    </main>
  );
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
