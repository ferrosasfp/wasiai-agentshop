# WasiAgentShop · Pitch (español · 5 min)

---

## Apertura (30s)

Buenos días. Soy Fernando Rosas, fundador de WasiAI. En los próximos cinco minutos les voy a mostrar **WasiAgentShop**, un marketplace donde agentes IA autónomos compran servicios a otros agentes en nombre de sus usuarios humanos. El showcase de hoy: **Wasi-Remit**, remesas cross-border LATAM settled en PYUSD sobre Kite Ozone.

Lo construí en este hackathon, pero corre sobre rails productivos que llevan meses en mainnet. Tres servicios WasiAI vivos en producción + un consumer fintech encima.

---

## El problema (45s)

Las remesas LATAM mueven **$63 mil millones de dólares al año**. La mayor parte la mandan trabajadores migrantes a sus familias. Y la mayor parte del spread se queda con intermediarios — Western Union, MoneyGram — que cobran entre 5 y 7% por transacción, demoran horas o días, y dejan al remitente sin visibilidad sobre qué corridor es el mejor.

El usuario remitente vive en su celular: WhatsApp. No usa banca tradicional. No quiere abrir 6 apps para comparar tasas. **Quiere mandar a su mamá y que llegue rápido y barato.**

¿Cómo sería si su chatbot pudiera negociar las mejores condiciones por él, sin que él tenga que pensarlo?

---

## La solución (45s)

WasiAgentShop hace exactamente eso. Maria, una trabajadora en Houston, le dice a su chatbot "mandale $200 a mi mamá en Oaxaca". El chatbot **autónomamente**:

1. Llama al agente **kyc-validator** para confirmar compliance — 0.001 PYUSD
2. Llama al agente **corridor-discoverer** que evalúa cuatro rieles (Bitso, Felix, Wise, Western Union) y pica el mejor por costo + velocidad + reliability — 0.05 PYUSD
3. Llama al agente **cashout-matcher** que reserva la última milla — para Oaxaca, OXXO con 28 mil tiendas, fee $0.45 — 0.01 PYUSD

Total: 0.061 PYUSD de fees agénticos. Tiempo: menos de 30 segundos. La mamá recibe **pesos mexicanos en una tienda OXXO** que pase camino al mercado.

---

## Demo (90s)

[Compartir pantalla en `/demo`]

Tomo este pedido de Maria, $200 USD desde Houston a su mamá en Oaxaca de Juárez, cash-out preferencia OXXO.

[Click en la primera tarjeta]

Ven los tres agentes corriendo en secuencia. Cada uno paga al anterior en PYUSD. En menos de 5 segundos:

- KYC validator: aml clean, sender tier basic, policy id firmado
- Corridor discoverer: **Felix Pay vía Stellar rails** gana — fx rate 19.05, fee 45bps, llegada en 8 segundos, reliability 94%. Rationale incluye shortlist
- Cash-out matcher: **OXXO 28k tiendas** — fee $0.45, payout en 5 minutos, **3,775.40 MXN** entregados

[Click "Sign & settle"]

Y este es el tx hash. Real. Kite Ozone testnet. Pueden verificar en KiteScan ahora mismo.

[Mostrar KiteScan]

Mama recibió pesos en OXXO. Total time: menos de un minuto. Cero apps. Cero papeleo. **Tres agentes** y un facilitator.

---

## Por qué Kite (45s)

Kite no es solo otra L2. Es la chain pensada para que **agentes transaccionen con agentes**. x402 nativo, PYUSD como stablecoin canonical, sub-segundo finality, infra de marketplace agentic.

WasiAgentShop demuestra exactamente eso: un usuario humano delega un goal a un agente, que **autónomamente** descubre y paga otros agentes para cumplirlo. Cada transacción es onchain-verificable en KiteScan. La tesis de Kite **funciona en producción real**.

---

## Por qué los sponsors caen aquí (30s)

**Kite Foundation**. Esto es agentic commerce 1:1: agents shopping agents. La tesis al 100% sin asteriscos.

**Pieverse (facilitator partner)**. Cada settlement pasa por x402 v2 canonical → Pieverse-compatible.

**LATAM remittance rails (Bitso, Felix, Yape, Mercado Pago)**. La demo los integra como corridors de primera clase. WasiAgentShop es la capa de orquestación neutral que ellos siempre necesitaron — un agent-marketplace donde compiten por rates, no por brand awareness.

---

## Lo que ya está construido (30s)

WasiAgentShop corre sobre **wasiai-a2a** (gateway multi-chain en prod desde mayo 2026), **wasiai-v2** (marketplace registry), y **wasiai-facilitator** (self-hosted x402 con soporte Kite + Avalanche). Tres servicios vivos. Más de 900 tests pasando. Transacciones onchain reales verificables.

Esta no es una idea — es una capa fintech sobre rails que ya funcionan.

---

## Cierre (15s)

WasiAgentShop es la capa agéntica para remesas LATAM, settled en PYUSD sobre Kite Ozone. **Tres agentes que trabajan juntos para que tu mamá reciba el dinero en 30 segundos.**

Gracias. ¿Preguntas?

---

## Q&A — respuestas preparadas

**¿Los agentes son tuyos o de terceros?**
Los tres son míos para el hackathon. La arquitectura permite que sean de terceros — Bitso podría ser el corridor-discoverer, BBVA el cashout-matcher. La integración es: registrar el agente en el marketplace WasiAI y publicar el invoke_url. WasiAgentShop no diferencia entre agentes propios y third-party.

**¿Por qué Kite y no Stellar (que también hace remesas)?**
Stellar es payment rail tradicional — moverte dinero. Kite es **agent rail** — agents transactando con agents. La diferencia es que en Kite la negociación entre corridor providers es onchain-verificable y agéntica. En Stellar, la rate es la que el provider te da.

**¿Cuánto cuesta una remesa en este modelo?**
Para Maria $200 USD: 0.061 PYUSD de fees agénticos + el spread del corridor (Felix Pay fx 19.05 vs spot ~19.85 = ~4% efectivo). Total mucho mejor que Western Union (7%+). Y la diferencia clave: 30 segundos vs 1-3 días.

**¿Cómo cumple con regulación?**
KYC agent es el primer paso. Cualquier remesa >$3,000 USD es flaggeada para revisión manual. Cualquier corridor a chain prohibida (OFAC list) es bloqueada. La arquitectura permite registrar compliance providers de terceros (RegTech LATAM).

**¿Qué pasa si el receiver no tiene wallet?**
Por eso el cashout-matcher es crítico. OXXO, BBVA, Yape, Mercado Pago — todos son partners last-mile sin requerir wallet del receiver. Maria manda PYUSD onchain, el partner entrega cash o crédito local. Es el bridge crypto→fiat sin que la mamá tenga que aprender crypto.

**¿Qué chunk del round necesitan?**
Para ir live con un corridor real (Bitso o Felix) en Q3, necesito $50K para legal + cuenta operativa + AML registration en MX. El premio del Kite hackathon es el catalyst para esa primera ronda.
