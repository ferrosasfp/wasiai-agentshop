import { NextResponse } from "next/server";
import { A2A_URL } from "@/infra/env";

interface RawDiscoveredAgent {
  slug: string;
  name: string;
  priceUsdc: number;
  payment?: {
    chain?: string;
    asset?: string;
    method?: string;
    contract?: string;
  };
}

interface DiscoveredAgent {
  slug: string;
  name: string;
  priceUsdc: number;
  payment?: {
    chain?: string;
    asset?: string;
    method?: string;
    identityContract?: string;
  };
}

function renameContract(a: RawDiscoveredAgent): DiscoveredAgent {
  if (!a.payment) return a as DiscoveredAgent;
  const { contract, ...rest } = a.payment;
  return {
    ...a,
    payment: {
      ...rest,
      identityContract: contract,
    },
  };
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

const AGENTSHOP_SLUGS = [
  "agentshop-kyc-validator",
  "agentshop-corridor-discoverer",
  "agentshop-cashout-matcher",
] as const;

const STATIC_FALLBACK: DiscoveredAgent[] = [
  {
    slug: "agentshop-kyc-validator",
    name: "AgentShop KYC Validator",
    priceUsdc: 0.001,
    payment: {
      chain: "kite-ozone-testnet",
      asset: "PYUSD",
      method: "x402",
      identityContract: "0x9316E902760f2c37CDA57C8Be01358D890a26276",
    },
  },
  {
    slug: "agentshop-corridor-discoverer",
    name: "AgentShop Corridor Discoverer",
    priceUsdc: 0.05,
    payment: {
      chain: "kite-ozone-testnet",
      asset: "PYUSD",
      method: "x402",
      identityContract: "0x9316E902760f2c37CDA57C8Be01358D890a26276",
    },
  },
  {
    slug: "agentshop-cashout-matcher",
    name: "AgentShop Cash-Out Matcher",
    priceUsdc: 0.01,
    payment: {
      chain: "kite-ozone-testnet",
      asset: "PYUSD",
      method: "x402",
      identityContract: "0x9316E902760f2c37CDA57C8Be01358D890a26276",
    },
  },
];

export async function GET() {
  const started = Date.now();
  let agents: DiscoveredAgent[];
  let registry = "WasiAI · live";

  try {
    const res = await fetch(`${A2A_URL}/discover?capabilities=remittance&limit=10`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`a2a /discover HTTP ${res.status}`);
    const data = (await res.json()) as { agents: RawDiscoveredAgent[] };
    const live = (data.agents ?? [])
      .filter((a) =>
        AGENTSHOP_SLUGS.includes(a.slug as (typeof AGENTSHOP_SLUGS)[number]),
      )
      .map(renameContract);
    agents = live.length === 3 ? live : STATIC_FALLBACK;
    if (live.length !== 3) registry = "WasiAI · static fallback";
  } catch {
    agents = STATIC_FALLBACK;
    registry = "WasiAI · static fallback";
  }

  const ordered = AGENTSHOP_SLUGS.map(
    (slug) =>
      agents.find((a) => a.slug === slug) ??
      STATIC_FALLBACK.find((a) => a.slug === slug)!,
  );

  const latencyMs = Date.now() - started;
  const body: DiscoveryResponse = {
    agents: ordered,
    totalEstimatedFee: ordered.reduce((sum, a) => sum + (a.priceUsdc ?? 0), 0),
    discoveryEndpoint: `${A2A_URL}/discover`,
    composeEndpoint: `${A2A_URL}/compose`,
    facilitatorEndpoint: "https://wasiai-facilitator-production.up.railway.app",
    latencyMs,
    registry,
  };

  return NextResponse.json({
    ...body,
    trace: {
      step: "marketplace · discover agents",
      endpoint: `GET ${A2A_URL}/discover?capabilities=remittance&limit=10`,
      request: {
        method: "GET",
        url: `${A2A_URL}/discover?capabilities=remittance&limit=10`,
      },
      response: {
        status: 200,
        body: { agents: ordered.map((a) => ({ slug: a.slug, priceUsdc: a.priceUsdc, payment: a.payment })) },
        summary: `${ordered.length} agents · registry ${registry}`,
      },
      metadata: {
        source: "discovery",
        latencyMs,
        chain: "kite-ozone-testnet",
        asset: "PYUSD",
      },
      timestamp: new Date().toISOString(),
    },
  });
}
