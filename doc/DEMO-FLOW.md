# WasiAgentShop · Demo flow paso a paso

Tiempo total objetivo: **90 segundos**.

---

## Setup pre-demo

- Browser en `https://wasiai-agentshop.vercel.app/demo` (o `localhost:3020/demo` local)
- Segunda tab en `https://testnet.kitescan.ai/`
- DevTools cerradas
- Verificar `NEXT_PUBLIC_DEMO_MODE=false` si querés path real Kite. `true` para path determinista (paracaídas).

---

## Guion narrado

### 0:00 — Apertura

> "Voy a tomar un pedido de remesa real. Maria, una trabajadora mexicana en Houston, le pide a su chatbot WhatsApp que mande $200 a su mamá en Oaxaca."

[Click en la primera tarjeta · Maria → Doña Carmen]

### 0:10 — Pipeline arranca

> "En cuanto Maria confirma, su chatbot llama autónomamente al marketplace WasiAgentShop. Tres agentes empiezan a trabajar en paralelo. Cada uno cobra en PYUSD sobre Kite Ozone."

[Los tres step cards se encienden uno por uno · ~3 segundos]

### 0:20 — KYC validator

> "Primer agente: kyc-validator. AML clean. Sender tier basic. Compliance check pasa en 1 segundo. Costo: 0.001 PYUSD."

[Punto verde · "DONE"]

### 0:30 — Corridor discoverer

> "Segundo agente: corridor-discoverer. Evalúa cuatro rieles competitivos en paralelo: Bitso, Felix Pay, Wise, Western Union. Pica el mejor — **Felix Pay sobre Stellar rails** — fx rate 19.05, llegada en 8 segundos, reliability 94%. Costo: 0.05 PYUSD."

[Mostrar la card del corridor · enfatizar el "Felix Pay" + rationale + shortlist]

### 0:45 — Cash-out matcher

> "Tercer agente: cashout-matcher. La preferencia de Maria es OXXO. El matcher confirma que OXXO tiene 28 mil locations + cobertura en Oaxaca de Juárez. Fee $0.45. Payout en 5 minutos. **3,775 pesos mexicanos** entregados. Costo: 0.01 PYUSD."

[Mostrar la card de match · enfatizar el "$ 3,775.40 MXN" net]

### 1:00 — Settle

> "Ahora el chatbot firma una autorización EIP-3009 gasless en nombre de Maria. Nuestro facilitator paga el gas y settle en PYUSD sobre Kite Ozone."

[Click en "Sign & settle"]

[Esperar 2-3s · aparece el panel verde de settled]

### 1:15 — Recibo onchain

> "Este es el tx hash. Kite Ozone testnet. Pueden verificar en KiteScan."

[Click en el tx hash · se abre KiteScan en la otra tab]

### 1:25 — Cierre

> "Mama recibió pesos en OXXO. La transacción quedó onchain, verificable. Total: menos de un minuto. Cero apps. Cero papeleo. Tres agentes y un facilitator."

---

## Variantes

### Variante 1 — modo seguro (paracaídas)

Si Kite RPC falla o Vercel está down:
- `NEXT_PUBLIC_DEMO_MODE=true` → todo corre con mocks deterministas
- Tx hash es random pero KiteScan link funciona (lleva a una página "tx not found")
- En la narración decir "este es el demo deterministic mode para asegurar reproducibilidad"

### Variante 2 — modo real Kite testnet

`NEXT_PUBLIC_DEMO_MODE=false` + A2A_KEY budget cargada + sender wallet con PYUSD:
- Tx hash real y verificable en KiteScan
- Tiempo extra ~3-5 segundos por confirmación de bloque

### Variante 3 — modo mainnet (post-hackathon)

`KITE_CHAIN_ID=2366` + PYUSD mainnet + sender wallet con USDC.e o PYUSD mainnet:
- Solo activar si hay tiempo y panel pide
- Demuestra que el código no cambia, solo el env

---

## Q&A típica

**¿Cuánto demoraron los 3 agentes?**
3-4 segundos en demo mode, ~8 segundos contra prod real (red Kite incluida).

**¿Los agentes son tuyos?**
Los tres son míos para el hackathon. La arquitectura permite que sean de terceros (Bitso podría ser el corridor-discoverer, OXXO el cashout-matcher).

**¿Y si el sender no tiene PYUSD?**
WasiAgentShop puede integrarse con on-ramp providers (Bitso, MoonPay) como pre-agent. Maria pone USD con su tarjeta, on-ramp convierte a PYUSD, los 3 agentes hacen su trabajo. Out of scope para el demo.

**¿Cuánto cuesta el flow completo?**
0.061 PYUSD de fees agénticos (~$0.06 USD) + spread del corridor elegido (Felix Pay ~4%). Comparado con Western Union 7-9% + $5 fee fijo.

---

## Checklist 60 segundos antes del demo

- [ ] https://wasiai-agentshop.vercel.app/demo abierto y respondiendo
- [ ] KiteScan tab abierta
- [ ] Notificaciones del sistema off
- [ ] Wifi check
- [ ] Reload del `/demo` para limpiar estado anterior
- [ ] Verificar tx settle funciona (probar 1 vez en pre-demo)
