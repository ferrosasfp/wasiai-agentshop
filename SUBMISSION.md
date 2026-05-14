# WasiAgentShop — Kite Hackathon 2026 Submission

A 5-minute pass for judges. For the full README, see [README.md](./README.md).

---

## TL;DR

**WasiAgentShop demonstrates the Kite thesis end-to-end**: AI agents discover, evaluate,
and pay each other in PYUSD on Kite Ozone to deliver a real cross-border remittance —
no human in the middle of the agent loop, no gas in the user's pocket, every step
verifiable on KiteScan.

The use case is the largest one in LATAM that nobody has agentified: $63B/year in
remittances dominated by 5–7% fee intermediaries. The agents shop the marketplace,
pick the best rail in <30 seconds, and the user signs once.

## What to click

1. Open **<https://wasiai-agentshop.vercel.app/>** — landing with the story
2. Click **"Open demo"** → land on `/demo`
3. Click **▶ Start the demo**
   - Section 00 fires: `/discover` lists the 3 WasiAgentShop agents from the wasiai-a2a marketplace (real network call, response visible in the right-hand trace column)
4. Pick any of the 3 pre-loaded remittances (USA→MX, USA→CO, ES→PE)
   - Section 02 fires 3 real `/compose` calls in sequence — `kyc-validator`, `corridor-discoverer`, `cashout-matcher`. Each debits the A2A_KEY budget on chain 2368.
5. Click **Sign & settle**
   - Section 03: server-side EIP-3009 `TransferWithAuthorization` is built and signed with `SENDER_PRIVATE_KEY` (no network).
   - Section 04: signed authorization is POSTed to `wasiai-facilitator`. The facilitator pays gas in KITE and submits `transferWithAuthorization` to the PYUSD token contract.
6. The receipt panel shows the real **tx hash + block + KiteScan link**. Click it.

