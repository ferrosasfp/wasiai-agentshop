/**
 * claim-pyusd.mjs — Fund the operator/sender wallet with testnet PYUSD on Kite Ozone.
 *
 * The official PYUSD testnet contract exposes a public no-arg `claim()` that
 * mints exactly 10 PYUSD (18 decimals) to msg.sender. We call it from the
 * SENDER_PRIVATE_KEY wallet so the agentshop demo settle has PYUSD balance.
 *
 * Why this exists: the SIGN & SETTLE flow settles real PYUSD via the
 * self-hosted wasiai-facilitator. If the operator wallet runs out of PYUSD the
 * settle reverts on-chain even when auth is correct. Re-run this before a demo.
 *
 * Usage (PK never hardcoded — read from env / .env.local):
 *   PK=$(grep '^SENDER_PRIVATE_KEY=' .env.local | cut -d= -f2-) \
 *     node scripts/claim-pyusd.mjs
 *
 * Needs: a little KITE native in the wallet for gas (~0.001 KITE).
 * Source: faucet behaviour documented from tx 0x2297f687...63056ea7 (10 PYUSD claim).
 */
import {
  createPublicClient,
  createWalletClient,
  http,
  formatUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const PYUSD = "0x8E04D099b1a8Dd20E6caD4b2Ab2B405B98242ec9";
const RPC = process.env.KITE_RPC_URL ?? "https://rpc-testnet.gokite.ai/";

const kite = {
  id: 2368,
  name: "Kite Ozone Testnet",
  nativeCurrency: { name: "KITE", symbol: "KITE", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
};

const abi = [
  { type: "function", name: "claim", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "balanceOf", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "decimals", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
];

const pk = process.env.PK ?? process.env.SENDER_PRIVATE_KEY ?? process.env.FUNDER_PK;
if (!pk) {
  console.error("ERROR: no private key. Pass PK=0x... (or SENDER_PRIVATE_KEY) in env.");
  process.exit(1);
}

const account = privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`);
const pub = createPublicClient({ chain: kite, transport: http(RPC) });
const wallet = createWalletClient({ account, chain: kite, transport: http(RPC) });

const decimals = await pub.readContract({ address: PYUSD, abi, functionName: "decimals" });
const before = await pub.readContract({ address: PYUSD, abi, functionName: "balanceOf", args: [account.address] });
const gas = await pub.getBalance({ address: account.address });

console.log(`wallet      : ${account.address}`);
console.log(`KITE (gas)  : ${formatUnits(gas, 18)}`);
console.log(`PYUSD before: ${formatUnits(before, decimals)}`);

if (gas === 0n) {
  console.error("ERROR: 0 KITE native — wallet needs gas to send claim(). Fund KITE first.");
  process.exit(1);
}

// viem gotcha (documented): simulateContract's `request` fails at writeContract
// with "Missing or invalid parameters". Call writeContract directly instead.
const hash = await wallet.writeContract({
  address: PYUSD,
  abi,
  functionName: "claim",
  args: [],
  chain: kite,
  account,
});
console.log(`claim() tx  : ${hash}`);
console.log(`explorer    : https://testnet.kitescan.ai/tx/${hash}`);

const receipt = await pub.waitForTransactionReceipt({ hash });
const after = await pub.readContract({ address: PYUSD, abi, functionName: "balanceOf", args: [account.address] });

console.log(`status      : ${receipt.status} (block ${receipt.blockNumber}, gas ${receipt.gasUsed})`);
console.log(`PYUSD after : ${formatUnits(after, decimals)}  (+${formatUnits(after - before, decimals)})`);
