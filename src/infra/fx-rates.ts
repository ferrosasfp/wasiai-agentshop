/**
 * Live FX rates from open.er-api.com (free, CORS-friendly, no auth).
 * Cached in-process for 5 minutes to avoid hammering the upstream.
 * Falls back to last-known-good values if upstream is unreachable.
 */

export type SupportedCurrency = "MXN" | "COP" | "PEN" | "ARS";

const COUNTRY_TO_CURRENCY: Record<string, SupportedCurrency> = {
  MX: "MXN",
  CO: "COP",
  PE: "PEN",
  AR: "ARS",
};

const FALLBACK_RATES: Record<SupportedCurrency, number> = {
  MXN: 17.19,
  COP: 3778.6,
  PEN: 3.43,
  ARS: 1389.2,
};

interface CachedRates {
  rates: Record<SupportedCurrency, number>;
  fetchedAt: number;
  date: string;
  source: "live" | "fallback";
}

let _cache: CachedRates | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchLiveRates(): Promise<CachedRates> {
  if (_cache && Date.now() - _cache.fetchedAt < CACHE_TTL_MS) {
    return _cache;
  }
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as {
      result?: string;
      rates?: Record<string, number>;
      time_last_update_utc?: string;
    };
    if (data.result !== "success" || !data.rates) {
      throw new Error(`Bad response: result=${data.result}`);
    }
    const rates: Record<SupportedCurrency, number> = {
      MXN: data.rates.MXN ?? FALLBACK_RATES.MXN,
      COP: data.rates.COP ?? FALLBACK_RATES.COP,
      PEN: data.rates.PEN ?? FALLBACK_RATES.PEN,
      ARS: data.rates.ARS ?? FALLBACK_RATES.ARS,
    };
    _cache = {
      rates,
      fetchedAt: Date.now(),
      date: data.time_last_update_utc?.split(" ").slice(0, 4).join(" ") ?? new Date().toISOString(),
      source: "live",
    };
    return _cache;
  } catch (_err) {
    return {
      rates: FALLBACK_RATES,
      fetchedAt: Date.now(),
      date: new Date().toISOString(),
      source: "fallback",
    };
  }
}

export async function getFxRates(): Promise<CachedRates> {
  return fetchLiveRates();
}

export async function getRateFor(country: string): Promise<number> {
  const currency = COUNTRY_TO_CURRENCY[country] ?? "MXN";
  const data = await fetchLiveRates();
  return data.rates[currency];
}

export function getCurrencyFor(country: string): SupportedCurrency {
  return COUNTRY_TO_CURRENCY[country] ?? "MXN";
}

export function _resetCache(): void {
  _cache = null;
}
