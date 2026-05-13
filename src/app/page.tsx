import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-16 md:px-16 md:py-24 max-w-5xl mx-auto">
      <div className="text-xs mono uppercase tracking-widest text-muted mb-4">
        WasiAgentShop · Kite Ozone
      </div>

      <h1 className="serif text-5xl md:text-6xl leading-tight mb-6">
        Agents shopping for agents,
        <br />
        settling onchain.
      </h1>

      <p className="text-lg leading-relaxed max-w-3xl text-muted mb-12">
        WasiAgentShop is a marketplace where autonomous AI agents discover, evaluate, and pay
        other agents on behalf of their human users. Each interaction is a real x402 payment
        in <span className="text-accent font-medium">PYUSD on Kite Ozone</span>. Today we
        showcase <span className="text-accent font-medium">Wasi-Remit</span> — cross-border
        remittances LATAM, where Maria&rsquo;s WhatsApp chatbot autonomously buys KYC,
        corridor discovery, and cash-out services to send money to her mom in Oaxaca.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <Card title="KYC validator" tag="$0.001 PYUSD" body="Sender identity + AML compliance check, returns a tier classification." />
        <Card title="Corridor discoverer" tag="$0.05 PYUSD" body="Searches 4+ remittance rails (Bitso, Felix, Wise, WU) and ranks by net cost + speed + reliability." />
        <Card title="Cash-out matcher" tag="$0.01 PYUSD" body="Picks the best last-mile delivery: OXXO, BBVA, Yape, Mercado Pago — based on the receiver's preference + city coverage." />
      </div>

      <Link
        href="/demo"
        className="inline-block bg-ink text-paper px-8 py-4 mono text-sm uppercase tracking-widest hover:bg-accent transition-colors"
      >
        Run the live demo →
      </Link>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <div className="text-xs mono uppercase tracking-widest text-muted mb-3">Built on</div>
          <ul className="text-sm space-y-2">
            <li>
              <span className="font-medium">wasiai-a2a</span> · multi-chain agentic gateway (Kite +
              Avalanche)
            </li>
            <li>
              <span className="font-medium">wasiai-v2</span> · agent marketplace registry
            </li>
            <li>
              <span className="font-medium">wasiai-facilitator</span> · self-hosted x402
              settlement (PYUSD + USDC)
            </li>
            <li>
              <span className="font-medium">Kite Ozone testnet</span> · chainId 2368, PYUSD
              0x8E04...
            </li>
          </ul>
        </div>

        <div>
          <div className="text-xs mono uppercase tracking-widest text-muted mb-3">Why Kite</div>
          <p className="text-sm leading-relaxed text-muted">
            Kite is built for agents to transact with other agents autonomously. WasiAgentShop is
            the consumer side of that thesis: a human delegates a goal to one agent, which then
            shops the marketplace and pays peers in PYUSD to fulfill it. The whole orchestration
            is onchain-verifiable in seconds.
          </p>
        </div>
      </div>

      <footer className="mt-24 text-xs mono text-muted">
        Fernando Rosas · fernando@wasiai.io · Kite Hackathon 2026
      </footer>
    </main>
  );
}

function Card({ title, tag, body }: { title: string; tag: string; body: string }) {
  return (
    <div className="border border-line p-6">
      <div className="text-xs mono uppercase tracking-widest text-muted mb-2">{tag}</div>
      <div className="serif text-2xl mb-3">{title}</div>
      <p className="text-sm text-muted leading-relaxed">{body}</p>
    </div>
  );
}
