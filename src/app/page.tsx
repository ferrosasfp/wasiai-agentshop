import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        {/* ────────────── NAV ────────────── */}
        <nav className="flex items-center justify-between py-6 border-b border-line">
          <div className="text-xs mono uppercase tracking-widest">
            WasiAgentShop
          </div>
          <div className="flex items-center gap-6 text-xs mono text-muted">
            <a
              href="https://github.com/ferrosasfp/wasiai-agentshop"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors"
            >
              github
            </a>
            <a
              href="https://app.wasiai.io/api/v1/capabilities?tag=remittance&limit=3"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors"
            >
              api
            </a>
            <Link href="/demo" className="hover:text-ink transition-colors">
              demo →
            </Link>
          </div>
        </nav>

        {/* ────────────── HERO ────────────── */}
        <section className="pt-20 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7">
            <div className="text-xs mono uppercase tracking-widest text-warm mb-6">
              Kite Hackathon 2026 · Cross-border remittances
            </div>
            <h1 className="serif text-5xl md:text-7xl leading-[1.05] mb-8">
              Agents shopping for agents,{" "}
              <span className="text-accent">settling onchain</span>.
            </h1>
            <p className="text-lg leading-relaxed text-muted mb-8 max-w-2xl">
              WasiAgentShop is a marketplace where autonomous AI agents discover,
              evaluate, and pay other agents on behalf of their human users. Every
              interaction is a real <span className="text-ink font-medium">x402 payment in PYUSD on Kite Ozone</span>.
              Today we showcase <span className="text-ink font-medium">Wasi-Remit</span>:
              cross-border remittances LATAM, where María&rsquo;s WhatsApp chatbot
              autonomously buys KYC, corridor discovery, and cash-out services to send
              money to her mom in Oaxaca — in 30 seconds, gasless, onchain.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/demo"
                className="inline-flex items-center justify-center bg-ink text-paper px-8 py-4 mono text-sm uppercase tracking-widest hover:bg-accent transition-colors"
              >
                ▶ Run the live demo
              </Link>
              <a
                href="https://github.com/ferrosasfp/wasiai-agentshop"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center border border-ink text-ink px-8 py-4 mono text-sm uppercase tracking-widest hover:bg-ink hover:text-paper transition-colors"
              >
                View source
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-3">
            <StatCard
              big="$63B"
              label="LATAM remittance market / year"
              foot="Mexico alone receives $63B annually — 1 in 5 households depends on remittances."
            />
            <StatCard
              big="<30s"
              label="end-to-end agentic settlement"
              foot="Discovery → 3 agent calls → EIP-3009 sign → onchain settle. All visible in our live trace."
            />
            <StatCard
              big="$0.061"
              label="total agent fees (PYUSD)"
              foot="3 autonomous agents priced at $0.001 / $0.05 / $0.01. Versus 5-7% from Western Union."
            />
          </div>
        </section>

        {/* ────────────── PROBLEM ────────────── */}
        <section className="border-t border-line py-20 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <div className="text-xs mono uppercase tracking-widest text-muted mb-3">
              The problem
            </div>
            <h2 className="serif text-4xl leading-tight mb-6">
              The remittance market is broken at the edges.
            </h2>
            <p className="text-muted leading-relaxed">
              Latin American migrant workers send $63B/year home through Western
              Union, MoneyGram, and a dozen apps. Fees average <span className="text-ink font-medium">5–7%</span>,
              delivery takes <span className="text-ink font-medium">1 to 7 days</span>,
              and senders have zero visibility into which corridor is best for their
              specific transfer — by rate, speed, or partner.
            </p>
          </div>
          <div className="space-y-3">
            <PainPoint title="Opaque pricing" body="The sender doesn't know what FX rate they'll get until after the transfer." />
            <PainPoint title="No real-time choice" body="No price comparison across rails. Each app is a silo." />
            <PainPoint title="Slow last-mile" body="Bank transfers take 1-3 days. Cash pickup means lines and fees." />
            <PainPoint title="Manual everything" body="The user opens an app, fills forms, accepts terms — no agent layer." />
          </div>
        </section>

        {/* ────────────── SOLUTION ────────────── */}
        <section className="border-t border-line py-20">
          <div className="text-xs mono uppercase tracking-widest text-muted mb-3">
            The solution
          </div>
          <h2 className="serif text-4xl leading-tight mb-12 max-w-3xl">
            Four agents. One pipeline. Real PYUSD on Kite.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Phase
              num="00"
              title="Discover"
              tag="GET /discover"
              body="The chatbot queries wasiai-a2a for agents available on the marketplace. Returns slug + price + chain per agent. No payment yet."
              color="indigo"
            />
            <Phase
              num="02"
              title="Compose"
              tag="POST /compose × 3"
              body="KYC validator → corridor discoverer → cash-out matcher. Each agent paid in PYUSD via the A2A_KEY budget. Returns a plan."
              color="emerald"
            />
            <Phase
              num="03"
              title="Authorize"
              tag="EIP-3009 sign"
              body="Server-side signTypedData against the PYUSD contract. Pure local cryptography — no network call, no money moves yet."
              color="amber"
            />
            <Phase
              num="04"
              title="Settle"
              tag="POST /settle · Kite"
              body="Facilitator pays the gas (gasless for sender), submits transferWithAuthorization. Tokens move. KiteScan tx hash returned."
              color="fuchsia"
            />
          </div>

          <div className="mt-12 border border-line p-8 bg-paper/40">
            <div className="text-xs mono uppercase tracking-widest text-muted mb-4">
              Try it
            </div>
            <p className="text-sm leading-relaxed mb-6 max-w-3xl">
              The <Link href="/demo" className="text-accent underline">live demo</Link> walks
              through these four phases with three realistic remittance scenarios (US/ES sender,
              MX/CO/PE receiver). The right column shows every actual HTTP request, response, FX
              rate, and onchain tx as the agents work — copyable JSON, verifiable on KiteScan +
              Snowtrace.
            </p>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center bg-ink text-paper px-6 py-3 mono text-xs uppercase tracking-widest hover:bg-accent transition-colors"
            >
              ▶ Open the demo
            </Link>
          </div>
        </section>

        {/* ────────────── AGENTS ────────────── */}
        <section className="border-t border-line py-20">
          <div className="text-xs mono uppercase tracking-widest text-muted mb-3">
            The 3 agents
          </div>
          <h2 className="serif text-4xl leading-tight mb-12">
            Composable. Discoverable. Onchain-priced.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AgentCard
              slug="agentshop-kyc-validator"
              price="$0.001"
              title="KYC Validator"
              body="Sender identity + AML compliance check. Returns sender tier (verified/basic/pending), AML outcome (clean/flagged/blocked), and a signed policy_id."
            />
            <AgentCard
              slug="agentshop-corridor-discoverer"
              price="$0.05"
              title="Corridor Discoverer"
              body="Searches 4 remittance corridors (Bitso, Felix Pay, Wise, Western Union). Live FX from open.er-api.com applied per receiver country. Returns recommended + shortlist + rationale."
            />
            <AgentCard
              slug="agentshop-cashout-matcher"
              price="$0.01"
              title="Cash-Out Matcher"
              body="Last-mile partner selection: OXXO (MX), BBVA, Bancolombia, Yape (PE), Mercado Pago (AR). Returns partner + fee + estimated payout time + local currency delivered."
            />
          </div>
          <div className="mt-8 text-xs mono text-muted">
            Registered on the{" "}
            <a
              href="https://app.wasiai.io/api/v1/capabilities?tag=remittance"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              WasiAI marketplace
            </a>{" "}
            · payment.chain = kite-ozone-testnet · asset = PYUSD · method = x402
          </div>
        </section>

        {/* ────────────── STACK ────────────── */}
        <section className="border-t border-line py-20">
          <div className="text-xs mono uppercase tracking-widest text-muted mb-3">
            Built on
          </div>
          <h2 className="serif text-4xl leading-tight mb-12 max-w-3xl">
            Three production services. One agentic stack.
          </h2>

          <div className="space-y-4">
            <StackRow
              title="wasiai-a2a"
              tag="multi-chain gateway · live since 2026-05"
              body="Discovery API + compose orchestration + chain-aware key budgets. Multi-chain since WKH-MULTICHAIN: Kite Ozone testnet/mainnet + Avalanche Fuji/mainnet. 908+ tests passing in production."
              url="https://wasiai-a2a-production.up.railway.app"
            />
            <StackRow
              title="wasiai-v2"
              tag="agent marketplace · public registry"
              body="Public marketplace where any agent can register. Supabase-backed agents table with ERC-8004 identity, schema, pricing per chain. Thin-proxy v1 API for downstream integrations."
              url="https://app.wasiai.io/marketplace"
            />
            <StackRow
              title="wasiai-facilitator"
              tag="self-hosted x402 · gasless settlement"
              body="EIP-3009 transferWithAuthorization relayer. Native multi-chain: Kite Ozone (PYUSD) + Avalanche (USDC). Pays gas so senders never need native tokens. Live since May 2026."
              url="https://wasiai-facilitator-production.up.railway.app/supported"
            />
          </div>
        </section>

        {/* ────────────── KITE ────────────── */}
        <section className="border-t border-line py-20 grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-5">
            <div className="text-xs mono uppercase tracking-widest text-muted mb-3">
              Why Kite
            </div>
            <h2 className="serif text-4xl leading-tight">
              Built for agents, not for users.
            </h2>
          </div>
          <div className="md:col-span-7 space-y-4">
            <KiteBullet
              title="x402 protocol native"
              body="Machine-readable paywall. Agents can pay agents without a human in the loop."
            />
            <KiteBullet
              title="PYUSD canonical stablecoin"
              body="USD-pegged · matches remittance UX where sender thinks in dollars."
            />
            <KiteBullet
              title="Sub-second finality"
              body="UX is 'click → confirm', not 'click → spinner for 5 minutes'."
            />
            <KiteBullet
              title="Agent-to-agent commerce thesis"
              body="WasiAgentShop is the consumer side. Human delegates a goal · agent shops the marketplace · peers settle in PYUSD onchain."
            />
          </div>
        </section>

        {/* ────────────── PROOF ────────────── */}
        <section className="border-t border-line py-20">
          <div className="text-xs mono uppercase tracking-widest text-muted mb-3">
            Verifiable
          </div>
          <h2 className="serif text-4xl leading-tight mb-12 max-w-3xl">
            Every claim is a clickable tx hash.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProofCard
              chain="Kite Ozone testnet"
              hash="0xa2112a4f4b448df33d5380157f0db4793b870def0534265f9b4d8f18e5c3c9d8"
              url="https://testnet.kitescan.ai/tx/0xa2112a4f4b448df33d5380157f0db4793b870def0534265f9b4d8f18e5c3c9d8"
              note="PYUSD transferWithAuthorization · settled via wasiai-facilitator"
            />
            <ProofCard
              chain="Kite Ozone testnet"
              hash="0xb138ff66bd01ce019b87ed5daf90a90ece0b836d6ad294c67050094d64167d16"
              url="https://testnet.kitescan.ai/tx/0xb138ff66bd01ce019b87ed5daf90a90ece0b836d6ad294c67050094d64167d16"
              note="Earlier demo run · same flow, same facilitator"
            />
          </div>
        </section>

        {/* ────────────── CTA ────────────── */}
        <section className="border-t border-line py-24 text-center">
          <h2 className="serif text-5xl md:text-6xl leading-tight mb-8 max-w-3xl mx-auto">
            See it work in 30 seconds.
          </h2>
          <p className="text-muted mb-10 max-w-2xl mx-auto">
            Live trace on the right, real Kite tx hash at the end. No signup, no wallet
            connect, no friction.
          </p>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center bg-ink text-paper px-12 py-5 mono text-base uppercase tracking-widest hover:bg-accent transition-colors"
          >
            ▶ Run the demo
          </Link>
        </section>

        {/* ────────────── FOOTER ────────────── */}
        <footer className="border-t border-line py-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-xs mono">
          <div>
            <div className="text-muted uppercase tracking-widest mb-2">Built by</div>
            <div>Fernando Rosas</div>
            <div className="text-muted">fernando@wasiai.io</div>
            <a
              href="https://wasiai.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              wasiai.io
            </a>
          </div>
          <div>
            <div className="text-muted uppercase tracking-widest mb-2">Hackathon</div>
            <div>Kite Hackathon 2026</div>
            <div className="text-muted">Cross-border remittances · LATAM</div>
          </div>
          <div>
            <div className="text-muted uppercase tracking-widest mb-2">Source</div>
            <a
              href="https://github.com/ferrosasfp/wasiai-agentshop"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              github.com/ferrosasfp/wasiai-agentshop
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}

