import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CashOutMatch, Corridor } from "@/types/remittance";

interface CapturedX402Body {
  accepted: { network: string; asset: string; amount: string };
}

// Minimal typed fixtures (cast via unknown — no `any`).
const fixtureCorridor = (id: string): Corridor =>
  ({ id }) as unknown as Corridor;
const fixtureMatch = (over: Partial<CashOutMatch>): CashOutMatch =>
  over as unknown as CashOutMatch;

/**
 * Settlement-chain configuration tests.
 *
 * Verifies that, with NO env overrides, the settle path defaults to
 * Avalanche Fuji USDC (chainId 43113, asset 0x5425..., 6 decimals, network
 * eip155:43113) and that the mock fallback still works without
 * SENDER_PRIVATE_KEY. No on-chain calls — the facilitator HTTP client and the
 * EIP-3009 signer are mocked.
 */

const FUJI_CHAIN_ID = 43113;
const FUJI_USDC = "0x5425890298aed601595a70AB815c96711a31Bc65";
const FUJI_NETWORK = "eip155:43113";

// Snapshot/restore env so default-resolution stays deterministic regardless of
// any SETTLE_*/KITE_* values present in the shell.
const SETTLE_KEYS = [
  "SETTLE_CHAIN_ID",
  "SETTLE_RPC_URL",
  "SETTLE_ASSET_ADDRESS",
  "SETTLE_ASSET_SYMBOL",
  "SETTLE_ASSET_DECIMALS",
  "SETTLE_NETWORK",
  "SETTLE_EIP712_DOMAIN_NAME",
  "SETTLE_EIP712_DOMAIN_VERSION",
  "SETTLE_EXPLORER_TX_URL",
  "SETTLE_NETWORK_LABEL",
  "SENDER_PRIVATE_KEY",
];

let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = {};
  for (const k of SETTLE_KEYS) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
  vi.resetModules();
});

afterEach(() => {
  for (const k of SETTLE_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("settle env defaults", () => {
  it("default settlement chain is Avalanche Fuji USDC", async () => {
    const env = await import("@/infra/env");
    expect(env.SETTLE_CHAIN_ID).toBe(FUJI_CHAIN_ID);
    expect(env.SETTLE_ASSET_ADDRESS.toLowerCase()).toBe(FUJI_USDC.toLowerCase());
    expect(env.SETTLE_ASSET_SYMBOL).toBe("USDC");
    expect(env.SETTLE_ASSET_DECIMALS).toBe(6);
    expect(env.SETTLE_NETWORK).toBe(FUJI_NETWORK);
  });

  it("default EIP-712 domain matches Circle Fuji USDC (name='USD Coin', version='2')", async () => {
    const env = await import("@/infra/env");
    expect(env.SETTLE_EIP712_DOMAIN_NAME).toBe("USD Coin");
    expect(env.SETTLE_EIP712_DOMAIN_VERSION).toBe("2");
  });

  it("toOnchainAmount uses 6 decimals by default (USDC), not 18", async () => {
    const { toOnchainAmount } = await import("@/core/settlement");
    // 0.5 USDC * 10^6 = 500000
    expect(toOnchainAmount(0.5)).toBe(500000n);
    expect(toOnchainAmount(1)).toBe(1_000_000n);
  });

  it("explorerTxUrl resolves the configurable template (default Fuji Snowtrace)", async () => {
    const { explorerTxUrl } = await import("@/core/settlement");
    const tx = "0xabc" as `0x${string}`;
    expect(explorerTxUrl(tx)).toBe("https://testnet.snowtrace.io/tx/0xabc");
  });
});

describe("settle env overrides (no hardcodes)", () => {
  it("honours SETTLE_* overrides (e.g. switch back to Kite/PYUSD)", async () => {
    process.env.SETTLE_CHAIN_ID = "2368";
    process.env.SETTLE_ASSET_ADDRESS =
      "0x8E04D099b1a8Dd20E6caD4b2Ab2B405B98242ec9";
    process.env.SETTLE_ASSET_DECIMALS = "18";
    process.env.SETTLE_NETWORK = "eip155:2368";
    vi.resetModules();
    const env = await import("@/infra/env");
    expect(env.SETTLE_CHAIN_ID).toBe(2368);
    expect(env.SETTLE_ASSET_DECIMALS).toBe(18);
    expect(env.SETTLE_NETWORK).toBe("eip155:2368");
    const { toOnchainAmount } = await import("@/core/settlement");
    expect(toOnchainAmount(1)).toBe(10n ** 18n);
  });
});

describe("real settle builds an x402 body for the configured chain (Fuji default)", () => {
  it("posts asset/network = Fuji USDC and signs over the Fuji domain", async () => {
    process.env.SENDER_PRIVATE_KEY = "0xtest"; // gate → real path
    vi.resetModules();

    // Mock the signer so no key/crypto is needed; capture the chain via the
    // facilitator body instead.
    vi.doMock("@/infra/eip3009-signer", () => ({
      signTransferAuthorization: vi.fn(async (a: { to: `0x${string}`; valueOnchain: bigint; timeoutSeconds?: number }) => ({
        from: "0x1111111111111111111111111111111111111111",
        to: a.to,
        value: a.valueOnchain.toString(),
        validAfter: "0",
        validBefore: "9999999999",
        nonce: "0x00",
        signature: "0xsig",
      })),
    }));

    // Capture the POST body sent to the facilitator /settle.
    let captured: CapturedX402Body | null = null;
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      captured = JSON.parse(init.body as string) as CapturedX402Body;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          settled: true,
          transactionHash: "0xdeadbeef",
          blockNumber: 42,
        }),
      } as unknown as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    const { settleOnFacilitatorReal } = await import("@/infra/facilitator-client");
    const receipt = await settleOnFacilitatorReal({
      amount: 0.5,
      corridor: fixtureCorridor("c1"),
      match: fixtureMatch({ partnerName: "OXXO", netDeliveredUSD: 0.5 }),
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(captured).not.toBeNull();
    const body = captured as unknown as CapturedX402Body;
    expect(body.accepted.network).toBe(FUJI_NETWORK);
    expect(body.accepted.asset.toLowerCase()).toBe(FUJI_USDC.toLowerCase());
    // 0.5 USDC at 6 decimals → 500000 atomic units (NOT 18-decimal PYUSD).
    expect(body.accepted.amount).toBe("500000");

    expect(receipt.chainId).toBe(FUJI_CHAIN_ID);
    expect(receipt.network).toBe(FUJI_NETWORK);
    expect(receipt.txHash).toBe("0xdeadbeef");
  });
});

describe("mock fallback works without SENDER_PRIVATE_KEY", () => {
  it("settleRemittance returns a mock receipt on the configured (Fuji) network", async () => {
    // SENDER_PRIVATE_KEY deleted in beforeEach → mock path.
    vi.resetModules();
    const { settleRemittance } = await import("@/application/settle-remittance");
    const receipt = await settleRemittance({
      remittance: { id: "r1" } as unknown as Parameters<typeof settleRemittance>[0]["remittance"],
      corridorDiscovery: { recommended: fixtureCorridor("corr-1") } as unknown as Parameters<typeof settleRemittance>[0]["corridorDiscovery"],
      match: fixtureMatch({ partnerName: "OXXO", netDeliveredUSD: 200 }),
    });
    expect(receipt.facilitator).toContain("demo mode");
    expect(receipt.network).toBe(FUJI_NETWORK);
    expect(receipt.chainId).toBe(FUJI_CHAIN_ID);
    expect(receipt.txHash).toMatch(/^0x[0-9a-f]{64}$/);
  });
});
