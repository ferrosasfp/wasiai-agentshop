import type { Corridor, Remittance } from "@/types/remittance";

export const MOCK_REMITTANCES: Remittance[] = [
  {
    id: "rem-001",
    sender: {
      name: "María Hernández",
      country: "US",
      legalId: "SSN-***-**-4827",
    },
    receiver: {
      name: "Doña Carmen Hernández",
      country: "MX",
      city: "Oaxaca de Juárez",
      cashOutPreference: "oxxo",
    },
    amountUSD: 200,
    purpose: "family-support",
    createdAt: "2026-05-13T15:42:00Z",
    status: "pending",
  },
  {
    id: "rem-002",
    sender: {
      name: "Jorge Ramírez",
      country: "US",
      legalId: "EIN-***-**-1182",
    },
    receiver: {
      name: "Ana Ramírez",
      country: "CO",
      city: "Medellín",
      cashOutPreference: "bank",
    },
    amountUSD: 850,
    purpose: "education",
    createdAt: "2026-05-13T16:01:00Z",
    status: "pending",
  },
  {
    id: "rem-003",
    sender: {
      name: "Luis Quispe",
      country: "ES",
      legalId: "DNI-Y****-1845",
    },
    receiver: {
      name: "Rosa Quispe",
      country: "PE",
      city: "Cusco",
      cashOutPreference: "wallet",
    },
    amountUSD: 320,
    purpose: "medical",
    createdAt: "2026-05-13T17:18:00Z",
    status: "pending",
  },
];

export const MOCK_CORRIDORS: Corridor[] = [
  {
    id: "cor-bitso-shift",
    name: "Bitso Shift",
    provider: "Bitso (LATAM crypto rails)",
    fxRate: 18.85,
    feeFlatUSD: 0.5,
    feePctBps: 25,
    speedSeconds: 12,
    reliabilityScore: 0.97,
    liquidityUSD: 5_000_000,
  },
  {
    id: "cor-felix-pay",
    name: "Felix Pay",
    provider: "Felix Pay (Stellar rails)",
    fxRate: 19.05,
    feeFlatUSD: 0,
    feePctBps: 45,
    speedSeconds: 8,
    reliabilityScore: 0.94,
    liquidityUSD: 2_400_000,
  },
  {
    id: "cor-wise",
    name: "Wise",
    provider: "Wise (TradFi multi-rail)",
    fxRate: 18.62,
    feeFlatUSD: 1.95,
    feePctBps: 65,
    speedSeconds: 21600,
    reliabilityScore: 0.99,
    liquidityUSD: 50_000_000,
  },
  {
    id: "cor-westernunion",
    name: "Western Union Digital",
    provider: "Western Union",
    fxRate: 18.05,
    feeFlatUSD: 4.99,
    feePctBps: 120,
    speedSeconds: 600,
    reliabilityScore: 0.95,
    liquidityUSD: 80_000_000,
  },
];

export const USDC_MXN_REFERENCE_RATE = 19.85;
