# WasiAgentShop — Agentic remittances on Kite Ozone

> A marketplace where AI agents shop services on behalf of users.
> Cross-border LATAM remittances settled in PYUSD on Kite Ozone, in under 30 seconds.

**Kite Hackathon 2026 submission** · Built on the WasiAI stack
([wasiai-a2a](https://github.com/ferrosasfp/wasiai-a2a) + [wasiai-facilitator](https://github.com/ferrosasfp/wasiai-facilitator))

| | |
|---|---|
| **Live demo** | [`wasiai-agentshop.vercel.app`](https://wasiai-agentshop.vercel.app/) |
| **Interactive walkthrough** | [`wasiai-agentshop.vercel.app/demo`](https://wasiai-agentshop.vercel.app/demo) |
| **For judges** | see [SUBMISSION.md](./SUBMISSION.md) |
| **Sample on-chain tx** | [`0xf3eaa00a…0f1d674`](https://testnet.kitescan.ai/tx/0xf3eaa00a7e83c41b2b9d8247e39d32f564b36cd8745f91e3c080ff23f0f1d674) on KiteScan |

---

## What it is

LATAM remittances are a ~$63B/year market dominated by intermediaries that charge 5–7%
and take hours-to-days to settle. The sender has no visibility into the best corridor
(rate, speed, cash-out partner) and no guarantee until the money "appears" on the other side.

WasiAgentShop is an agentic layer on top of Kite Ozone. When Maria wants to send
$400 to her mom in Oaxaca, her chatbot **autonomously**:

1. Pays **agent kyc-validator** ($0.001 PYUSD) to confirm the operation is AML-compliant
2. Pays **agent corridor-discoverer** ($0.05 PYUSD) to evaluate 4+ rails with live FX and pick the best
3. Pays **agent cashout-matcher** ($0.01 PYUSD) to reserve the last mile (OXXO / bank / wallet)
4. Signs an EIP-3009 gasless authorization — `wasiai-facilitator` settles PYUSD on Kite Ozone

End-to-end: under 30 seconds. Total agent fees: $0.061. **The Kite thesis made real** — agents
transacting with agents autonomously, on-chain, on verifiable infrastructure.

## Why Kite

- **PYUSD native** · USD-pegged stablecoin = natural fit for remittances (sender thinks in USD, receiver converts locally)
- **Sub-second finality** · enables a "click → confirm" UX
- **Agent-native chain** · agent-to-agent transactions are first-class
- **x402 protocol** · machine-readable paywall = agents pay agents without humans in the loop

## Architecture

```
   ┌─────────────────────────┐
   │ User chat / WasiAgentShop UI │
   └────────────┬────────────┘
                │
                ▼
   ┌──────────────────────────────────────┐
   │ wasiai-a2a · /compose                │  ← agent marketplace + payment routing
   │ x-payment-chain: kite-ozone-testnet │
   └──┬────────────┬────────────┬────────┘
      │            │            │
      ▼            ▼            ▼
   ┌──────┐    ┌──────────┐  ┌────────────┐
   │ kyc- │    │ corridor-│  │ cashout-   │  ← 3 autonomous agents
   │valid.│    │ discov.  │  │ matcher    │     paid in PYUSD per call
   └──────┘    └──────────┘  └────────────┘
                                  │
                                  ▼
                       sender signs EIP-3009
                                  │
                                  ▼
                  ┌─────────────────────────┐
                  │ wasiai-facilitator      │  ← self-hosted x402 relayer
                  │ (pays gas in KITE)      │     gasless for the sender
                  └────────────┬────────────┘
                               ▼
                  ┌─────────────────────────┐
                  │ Kite Ozone · PYUSD      │  ← real, verifiable tx on
                  │ transferWithAuthoriz()  │     testnet.kitescan.ai
                  └─────────────────────────┘
```

The same WasiAI stack (chain-agnostic from day one) runs another vertical in production —
**Lendable** (LATAM SMB invoice factoring on Avalanche Fuji) — proving the architecture is
not a one-off demo but a reusable agent-payments rail.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 App Router · TypeScript strict · Tailwind |
| Architecture | hexagonal-light: `core/` (domain), `infra/` (adapters), `application/` (use cases), `app/` (routes) |
| Onchain | viem · EIP-3009 (transferWithAuthorization) · Kite Ozone testnet (chainId 2368) · PYUSD `0x8E04D099…42ec9` |
| Agent payments | wasiai-a2a `/compose` with `x-payment-chain: kite-ozone-testnet` (debited from the A2A budget per call) |
| Settlement | wasiai-facilitator (self-hosted; multi-chain since 2026-05-13) |
| FX | live USD→MXN/COP/PEN/ARS from `open.er-api.com`, 5-min cache, mid-market + corridor spread |
| Hosting | Vercel |

## Run locally

```bash
git clone https://github.com/ferrosasfp/wasiai-agentshop
cd wasiai-agentshop
npm install
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3020/demo>.

By default `NEXT_PUBLIC_DEMO_MODE=true` runs a deterministic local pipeline with mocked
agent responses — useful for grokking the flow without needing a funded A2A key. Flip it
to `false` and supply real `A2A_KEY` + `SENDER_PRIVATE_KEY` to hit live wasiai-a2a + Kite
Ozone (see `.env.example` for the full contract).

## Env vars

See `.env.example`. Highlights:

- `WASIAI_A2A_URL` · live at `wasiai-a2a-production.up.railway.app`
- `WASIAI_FACILITATOR_URL` · self-hosted x402 facilitator on Railway
- `KITE_CHAIN_ID=2368` · Kite Ozone testnet
- `PYUSD_ADDRESS=0x8E04D099b1a8Dd20E6caD4b2Ab2B405B98242ec9`
- `A2A_KEY` · scoped to the WasiAgentShop owner_ref; debited per /compose
- `SENDER_PRIVATE_KEY` · OPERATOR wallet that signs EIP-3009 (testnet only)
- `ONCHAIN_AMOUNT_CAP_PYUSD=0.05` · safety cap on settled amount

## Repo map

```
src/
├── app/
│   ├── page.tsx               # Landing (Claude Design handoff: dark theme, story stage)
│   ├── demo/page.tsx          # Interactive 4-phase walkthrough
│   └── api/
│       ├── kyc/route.ts             # Calls wasiai-a2a /compose for kyc-validator
│       ├── discover/route.ts        # Calls /compose for corridor-discoverer
│       ├── match/route.ts           # Calls /compose for cashout-matcher
│       ├── settle/route.ts          # EIP-3009 sign + facilitator settle
│       ├── marketplace/route.ts     # /discover the WasiAI marketplace
│       └── agents/*/invoke/         # Agent endpoints registered in wasiai-v2
├── core/                      # Domain (Corridor, Remittance, FX math)
├── infra/                     # Adapters (fx-rates, a2a-client, facilitator-client)
├── application/               # Use cases (settle-remittance)
└── components/                # UI (RemittancePicker, PipelineProgress, TraceConsole, Settlement)
```

## Related repos

- [`wasiai-a2a`](https://github.com/ferrosasfp/wasiai-a2a) — multi-chain A2A gateway (Kite + Avalanche)
- [`wasiai-facilitator`](https://github.com/ferrosasfp/wasiai-facilitator) — self-hosted x402 relayer
- [`wasiai-v2`](https://github.com/ferrosasfp/wasiai-v2) — agent marketplace UI

---

**Fernando Rosas** · <fernando@wasiai.io> · [wasiai.io](https://wasiai.io)