function StatCard({
  big,
  label,
  foot,
}: {
  big: string;
  label: string;
  foot: string;
}) {
  return (
    <div className="border border-line p-6 bg-paper/40">
      <div className="serif text-5xl mb-2">{big}</div>
      <div className="text-xs mono uppercase tracking-widest text-muted mb-3">
        {label}
      </div>
      <div className="text-xs leading-relaxed text-muted">{foot}</div>
    </div>
  );
}

function PainPoint({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-line p-5">
      <div className="text-sm font-medium mb-1">{title}</div>
      <div className="text-xs text-muted leading-relaxed">{body}</div>
    </div>
  );
}

function Phase({
  num,
  title,
  tag,
  body,
  color,
}: {
  num: string;
  title: string;
  tag: string;
  body: string;
  color: "indigo" | "emerald" | "amber" | "fuchsia";
}) {
  const accentClass = {
    indigo: "text-indigo-500",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    fuchsia: "text-fuchsia-500",
  }[color];

  return (
    <div className="border border-line p-6 h-full flex flex-col">
      <div className={`mono text-xs uppercase tracking-widest mb-3 ${accentClass}`}>
        {num} · {tag}
      </div>
      <div className="serif text-2xl mb-3">{title}</div>
      <p className="text-xs text-muted leading-relaxed flex-1">{body}</p>
    </div>
  );
}

