import type { Remittance } from "@/types/remittance";

export const SUPPORTED_RECEIVER_COUNTRIES: ReadonlyArray<Remittance["receiver"]["country"]> = [
  "MX",
  "CO",
  "PE",
  "AR",
];

export function isCorridorSupported(remittance: Remittance): boolean {
  return SUPPORTED_RECEIVER_COUNTRIES.includes(remittance.receiver.country);
}

export function formatAmountUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatLocalCurrency(amount: number, country: string): string {
  const map: Record<string, { currency: string; locale: string }> = {
    MX: { currency: "MXN", locale: "es-MX" },
    CO: { currency: "COP", locale: "es-CO" },
    PE: { currency: "PEN", locale: "es-PE" },
    AR: { currency: "ARS", locale: "es-AR" },
  };
  const cfg = map[country] ?? { currency: "USD", locale: "en-US" };
  return new Intl.NumberFormat(cfg.locale, {
    style: "currency",
    currency: cfg.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
