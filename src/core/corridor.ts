import type { Corridor } from "@/types/remittance";

export function applyMidMarketRate(corridor: Corridor, midRate: number): Corridor {
  const spread = corridor.spreadBps ?? 0;
  return {
    ...corridor,
    fxRate: round4(midRate * (1 + spread / 10_000)),
  };
}

export function applyMidMarketRateAll(
  corridors: ReadonlyArray<Corridor>,
  midRate: number,
): Corridor[] {
  return corridors.map((c) => applyMidMarketRate(c, midRate));
}

export interface CorridorScoreInput {
  corridor: Corridor;
  amountUSD: number;
  prioritizeSpeed: boolean;
}

export function totalCostUSD(corridor: Corridor, amountUSD: number): number {
  const pctFee = (amountUSD * corridor.feePctBps) / 10_000;
  return round2(corridor.feeFlatUSD + pctFee);
}

export function effectiveFxRate(corridor: Corridor, amountUSD: number): number {
  const cost = totalCostUSD(corridor, amountUSD);
  const netUSD = amountUSD - cost;
  if (netUSD <= 0) return 0;
  return round4((netUSD * corridor.fxRate) / amountUSD);
}

export function corridorScore(input: CorridorScoreInput): number {
  const { corridor, amountUSD, prioritizeSpeed } = input;
  const fxComponent = effectiveFxRate(corridor, amountUSD) * 100;
  const reliabilityComponent = corridor.reliabilityScore * 30;
  const speedPenalty = Math.min(40, corridor.speedSeconds / 60);
  const speedComponent = prioritizeSpeed
    ? 50 - speedPenalty
    : 25 - speedPenalty / 2;
  const liquidityBonus = Math.min(10, Math.log10(corridor.liquidityUSD / 1_000_000));
  return round2(fxComponent + reliabilityComponent + speedComponent + liquidityBonus);
}

export function rankCorridors(
  catalog: ReadonlyArray<Corridor>,
  amountUSD: number,
  prioritizeSpeed: boolean,
): Corridor[] {
  return [...catalog].sort((a, b) => {
    const sa = corridorScore({ corridor: a, amountUSD, prioritizeSpeed });
    const sb = corridorScore({ corridor: b, amountUSD, prioritizeSpeed });
    return sb - sa;
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
