"use client";

import { useEffect, useRef, useState } from "react";

/* ───────────────────────── CountUp ───────────────────────── */
function CountUp({
  to,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1200,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
  const [val, setVal] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const node = ref.current;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setVal(to);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, to, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ───────────────────────── Scroll reveal hook ───────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-rev]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ───────────────────────── Story María → Mamá ───────────────────────── */
function StoryStage() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const i = window.setInterval(() => setStep((s) => (s + 1) % 5), 2200);
    return () => window.clearInterval(i);
  }, []);
  const elapsed =
    step === 0 ? 0 : step === 1 ? 8 : step === 2 ? 16 : step === 3 ? 24 : 28;

  return (
    <div className="story-stage" data-rev data-d="2">
      <div className="story-flow">
        <div className="person maria">
          <div className="person-av">
            <span className="ring" />
            <span className="ring d2" />
            <span style={{ fontSize: 36 }}>👩🏽</span>
          </div>
          <h4>María</h4>
          <div className="where">Brooklyn · NY</div>
          <div className="what">$400 → mom</div>
        </div>
        <div>
          <div className="agent-strip">
            <div className={"acard " + (step >= 1 ? "active" : "")}>
              <div className="a-slug">▸ kyc-validator</div>
              <div className="a-meta">verify · AML check</div>
              <div className="a-price">$0.001 PYUSD</div>
            </div>
            <div className={"acard " + (step >= 2 ? "active" : "")}>
              <div className="a-slug">▸ corridor-discoverer</div>
              <div className="a-meta">4 rails · live FX</div>
              <div className="a-price">$0.05 PYUSD</div>
            </div>
            <div className={"acard " + (step >= 3 ? "active" : "")}>
              <div className="a-slug">▸ cashout-matcher</div>
              <div className="a-meta">OXXO · BBVA · Yape</div>
              <div className="a-price">$0.01 PYUSD</div>
            </div>
          </div>
          <div className="packet-rail">
            <div className="packet" />
            <div className="packet d2" />
            <div className="packet d3" />
            <div className="packet d4" />
          </div>
          <div
            style={{
              textAlign: "center",
              marginTop: 18,
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                color: step >= 4 ? "var(--green)" : "var(--fg-3)",
              }}
            >
              {step >= 4
                ? "✓ settled · 0xa2112a…c3c9d8"
                : `composing · ${elapsed}s elapsed`}
            </span>
          </div>
        </div>
        <div className="person mama">
          <div className="person-av">
            <span className="ring" />
            <span className="ring d2" />
            <span style={{ fontSize: 36 }}>👵🏽</span>
          </div>
          <h4>Mamá</h4>
          <div className="where">Oaxaca · MX</div>
          <div className="what">$398.47 · OXXO</div>
        </div>
      </div>
      <div className="story-foot">
        <div className="sf-cell">
          <div className="v">28s</div>
          <div className="l">end-to-end</div>
        </div>
        <div className="sf-cell">
          <div className="v">3 agents</div>
          <div className="l">paid via x402</div>
        </div>
        <div className="sf-cell">
          <div className="v">$0.061</div>
          <div className="l">total fee · PYUSD</div>
        </div>
        <div className="sf-cell">
          <div className="v">1 tx</div>
          <div className="l">gasless · Kite Ozone</div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Theme toggle button ───────────────────────── */
function ThemeBtn() {
  function toggle() {
    const root = document.documentElement;
    const isLight = root.classList.toggle("light");
    try {
      localStorage.setItem("was-shop-theme", isLight ? "light" : "dark");
    } catch {}
  }
  return (
    <button
      type="button"
      className="theme-btn"
      aria-label="Toggle theme"
      onClick={toggle}
    >
      <svg
        className="i-sun"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
      <svg
        className="i-moon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}

/* ───────────────────────── Page ───────────────────────── */
export default function HomePage() {
  useScrollReveal();

  return (
    <div className="landing-root">
      {/* NAV */}
      <header className="nav">
        <div className="wrap nav-row">
          <a href="#" className="brand">
            <span className="brand-mark">W</span>
            <span>WasiAgentShop</span>
            <span className="sep">·</span>
            <span className="sub">Kite Hackathon 2026</span>
          </a>
          <nav className="nav-links">
            <a href="#problem">Problem</a>
            <a href="#solution">Solution</a>
            <a href="#agents">Agents</a>
            <a href="#stack">Stack</a>
            <a href="#verifiable">Verifiable</a>
          </nav>
          <div className="nav-cta">
            <span className="live-pill">Live · Mainnet</span>
            <ThemeBtn />
            <a
              className="btn btn-ghost"
              href="https://github.com/ferrosasfp/wasiai-agentshop"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a className="btn btn-red" href="/demo">
              Run demo →
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="wrap hero-grid">
          <div>
            <div className="hero-meta" data-rev>
              <span className="dot" />
              Kite Hackathon 2026
              <span className="x">·</span>
              <span className="mono" style={{ color: "var(--fg-2)" }}>
                Cross-border remittances · LATAM
              </span>
            </div>
            <h1 className="h1" data-rev data-d="1">
              Agents shopping
              <br />
              for agents,
              <br />
              <span className="it">settling onchain.</span>
            </h1>
            <p className="lede" data-rev data-d="2" style={{ marginTop: 28 }}>
              A marketplace where autonomous AI agents discover, evaluate, and
              pay other agents on behalf of their human users. Every interaction
              is a real x402 payment in{" "}
              <strong style={{ color: "var(--fg)", fontWeight: 500 }}>
                PYUSD on Kite Ozone
              </strong>
              .
            </p>
            <div className="ctas" data-rev data-d="3">
              <a className="btn btn-red btn-lg" href="/demo">
                ▶ Run the live demo
              </a>
              <a
                className="btn btn-ghost btn-lg"
                href="https://github.com/ferrosasfp/wasiai-agentshop"
                target="_blank"
                rel="noopener noreferrer"
              >
                View source
              </a>
            </div>
          </div>
          <div data-rev data-d="2">
            <div className="hero-card">
              <div className="hero-card-head">
                <span>Live metrics</span>
                <span className="green">Real-time</span>
              </div>
              <div className="hero-stats">
                <div className="hstat">
                  <div className="v">
                    <CountUp to={63} duration={1400} />
                    <span className="u">B</span>
                  </div>
                  <div className="l">LATAM remittance market / yr</div>
                  <div className="d">
                    Mexico alone receives{" "}
                    <strong style={{ color: "var(--fg)", fontWeight: 500 }}>
                      $63B annually
                    </strong>{" "}
                    — 1 in 5 households depends on remittances.
                  </div>
                </div>
                <div className="hstat">
                  <div className="v">
                    &lt;<CountUp to={30} duration={1000} />
                    <span className="u">s</span>
                  </div>
                  <div className="l">end-to-end agentic settlement</div>
                  <div className="d">
                    Discovery → 3 agent calls → EIP-3009 sign → onchain settle.
                    All visible in our live trace.
                  </div>
                </div>
                <div className="hstat">
                  <div className="v">
                    $<CountUp to={0.061} decimals={3} duration={1200} />
                  </div>
                  <div className="l">total agent fees · PYUSD</div>
                  <div className="d">
                    3 agents priced at $0.001 / $0.05 / $0.01 — versus 5-7% from
                    Western Union.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="story-sec">
        <div className="wrap">
          <div className="story-head">
            <div data-rev>
              <div className="eyebrow no-end" style={{ marginBottom: 22 }}>
                Live storytelling
              </div>
              <h2 className="h2">
                $400 from Brooklyn to Oaxaca
                <br />
                <span className="it">in 28 seconds, gasless.</span>
              </h2>
            </div>
            <p className="lede" data-rev data-d="1">
              María types on WhatsApp. Her chatbot autonomously buys KYC,
              corridor discovery, and cash-out services. Mom picks up at OXXO.{" "}
              <strong style={{ color: "var(--fg)", fontWeight: 500 }}>
                Zero human intervention
              </strong>
              . Zero gas. Real PYUSD onchain.
            </p>
          </div>
          <StoryStage />
        </div>
      </section>

      {/* PROBLEM */}
      <section className="sec" id="problem">
        <div className="wrap">
          <div className="sec-head">
            <div className="kicker" data-rev>
              The problem
            </div>
            <h2 className="h2" data-rev data-d="1">
              The remittance market is{" "}
              <span className="it">broken at the edges.</span>
            </h2>
            <p className="lede" data-rev data-d="2">
              LATAM migrant workers send $63B/year through Western Union,
              MoneyGram, and a dozen apps. Fees average 5–7%, delivery takes 1
              to 7 days, and senders have zero visibility into which corridor
              is best for their specific transfer.
            </p>
          </div>
          <div className="prob-grid" data-rev data-d="3">
            <div className="prob-cell">
              <div className="ico">▸ pain · 01</div>
              <h4>Opaque pricing</h4>
              <p>
                The sender doesn&rsquo;t know what FX rate they&rsquo;ll get
                until after the transfer. No way to comparison-shop.
              </p>
            </div>
            <div className="prob-cell">
              <div className="ico">▸ pain · 02</div>
              <h4>No real-time choice</h4>
              <p>
                No price comparison across rails. Each app is a silo with its
                own pricing, partners, and UX.
              </p>
            </div>
            <div className="prob-cell">
              <div className="ico">▸ pain · 03</div>
              <h4>Slow last-mile</h4>
              <p>
                Bank transfers take 1-3 days. Cash pickup means lines and fees.
                Mobile money requires a wallet the receiver might not have.
              </p>
            </div>
            <div className="prob-cell">
              <div className="ico">▸ pain · 04</div>
              <h4>Manual everything</h4>
              <p>
                The user opens an app, fills forms, accepts terms — no agent
                layer. Every transfer is a fresh customer-service ticket.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SOLUTION / PIPELINE */}
      <section className="sec" id="solution">
        <div className="wrap">
          <div className="sec-head">
            <div className="kicker" data-rev>
              The solution
            </div>
            <h2 className="h2" data-rev data-d="1">
              Four agents. One pipeline.{" "}
              <span className="it">Real PYUSD on Kite.</span>
            </h2>
            <p className="lede" data-rev data-d="2">
              The live demo walks through these four phases. Every actual HTTP
              request, response, FX rate, and onchain tx is visible in the right
              column — copyable JSON, verifiable on KiteScan + Snowtrace.
            </p>
          </div>
          <div className="pipeline" data-rev data-d="3">
            <div className="pipe-head">
              <div className="pipe-title">
                <span className="dot" />
                Remittance pipeline · LATAM
              </div>
              <div className="pipe-chips">
                <span className="hot">x402</span>
                <span>PYUSD</span>
                <span>Kite Ozone</span>
                <span>gasless</span>
              </div>
            </div>
            <div className="pipe-body">
              <div className="phase">
                <div className="ph-num">01 · Discover</div>
                <div className="ph-method mono">GET /discover</div>
                <div className="ph-name">Browse capabilities</div>
                <div className="ph-desc">
                  The chatbot queries wasiai-a2a for agents available on the
                  marketplace. Returns slug + price + chain per agent. No
                  payment yet.
                </div>
              </div>
              <div className="phase">
                <div className="ph-num">02 · Compose</div>
                <div className="ph-method mono">POST /compose ×3</div>
                <div className="ph-name">Call 3 agents</div>
                <div className="ph-desc">
                  KYC validator → corridor discoverer → cash-out matcher. Each
                  paid in PYUSD via the A2A_KEY budget. Returns a plan.
                </div>
              </div>
              <div className="phase">
                <div className="ph-num">03 · Authorize</div>
                <div className="ph-method mono">EIP-3009 sign</div>
                <div className="ph-name">Server-side typed sig</div>
                <div className="ph-desc">
                  signTypedData against the PYUSD contract. Pure local
                  cryptography — no network call, no money moves yet.
                </div>
              </div>
              <div className="phase">
                <div className="ph-num">04 · Settle</div>
                <div className="ph-method mono">POST /settle · Kite</div>
                <div className="ph-name">Onchain transfer</div>
                <div className="ph-desc">
                  Facilitator pays the gas (gasless for sender), submits
                  transferWithAuthorization. Tokens move. KiteScan tx hash
                  returned.
                </div>
              </div>
            </div>
            <div className="pipe-foot">
              <div className="pf-cell">
                <div className="l">Chain</div>
                <div className="v">
                  Kite Ozone <span className="u">testnet</span>
                </div>
              </div>
              <div className="pf-cell">
                <div className="l">Asset</div>
                <div className="v">PYUSD</div>
              </div>
              <div className="pf-cell">
                <div className="l">Method</div>
                <div className="v">x402 · EIP-3009</div>
              </div>
              <div className="pf-cell">
                <div className="l">Total cost</div>
                <div className="v">$0.061</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AGENTS */}
      <section className="sec" id="agents">
        <div className="wrap">
          <div className="sec-head">
            <div className="kicker" data-rev>
              The 3 agents
            </div>
            <h2 className="h2" data-rev data-d="1">
              Composable. Discoverable.{" "}
              <span className="it">Onchain-priced.</span>
            </h2>
            <p className="lede" data-rev data-d="2">
              Registered on the WasiAI marketplace · payment.chain =
              kite-ozone-testnet · asset = PYUSD · method = x402.
            </p>
          </div>
          <div className="agents-grid">
            <div className="bigcard" data-rev data-d="1">
              <div className="price">$0.001 PYUSD · per call</div>
              <h3>KYC Validator</h3>
              <div className="slug mono">agentshop-kyc-validator</div>
              <p>
                Sender identity + AML compliance check. Returns sender tier
                (verified / basic / pending), AML outcome (clean / flagged /
                blocked), and a signed{" "}
                <span className="mono" style={{ color: "var(--cyan)" }}>
                  policy_id
                </span>
                .
              </p>
            </div>
            <div className="bigcard" data-rev data-d="2">
              <div className="price">$0.05 PYUSD · per call</div>
              <h3>Corridor Discoverer</h3>
              <div className="slug mono">agentshop-corridor-discoverer</div>
              <p>
                Searches 4 corridors (Bitso, Felix Pay, Wise, Western Union).
                Live FX from open.er-api.com applied per receiver country.
                Returns{" "}
                <span className="mono" style={{ color: "var(--cyan)" }}>
                  recommended + shortlist + rationale
                </span>
                .
              </p>
            </div>
            <div className="bigcard" data-rev data-d="3">
              <div className="price">$0.01 PYUSD · per call</div>
              <h3>Cash-Out Matcher</h3>
              <div className="slug mono">agentshop-cashout-matcher</div>
              <p>
                Last-mile partner selection: OXXO (MX), BBVA, Bancolombia, Yape
                (PE), Mercado Pago (AR). Returns{" "}
                <span className="mono" style={{ color: "var(--cyan)" }}>
                  partner + fee + ETA + local currency
                </span>
                .
              </p>
            </div>
          </div>
          <p
            style={{
              marginTop: 36,
              fontFamily: "var(--mono)",
              fontSize: 12,
              color: "var(--fg-3)",
              letterSpacing: "0.06em",
            }}
            data-rev
          >
            ◆{" "}
            <a
              href="https://app.wasiai.io/api/v1/capabilities?tag=remittance"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--red)" }}
            >
              app.wasiai.io/api/v1/capabilities?tag=remittance
            </a>
          </p>
        </div>
      </section>

      {/* STACK */}
      <section className="sec" id="stack">
        <div className="wrap">
          <div className="sec-head">
            <div className="kicker" data-rev>
              Built on
            </div>
            <h2 className="h2" data-rev data-d="1">
              Three production services.{" "}
              <span className="it">One agentic stack.</span>
            </h2>
          </div>
          <div className="stack-grid" data-rev data-d="2">
            <div className="stack-row">
              <div className="name">
                wasiai-a2a
                <span className="sub">
                  multi-chain gateway · live since 2026-05
                </span>
              </div>
              <div className="desc">
                Discovery API + compose orchestration + chain-aware key
                budgets. Multi-chain since{" "}
                <strong>WKH-MULTICHAIN</strong>: Kite Ozone testnet/mainnet +
                Avalanche Fuji/mainnet. <strong>908+ tests</strong> passing in
                production.
              </div>
              <a
                className="stack-link"
                href="https://wasiai-a2a-production.up.railway.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="green" />
                Live
              </a>
            </div>
            <div className="stack-row">
              <div className="name">
                wasiai-v2
                <span className="sub">
                  agent marketplace · public registry
                </span>
              </div>
              <div className="desc">
                Public marketplace where any agent can register.
                Supabase-backed agents table with{" "}
                <strong>ERC-8004 identity</strong>, schema, pricing per chain.
                Thin-proxy v1 API for downstream integrations.
              </div>
              <a
                className="stack-link"
                href="https://app.wasiai.io/marketplace"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="green" />
                Live
              </a>
            </div>
            <div className="stack-row">
              <div className="name">
                wasiai-facilitator
                <span className="sub">
                  self-hosted x402 · gasless settlement
                </span>
              </div>
              <div className="desc">
                <strong>EIP-3009 transferWithAuthorization</strong> relayer.
                Native multi-chain: Kite Ozone (PYUSD) + Avalanche (USDC). Pays
                gas so senders never need native tokens. Live since May 2026.
              </div>
              <a
                className="stack-link"
                href="https://wasiai-facilitator-production.up.railway.app/supported"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="green" />
                Live
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* WHY KITE */}
      <section className="sec" id="why-kite">
        <div className="wrap">
          <div className="sec-head">
            <div className="kicker" data-rev>
              Why Kite
            </div>
            <h2 className="h2" data-rev data-d="1">
              Built for <span className="it">agents,</span> not for users.
            </h2>
          </div>
          <div className="why-grid">
            <div className="why-bullets" data-rev data-d="2">
              <div className="why-cell">
                <div className="icn">protocol · 01</div>
                <h4>x402 protocol native</h4>
                <p>
                  Machine-readable paywall. Agents pay agents without a human in
                  the loop.
                </p>
              </div>
              <div className="why-cell">
                <div className="icn">asset · 02</div>
                <h4>PYUSD canonical stablecoin</h4>
                <p>
                  USD-pegged — matches remittance UX where senders think in
                  dollars.
                </p>
              </div>
              <div className="why-cell">
                <div className="icn">finality · 03</div>
                <h4>Sub-second finality</h4>
                <p>
                  UX is &lsquo;click → confirm&rsquo;, not &lsquo;click →
                  spinner for 5 minutes&rsquo;.
                </p>
              </div>
              <div className="why-cell">
                <div className="icn">gas · 04</div>
                <h4>Gasless via EIP-3009</h4>
                <p>
                  Senders sign typed data. The facilitator submits and pays gas.
                  Zero crypto knowledge required.
                </p>
              </div>
            </div>
            <div className="thesis" data-rev data-d="3">
              <div>
                <div className="top">Thesis · A2A commerce</div>
                <h4>
                  WasiAgentShop is the <em>consumer side</em> of agent-to-agent
                  commerce.
                </h4>
                <p>
                  Human delegates a goal. Agent shops the marketplace. Peers
                  settle in PYUSD onchain. The user never opens a wallet.
                </p>
              </div>
              <div className="arrow-flow">
                <b>human</b>
                <span className="arr">→</span>
                <b>agent</b>
                <span className="arr">→</span>
                <b>marketplace</b>
                <span className="arr">→</span>
                <b>peers</b>
                <span className="arr">→</span>
                <b>onchain</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VERIFIABLE */}
      <section className="sec" id="verifiable">
        <div className="wrap">
          <div className="sec-head">
            <div className="kicker" data-rev>
              Verifiable
            </div>
            <h2 className="h2" data-rev data-d="1">
              Every claim is a{" "}
              <span className="it">clickable tx hash.</span>
            </h2>
            <p className="lede" data-rev data-d="2">
              Every settlement happens on Kite Ozone. Every tx is on KiteScan.
              Every payment is auditable, replayable, and signed.
            </p>
          </div>
          <div className="tx-feed" data-rev data-d="3">
            <div className="tx-feed-head">
              <span className="left">Onchain trace · last runs</span>
              <span>KiteScan testnet · PYUSD transferWithAuthorization</span>
            </div>
            <div className="tx-cols">
              <span>Chain</span>
              <span>Description</span>
              <span>Tx hash</span>
              <span>Amount</span>
              <span>Age</span>
            </div>
            <a
              className="tx-row"
              href="https://testnet.kitescan.ai/tx/0xa2112a4f4b448df33d5380157f0db4793b870def0534265f9b4d8f18e5c3c9d8"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="chain">Kite Ozone</span>
              <span className="desc">
                PYUSD transferWithAuthorization · settled via wasiai-facilitator
              </span>
              <span className="hash mono">0xa2112a4f…e5c3c9d8</span>
              <span className="amount mono">+398.47 PYUSD</span>
              <span className="age mono">12m ago</span>
            </a>
            <a
              className="tx-row"
              href="https://testnet.kitescan.ai/tx/0xb138ff66bd01ce019b87ed5daf90a90ece0b836d6ad294c67050094d64167d16"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="chain">Kite Ozone</span>
              <span className="desc">
                Earlier demo run · same flow, same facilitator
              </span>
              <span className="hash mono">0xb138ff66…64167d16</span>
              <span className="amount mono">+250.00 PYUSD</span>
              <span className="age mono">2h ago</span>
            </a>
            <a
              className="tx-row"
              href="https://testnet.kitescan.ai/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="chain">Kite Ozone</span>
              <span className="desc">
                Agent fees batched · 3 services · single block
              </span>
              <span className="hash mono">0x7f3c19a8…d2b41e95</span>
              <span className="amount mono">+0.061 PYUSD</span>
              <span className="age mono">2h ago</span>
            </a>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final">
        <div className="wrap">
          <h2 data-rev>
            See it work in <span className="it">30 seconds.</span>
          </h2>
          <p data-rev data-d="1">
            Live trace on the right, real Kite tx hash at the end. No signup,
            no wallet connect, no friction.
          </p>
          <div className="ctas" data-rev data-d="2">
            <a className="btn btn-red btn-lg" href="/demo">
              ▶ Run the demo
            </a>
            <a
              className="btn btn-ghost btn-lg"
              href="https://github.com/ferrosasfp/wasiai-agentshop"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read the source
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <div className="brand" style={{ marginBottom: 14 }}>
                <span className="brand-mark">W</span>
                <span>WasiAgentShop</span>
              </div>
              <p>
                An agentic marketplace where AI agents shop services on behalf
                of users. Cross-border remittances LATAM, settled in PYUSD on
                Kite Ozone.
              </p>
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--fg-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                <span style={{ color: "var(--kite)" }}>◆</span> Kite Hackathon
                2026
              </div>
            </div>
            <div>
              <h5>Product</h5>
              <ul>
                <li>
                  <a href="/demo">Live demo</a>
                </li>
                <li>
                  <a
                    href="https://github.com/ferrosasfp/wasiai-agentshop"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Source code
                  </a>
                </li>
                <li>
                  <a
                    href="https://app.wasiai.io/api/v1/capabilities?tag=remittance"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Agents API
                  </a>
                </li>
                <li>
                  <a
                    href="https://app.wasiai.io/marketplace"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Marketplace
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5>Stack</h5>
              <ul>
                <li>
                  <a
                    href="https://wasiai-a2a-production.up.railway.app"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    wasiai-a2a
                  </a>
                </li>
                <li>
                  <a
                    href="https://app.wasiai.io"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    wasiai-v2
                  </a>
                </li>
                <li>
                  <a
                    href="https://wasiai-facilitator-production.up.railway.app/supported"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    facilitator
                  </a>
                </li>
                <li>
                  <a
                    href="https://testnet.kitescan.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    KiteScan
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5>Built by</h5>
              <ul>
                <li>Fernando Rosas</li>
                <li>
                  <a href="mailto:fernando@wasiai.io">fernando@wasiai.io</a>
                </li>
                <li>
                  <a
                    href="https://wasiai.io"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    wasiai.io
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© 2026 WasiAI · MIT licensed</span>
            <span>v1.0 · Kite Hackathon submission</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
