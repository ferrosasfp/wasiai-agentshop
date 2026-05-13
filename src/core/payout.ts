import type { CashOutMatch, Corridor, Remittance } from "@/types/remittance";

export interface PartnerCatalogEntry {
  id: string;
  name: string;
  type: "oxxo" | "bank" | "wallet";
  countryCoverage: ReadonlyArray<string>;
  cityCoverage: ReadonlyArray<string>;
  fee: number;
  payoutMinutes: number;
}

export const DEFAULT_PARTNER_CATALOG: ReadonlyArray<PartnerCatalogEntry> = [
  {
    id: "ptr-oxxo-mexico",
    name: "OXXO (28k locations)",
    type: "oxxo",
    countryCoverage: ["MX"],
    cityCoverage: ["Oaxaca de Juárez", "CDMX", "Guadalajara", "Monterrey", "Puebla"],
    fee: 0.45,
    payoutMinutes: 5,
  },
  {
    id: "ptr-bbva-mexico",
    name: "BBVA México",
    type: "bank",
    countryCoverage: ["MX"],
    cityCoverage: ["Oaxaca de Juárez", "CDMX", "Guadalajara"],
    fee: 1.95,
    payoutMinutes: 60,
  },
  {
    id: "ptr-bancolombia",
    name: "Bancolombia",
    type: "bank",
    countryCoverage: ["CO"],
    cityCoverage: ["Medellín", "Bogotá", "Cali"],
    fee: 1.50,
    payoutMinutes: 45,
  },
  {
    id: "ptr-yape-peru",
    name: "Yape (BCP wallet)",
    type: "wallet",
    countryCoverage: ["PE"],
    cityCoverage: ["Cusco", "Lima", "Arequipa"],
    fee: 0.0,
    payoutMinutes: 2,
  },
  {
    id: "ptr-mp-arg",
    name: "Mercado Pago",
    type: "wallet",
    countryCoverage: ["AR"],
    cityCoverage: ["Buenos Aires", "Rosario", "Córdoba"],
    fee: 0.0,
    payoutMinutes: 3,
  },
];

export function pickPartner(args: {
  remittance: Remittance;
  catalog?: ReadonlyArray<PartnerCatalogEntry>;
}): PartnerCatalogEntry {
  const catalog = args.catalog ?? DEFAULT_PARTNER_CATALOG;
  const country = args.remittance.receiver.country;
  const preference = args.remittance.receiver.cashOutPreference;
  const city = args.remittance.receiver.city;

  const candidates = catalog.filter((p) => p.countryCoverage.includes(country));
  const preferred = candidates.find((p) => p.type === preference);
  const pick = preferred ?? candidates[0];
  if (!pick) {
    throw new Error(`No payout partner available for ${country}`);
  }
  if (!pick.cityCoverage.includes(city)) {
    // The pick still covers the country, just not the city explicitly.
    // For demo, that's acceptable — fee fallback bumps slightly.
    return { ...pick, fee: pick.fee + 0.25, payoutMinutes: pick.payoutMinutes + 30 };
  }
  return pick;
}

export function buildCashOutMatch(args: {
  remittance: Remittance;
  corridor: Corridor;
  partner: PartnerCatalogEntry;
}): CashOutMatch {
  const { remittance, corridor, partner } = args;
  const pctFee = (remittance.amountUSD * corridor.feePctBps) / 10_000;
  const corridorCost = round2(corridor.feeFlatUSD + pctFee);
  const netAfterCorridor = remittance.amountUSD - corridorCost;
  const netAfterPartner = netAfterCorridor - partner.fee;
  const netDeliveredMXN = Math.round(netAfterPartner * corridor.fxRate * 100) / 100;

  return {
    partnerId: partner.id,
    partnerName: partner.name,
    partnerType: partner.type,
    cityCoverage: remittance.receiver.city,
    recipientFee: partner.fee,
    estimatedPayoutMinutes: partner.payoutMinutes,
    netDeliveredMXN,
    netDeliveredUSD: round2(netAfterPartner),
    exchangeRate: corridor.fxRate,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
