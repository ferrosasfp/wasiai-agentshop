# WasiAgentShop — Agentic remittances on Kite Ozone

> Marketplace agent-native donde agentes IA autónomos descubren, evalúan y pagan otros agentes en nombre de sus usuarios humanos. Showcase: remesas cross-border LATAM (Wasi-Remit) settled en PYUSD sobre Kite Ozone.

**Kite Hackathon 2026** · Solo · ~$63B/año LATAM remittance market

---

## El problema

Las remesas LATAM son un mercado de $63B/año dominado por intermediarios que cobran 5-7% de comisión y demoran horas o días. La persona que manda dinero a su familia no tiene visibilidad sobre el mejor corridor (rate, velocidad, partner de cash-out), no puede negociar, y no recibe garantía hasta que el dinero "aparece" del otro lado.

## La solución

WasiAgentShop es una capa agéntica encima de la infraestructura Kite Ozone. Cuando Maria
quiere mandar $200 a su mamá en Oaxaca, **su WhatsApp chatbot autónomamente**:

1. Llama al **agent KYC validator** para confirmar la operación es compliant (0.001 PYUSD)
2. Llama al **agent corridor discoverer** para evaluar 4+ rieles competitivos y picar el mejor (0.05 PYUSD)
3. Llama al **agent cash-out matcher** para reservar la última milla (OXXO/banco/wallet, 0.01 PYUSD)
4. Firma EIP-3009 gasless — el facilitator settle en PYUSD Kite Ozone

Total time: <30 segundos. Total fee al agente: $0.061 PYUSD. **Tesis Kite hecha realidad** —
agents transacting with agents autonomously, onchain, en infrastructure verificable.

## Por qué Kite

- **PYUSD nativo** · USD-pegged stablecoin = remittance natural fit (sender piensa en USD, receiver convierte en local)
- **Sub-segundo finality** · UX "click → confirm"
- **Agent-native chain** · transacciones agent-to-agent son first-class
- **x402 protocol** · paywall machine-readable = agents pueden pagar agents sin humano

## Arquitectura

```
[ Chatbot WhatsApp ] ─→ [ WasiAgentShop UI ]
                          │
                          ▼
                  [ WasiAI A2A: /compose × kite-ozone-testnet ]
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
       [kyc-validator] [corridor-disc] [cashout-matcher]
              │           │           │
              └───────────┼───────────┘
                          ▼
                 [ matched route + partner ]
                          │
            sender firma EIP-3009 ───┐
                                     ▼
                       [ wasiai-facilitator ]
                                     │
                                     ▼
                       [ Kite Ozone · PYUSD settle ]
                                     │
                                     ▼
                       [ Receiver wallet · cash-out partner ]
```

## Stack

- **Frontend**: Next.js 14 App Router · TypeScript strict · Tailwind
- **Architecture**: hexagonal-light (core/infra/application/app/components/types)
- **Agents**: 3 endpoints REST registrados en WasiAI marketplace, descubiertos vía A2A `/discover`, orquestados vía `/compose` con header `x-payment-chain: kite-ozone-testnet`
- **Onchain**: viem + EIP-3009 (transferWithAuthorization) en Kite Ozone testnet (chainId 2368) sobre PYUSD
- **Settlement**: wasiai-facilitator (self-hosted, en prod desde 2026-05, soporta Kite + Avalanche nativos)
- **Hosting**: Vercel (UI + API routes)

## Run local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abrí `http://localhost:3020/demo`.

## Demo flow

3 remesas pre-cargadas con perfiles distintos (USA→MX OXXO, USA→CO bank, ES→PE wallet). Pickeás
una, ves 3 agentes correr en paralelo en menos de 5 segundos, firmás el settlement, y obtenés
el tx hash real en KiteScan.

## Built on WasiAI

WasiAgentShop corre sobre infraestructura WasiAI que **ya está en producción**:

- **wasiai-a2a** · multi-chain gateway (Kite + Avalanche desde WKH-MULTICHAIN 2026-05-13)
- **wasiai-v2** · marketplace de agentes (los 3 agentes WasiRemit se listan aquí)
- **wasiai-facilitator** · self-hosted x402 (soporta Kite Ozone testnet/mainnet + Avalanche Fuji/mainnet)

Esta es la **segunda HU productiva** sobre el stack WasiAI — la primera fue Lendable (factoraje
PyMEs LATAM en Avalanche Fuji). El mismo stack agnóstico de chain corre 2 verticales en 2
chains distintas.

---

**Fernando Rosas** · fernando@wasiai.io · [wasiai.io](https://wasiai.io)
