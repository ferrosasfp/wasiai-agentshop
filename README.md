# WasiAgentShop

Agentic cross-border remittances for LATAM, built on the WasiAI neutral payments layer. Three autonomous agents discover the best corridor, run a compliance check, and reserve the last mile, then settle the transfer in PYUSD on Kite Ozone (testnet).

**Kite Hackathon 2026 submission**, built on the WasiAI stack
([wasiai-a2a](https://github.com/ferrosasfp/wasiai-a2a-gateway) + [wasiai-facilitator](https://github.com/ferrosasfp/wasiai-facilitator)).

| | |
|---|---|
| **Live demo** | [`wasiai-agentshop.vercel.app`](https://wasiai-agentshop.vercel.app/) |
| **Interactive walkthrough** | [`wasiai-agentshop.vercel.app/demo`](https://wasiai-agentshop.vercel.app/demo) |
| **Demo video (3 min)** | [`youtu.be/Ydh_sEJXgt4`](https://www.youtube.com/watch?v=Ydh_sEJXgt4) |
| **For judges** | see [SUBMISSION.md](./SUBMISSION.md) |
| **Sample on-chain tx** | [`0xf3eaa00a…0f1d674`](https://testnet.kitescan.ai/tx/0xf3eaa00a7e83c41b2b9d8247e39d32f564b36cd8745f91e3c080ff23f0f1d674) on KiteScan |

---

## What it is

Cross-border remittances are one of LATAM's largest financial flows, and they are still
dominated by intermediaries that typically charge 5 to 7 percent and take hours or days to
settle. The sender has little visibility into the best corridor (rate, speed, cash-out
partner) and no guarantee until the money "appears" on the other side.

WasiAgentShop is a demo app that puts an agentic layer on top of that flow. When a user wants
to send money home, their assistant runs the whole operation autonomously:

1. Pays the **kyc-validator** agent to confirm the operation is AML-compliant.
2. Pays the **corridor-discoverer** agent to evaluate several rails with live FX and pick the best one.
3. Pays the **cashout-matcher** agent to reserve the last mile (local wallet or bank).
4. Signs a gasless EIP-3009 authorization, and `wasiai-facilitator` settles PYUSD on Kite Ozone.

The whole sequence runs in seconds, well under a minute in the demo. Agents transact with
agents autonomously, on-chain, on verifiable infrastructure. That is the Kite thesis made real.

Per-call agent fees in the demo are fractions of a cent in PYUSD (0.001 + 0.05 + 0.01),
charged step by step, so the economics stay legible.

## Where WasiAI fits

WasiAI is a neutral, open, multi-chain payments layer for the agent economy, LATAM-first.
The agent economy is fragmenting into walled gardens, where each exchange or marketplace
becomes a closed economy locked to its own chain and token. WasiAI is the neutral ground:
open standards (A2A, x402, ERC-8004) with settlement on each agent's native chain and no
lock-in. The neutral layer itself is the **WasiAI A2A gateway**
([wasiai-a2a](https://github.com/ferrosasfp/wasiai-a2a-gateway)), which routes agent-to-agent
payments and can settle on Kite or Avalanche depending on the agent.

**This repo is one app on that layer, not the layer itself.** WasiAgentShop is the
remittances vertical. The same gateway can power other verticals on other chains without
changing the commerce plumbing.

## Why Kite for this vertical

- **PYUSD native**: a USD-pegged stablecoin is a natural fit for remittances. The sender thinks in USD, the receiver converts locally.
- **Fast finality**: enables a "click, then confirm" UX.
- **Agent-native chain**: agent-to-agent transactions are first-class.
- **x402 protocol**: a machine-readable paywall lets agents pay agents without a human in the loop.

## Architecture

```
   ┌──────────────────────────────┐
   │ User chat / WasiAgentShop UI │
   └───────────────┬──────────────┘
                   │
                   ▼
   ┌──────────────────────────────────────┐
   │ wasiai-a2a · /compose                │  ← agent gateway + payment routing
   │ x-payment-chain: kite-ozone-testnet  │
   └──┬─────────────┬─────────────┬───────┘
      │             │             │
      ▼             ▼             ▼
   ┌──────┐     ┌──────────┐  ┌────────────┐
   │ kyc- │     │ corridor-│  │ cashout-   │  ← 3 autonomous agents
   │valid.│     │ discov.  │  │ matcher    │     paid in PYUSD per call
   └──────┘     └──────────┘  └────────────┘
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

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 App Router, TypeScript strict, Tailwind |
| Architecture | hexagonal-light: `core/` (domain), `infra/` (adapters), `application/` (use cases), `app/` (routes) |
| Onchain | viem, EIP-3009 (transferWithAuthorization), Kite Ozone testnet (chainId 2368), PYUSD |
| Agent payments | wasiai-a2a `/compose` with `x-payment-chain: kite-ozone-testnet`, debited from the A2A budget per call |
| Settlement | wasiai-facilitator (self-hosted, multi-chain) |
| FX | live USD to MXN/COP/PEN/ARS from `open.er-api.com`, 5-minute cache, mid-market plus corridor spread |
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
agent responses, useful for grokking the flow without a funded A2A key. Flip it to `false`
and supply a real `A2A_KEY` plus `SENDER_PRIVATE_KEY` (testnet) to hit live wasiai-a2a and
Kite Ozone. See `.env.example` for the full contract.

## Configuration

All configuration lives in `.env.example`. Key variables:

- `WASIAI_A2A_URL`, `WASIAI_FACILITATOR_URL`: gateway and facilitator endpoints.
- `KITE_CHAIN_ID=2368`, `KITE_RPC_URL`, `PYUSD_ADDRESS`: Kite Ozone testnet target.
- `A2A_KEY`: scoped to the WasiAgentShop owner, debited per `/compose`.
- `SENDER_PRIVATE_KEY`: operator wallet that signs EIP-3009 (testnet only).
- `ONCHAIN_AMOUNT_CAP_PYUSD`: safety cap on the settled amount.
- `SETTLE_API_SECRET`: bearer secret required by `POST /api/settle`, which signs real EIP-3009 authorizations. It fails closed, so if unset every call returns 401.

Never commit real keys or secrets. `.env.local` is gitignored.

## Repo map

```
src/
├── app/
│   ├── page.tsx               # Landing (dark theme, animated story stage)
│   ├── demo/page.tsx          # Interactive 4-phase walkthrough
│   └── api/
│       ├── kyc/route.ts             # Calls wasiai-a2a /compose for kyc-validator
│       ├── discover/route.ts        # Calls /compose for corridor-discoverer
│       ├── match/route.ts           # Calls /compose for cashout-matcher
│       ├── settle/route.ts          # EIP-3009 sign + facilitator settle
│       ├── marketplace/route.ts     # /discover the WasiAI marketplace
│       └── agents/*/invoke/         # Agent endpoints registered in wasiai-v2
├── core/                      # Domain (Corridor, Remittance, FX math, compliance)
├── infra/                     # Adapters (fx-rates, a2a-client, facilitator-client, eip3009-signer)
├── application/               # Use cases (settle-remittance, run-kyc, discover-corridor)
└── components/                # UI (RemittancePicker, PipelineProgress, TraceConsole, Settlement)
```

## Related repos

- [`wasiai-a2a`](https://github.com/ferrosasfp/wasiai-a2a-gateway): the neutral, multi-chain A2A gateway (Kite + Avalanche).
- [`wasiai-facilitator`](https://github.com/ferrosasfp/wasiai-facilitator): self-hosted x402 relayer.
- [`wasiai-v2`](https://github.com/ferrosasfp/wasiai-v2): agent marketplace UI.

---

**Fernando Rosas** · <fernando@wasiai.io> · [wasiai.io](https://wasiai.io)
</content>
</invoke>
