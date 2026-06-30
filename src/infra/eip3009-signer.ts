import { randomBytes } from "node:crypto";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";
import {
  SENDER_PRIVATE_KEY,
  SETTLE_ASSET_ADDRESS,
  SETTLE_CHAIN_ID,
  SETTLE_EIP712_DOMAIN_NAME,
  SETTLE_EIP712_DOMAIN_VERSION,
  SETTLE_RPC_URL,
} from "./env";

// The settlement chain is fully derived from SETTLE_* env (default Avalanche
// Fuji 43113). No hardcoded chain — defineChain wires the configured id/RPC so
// viem can sign typed data with the right chainId in the EIP-712 domain.
const settlementChain = defineChain({
  id: SETTLE_CHAIN_ID,
  name: `settle-chain-${SETTLE_CHAIN_ID}`,
  nativeCurrency: { decimals: 18, name: "GAS", symbol: "GAS" },
  rpcUrls: {
    default: { http: [SETTLE_RPC_URL] },
    public: { http: [SETTLE_RPC_URL] },
  },
  testnet: true,
});

const EIP712_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

export interface SignedAuthorization {
  from: `0x${string}`;
  to: `0x${string}`;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: `0x${string}`;
  signature: `0x${string}`;
}

let _walletClient: ReturnType<typeof createWalletClient> | null = null;

function getWalletClient() {
  if (_walletClient) return _walletClient;
  if (!SENDER_PRIVATE_KEY) {
    throw new Error(
      "SENDER_PRIVATE_KEY not configured — cannot sign EIP-3009 server-side",
    );
  }
  const pk = SENDER_PRIVATE_KEY.startsWith("0x")
    ? (SENDER_PRIVATE_KEY as `0x${string}`)
    : (`0x${SENDER_PRIVATE_KEY}` as `0x${string}`);
  const account = privateKeyToAccount(pk);
  _walletClient = createWalletClient({
    account,
    chain: settlementChain,
    transport: http(SETTLE_RPC_URL),
  });
  return _walletClient;
}

export function _resetWalletClient(): void {
  _walletClient = null;
}

export async function signTransferAuthorization(args: {
  to: `0x${string}`;
  valueOnchain: bigint;
  timeoutSeconds?: number;
}): Promise<SignedAuthorization> {
  const client = getWalletClient();
  if (!client.account) throw new Error("Wallet client has no account");
  const account = client.account;

  const now = Math.floor(Date.now() / 1000);
  const nonce = `0x${randomBytes(32).toString("hex")}` as `0x${string}`;
  const validAfter = "0";
  const validBefore = String(now + (args.timeoutSeconds ?? 300));

  const signature = await client.signTypedData({
    account,
    domain: {
      name: SETTLE_EIP712_DOMAIN_NAME,
      version: SETTLE_EIP712_DOMAIN_VERSION,
      chainId: SETTLE_CHAIN_ID,
      verifyingContract: SETTLE_ASSET_ADDRESS,
    },
    types: EIP712_TYPES,
    primaryType: "TransferWithAuthorization",
    message: {
      from: account.address,
      to: args.to,
      value: args.valueOnchain,
      validAfter: BigInt(validAfter),
      validBefore: BigInt(validBefore),
      nonce,
    },
  });

  return {
    from: account.address,
    to: args.to,
    value: args.valueOnchain.toString(),
    validAfter,
    validBefore,
    nonce,
    signature,
  };
}
