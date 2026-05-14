"use client";

import { formatLocalCurrency } from "@/core/remittance";
import type {
  CashOutMatch,
  CorridorDiscoveryResult,
  KycResult,
} from "@/types/remittance";

type RunMetadata = { source?: string; latencyMs?: number };

interface Props {
  kyc: (KycResult & RunMetadata) | null;
  corridor: (CorridorDiscoveryResult & RunMetadata) | null;
  match: (CashOutMatch & RunMetadata) | null;
  isRunning: boolean;
  receiverCountry: string;
}

export function PipelineProgress({ kyc, corridor, match, isRunning, receiverCountry }: Props) {
  return (
    <div>
      <div className="text-xs mono uppercase tracking-widest text-muted mb-4">
        02 · Agents shopping the marketplace
      </div>

      <div className="space-y-4">
        <StepCard
          label="agentshop-kyc-validator"
          tag="$0.001 PYUSD · Kite"
          route={routeLabel(kyc)}
          state={
            kyc
              ? kyc.isCompliant
                ? "DONE"
                : "REJECTED"
              : isRunning
                ? "RUNNING"
                : "WAITING"
          }
        >
          {kyc ? (
            <>
              <div className="text-sm">
                AML <strong>{kyc.amlCheck}</strong> · sender tier{" "}
                <strong>{kyc.senderTier}</strong> · policy{" "}
                <span className="mono text-xs text-muted">{kyc.policyId}</span>
              </div>
              {kyc.reason && (
                <div className="text-xs text-muted mt-2">{kyc.reason}</div>
              )}
            </>
          ) : null}
        </StepCard>

        <StepCard
          label="agentshop-corridor-discoverer"
          tag="$0.05 PYUSD · Kite"
          route={routeLabel(corridor)}
          state={corridor ? "DONE" : kyc?.isCompliant ? (isRunning ? "RUNNING" : "WAITING") : "WAITING"}
        >
          {corridor ? (
            <>
              <div className="text-sm mb-2">
                <strong>{corridor.recommended.name}</strong> · FX{" "}
                {corridor.recommended.fxRate} ·{" "}
                {corridor.recommended.speedSeconds < 60
                  ? `${corridor.recommended.speedSeconds}s`
                  : `${Math.round(corridor.recommended.speedSeconds / 60)} min`}{" "}
                · reliability{" "}
                {(corridor.recommended.reliabilityScore * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted">{corridor.rationale}</div>
              <div className="text-xs text-muted mt-2 mono">
                shortlist:{" "}
                {corridor.shortlist
                  .slice(0, 3)
                  .map((c) => c.name)
                  .join(" · ")}
              </div>
            </>
          ) : null}
        </StepCard>

        <StepCard
          label="agentshop-cashout-matcher"
          tag="$0.01 PYUSD · Kite"
          route={routeLabel(match)}
          state={match ? "DONE" : corridor ? (isRunning ? "RUNNING" : "WAITING") : "WAITING"}
        >
          {match ? (
            <>
              <div className="text-sm mb-2">
                <strong>{match.partnerName}</strong> · payout in{" "}
                <strong>{match.estimatedPayoutMinutes}min</strong>
              </div>
              <div className="serif text-2xl">
                {formatLocalCurrency(match.netDeliveredLocal, receiverCountry)}{" "}
                <span className="text-xs mono text-muted ml-2">
                  net delivered
                </span>
              </div>
              <div className="text-xs text-muted mt-2">
                exchange rate {match.exchangeRate} · partner fee $
                {match.recipientFee.toFixed(2)}
              </div>
            </>
          ) : null}
        </StepCard>
      </div>
    </div>
  );
}

function routeLabel(step: RunMetadata | null): string {
  if (!step?.source) return "wasiai-a2a /compose · billed via A2A_KEY";
  if (step.source === "a2a-compose") {
    return `wasiai-a2a /compose · LIVE · ${step.latencyMs ?? 0}ms · A2A_KEY debited on chain 2368`;
  }
  if (step.source === "mock-fallback") {
    return `wasiai-a2a /compose · fallback to mock (a2a unreachable after ${step.latencyMs ?? 0}ms)`;
  }
  return "demo mode · deterministic mock (a2a /compose disabled by NEXT_PUBLIC_DEMO_MODE)";
}

function StepCard({
  label,
  tag,
  route,
  state,
  children,
}: {
  label: string;
  tag: string;
  route?: string;
  state: "WAITING" | "RUNNING" | "DONE" | "REJECTED";
  children?: React.ReactNode;
}) {
  const stateColor =
    state === "DONE"
      ? "bg-accent"
      : state === "RUNNING"
        ? "bg-warm animate-pulse"
        : state === "REJECTED"
          ? "bg-red-500"
          : "bg-line";

  return (
    <div className="border border-line p-5">
      <div className="flex items-center gap-3 mb-2">
        <span className={`w-3 h-3 rounded-full ${stateColor}`}></span>
        <span className="mono text-xs uppercase tracking-widest font-medium">
          {label}
        </span>
        <span className="ml-auto mono text-xs text-muted">{tag}</span>
        <span className="mono text-xs text-muted">{state}</span>
      </div>
      {route && (
        <div className="mono text-[10px] text-muted ml-6 mb-2">↳ {route}</div>
      )}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