Sample real tx (already settled): [`0xf3eaa00a…0f1d674`](https://testnet.kitescan.ai/tx/0xf3eaa00a7e83c41b2b9d8247e39d32f564b36cd8745f91e3c080ff23f0f1d674)

## What is real vs. demo-coded

| Concern | Status |
|---|---|
| The 3 agents | **Real** — registered in `wasiai-v2` marketplace, discovered via wasiai-a2a `/discover`, invoked via `/compose` with `x-payment-chain: kite-ozone-testnet`. Each call debits PYUSD from the A2A_KEY budget. |
| Agent pricing ($0.001 / $0.05 / $0.01) | **Real** — set on the agent rows in Supabase, enforced by the wasiai-a2a middleware. |
| FX rates (USD→MXN/COP/PEN/ARS) | **Real** — live from `open.er-api.com`, 5-min cache, mid-market rate + corridor-specific spread (Bitso -150 bps, Felix -100, Wise -50, WU -700). |
| EIP-3009 signing | **Real** — `viem.signTypedData()` with the SENDER private key. The signature you see in the trace is what gets sent to the facilitator. |
| Settlement on Kite | **Real** — `wasiai-facilitator` submits `transferWithAuthorization` to PYUSD `0x8E04D099…42ec9`. Every demo creates a verifiable on-chain tx. |
| `ONCHAIN_AMOUNT_CAP_PYUSD=0.05` | **Demo-only safety cap** — testnet PYUSD is finite (we mint via the contract's public `claim()` faucet, 10 PYUSD per call). The UI shows "testnet cap — mainnet would settle full $X" so the judge sees the intended UX. |
| Remittance partners (OXXO, BBVA, Yape…) | **Mock** — last-mile partner integration is out of hackathon scope. The corridor + partner shortlist is from `src/lib/mock-data.ts`. The cashout-matcher agent still really runs and picks one. |
| KYC decision | **Mock** — the kyc-validator agent really runs and gets paid, but the decision logic is a stub (`isCompliant: true` for the pre-loaded remittances). |

## Why the use case + chain pairing wins

| | |
|---|---|
| **Why remittances?** | Largest LATAM fintech market that has zero agent layer. Sender doesn't shop corridors today — there's no API to do so. Agent-paid discovery is the unlock. |
| **Why PYUSD?** | USD-pegged. Sender thinks in USD ("I want to send $400"). Receiver converts locally. No double-FX. |
| **Why Kite Ozone?** | Sub-second finality = "click → confirm" UX matters for retail remittances. Agent-native transaction model + machine-readable x402 paywalls = agents pay agents without humans. |
| **Why three agents (not one)?** | Each does a narrow job that justifies its own price. The chatbot doesn't *need* to call all three — if the sender doesn't care about compliance (peer-to-peer to family), the kyc agent is skipped. Agentic marketplace > monolithic backend. |

## Architecture at a glance

```
User ──▶ WasiAgentShop UI
            │
            ▼
       wasiai-a2a /compose × N agents      ← agent discovery + payment routing
            │                                  (multi-chain since 2026-05-13)
   ┌────────┼─────────┐
   ▼        ▼         ▼
[kyc] [corridor] [cashout]                  ← each = real endpoint + Supabase row
            │
   sender signs EIP-3009 (server-side viem)
            │
            ▼
       wasiai-facilitator                    ← self-hosted x402 relayer
            │                                  (pays gas in KITE)
            ▼
       PYUSD on Kite Ozone                   ← real settle, verifiable on KiteScan
```

## Code map (where to look)

| Path | What's there |
|---|---|
| [`src/app/page.tsx`](src/app/page.tsx) | Landing (Claude Design dark theme, animated story stage) |
| [`src/app/demo/page.tsx`](src/app/demo/page.tsx) | 4-phase demo with progressive trace reveal |
| [`src/app/api/marketplace/route.ts`](src/app/api/marketplace/route.ts) | `GET /discover` — section 00 |
| [`src/app/api/kyc/route.ts`](src/app/api/kyc/route.ts) | Real `/compose` call — section 02 step 1 |
| [`src/app/api/discover/route.ts`](src/app/api/discover/route.ts) | `/compose` — section 02 step 2 |
| [`src/app/api/match/route.ts`](src/app/api/match/route.ts) | `/compose` — section 02 step 3 |
| [`src/app/api/settle/route.ts`](src/app/api/settle/route.ts) | EIP-3009 sign + facilitator settle (sections 03 + 04) |
| [`src/infra/fx-rates.ts`](src/infra/fx-rates.ts) | Live USD→LOCAL FX with 5-min cache |
| [`src/core/corridor.ts`](src/core/corridor.ts) | `applyMidMarketRate(corridor, midRate)` — corridor scoring |
| [`src/components/TraceConsole.tsx`](src/components/TraceConsole.tsx) | Live trace panel (the right column in the demo) |

## What I'd build next (post-hackathon)

- **Real last-mile partner APIs** (Bitso, Felix, Wise — they all have B2B APIs)
- **Agent reputation on-chain** via ERC-8004 (already wired in wasiai-a2a, opt-in per agent)
- **Sender-side wallet** via Kite Passport (today the demo uses a single OPERATOR wallet for both sender and receiver flow)
- **Mainnet PYUSD** — the multi-chain a2a layer already supports it; only env-var change

## Repos

- **This repo** — [`wasiai-agentshop`](https://github.com/ferrosasfp/wasiai-agentshop) (Next.js + onchain glue)
- **A2A gateway** — [`wasiai-a2a`](https://github.com/ferrosasfp/wasiai-a2a) (multi-chain agent marketplace + payment routing)
- **Facilitator** — [`wasiai-facilitator`](https://github.com/ferrosasfp/wasiai-facilitator) (self-hosted x402 relayer)
- **Marketplace UI** — [`wasiai-v2`](https://github.com/ferrosasfp/wasiai-v2) (the registry where the 3 WasiAgentShop agents live)

## Contact

Fernando Rosas · <fernando@wasiai.io> · [wasiai.io](https://wasiai.io) · [@ferrosasfp on GitHub](https://github.com/ferrosasfp)