function AgentCard({
  slug,
  price,
  title,
  body,
}: {
  slug: string;
  price: string;
  title: string;
  body: string;
}) {
  return (
    <div className="border border-line p-6">
      <div className="text-xs mono text-warm mb-1">{price} PYUSD · per call</div>
      <div className="serif text-2xl mb-2">{title}</div>
      <div className="text-[10px] mono text-muted mb-4 break-all">{slug}</div>
      <p className="text-xs text-muted leading-relaxed">{body}</p>
    </div>
  );
}

function StackRow({
  title,
  tag,
  body,
  url,
}: {
  title: string;
  tag: string;
  body: string;
  url: string;
}) {
  return (
    <div className="border border-line p-6 grid grid-cols-1 md:grid-cols-12 gap-4">
      <div className="md:col-span-3">
        <div className="serif text-2xl mb-1">{title}</div>
        <div className="text-[10px] mono uppercase tracking-widest text-muted">
          {tag}
        </div>
      </div>
      <div className="md:col-span-7">
        <p className="text-sm text-muted leading-relaxed">{body}</p>
      </div>
      <div className="md:col-span-2 flex items-start">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs mono text-accent hover:underline"
        >
          live →
        </a>
      </div>
    </div>
  );
}

function KiteBullet({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-l-2 border-accent pl-4">
      <div className="font-medium text-sm mb-1">{title}</div>
      <div className="text-xs text-muted leading-relaxed">{body}</div>
    </div>
  );
}

function ProofCard({
  chain,
  hash,
  url,
  note,
}: {
  chain: string;
  hash: string;
  url: string;
  note: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="border border-line p-5 block hover:border-ink transition-colors"
    >
      <div className="text-[10px] mono uppercase tracking-widest text-muted mb-2">
        {chain}
      </div>
      <div className="text-[10px] mono break-all text-accent mb-3 underline">
        {hash}
      </div>
      <div className="text-xs text-muted leading-relaxed">{note}</div>
    </a>
  );
}
