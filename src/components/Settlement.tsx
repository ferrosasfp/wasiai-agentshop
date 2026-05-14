"use client";

import { kitescanUrl, shortHash } from "@/core/settlement";
import { formatLocalCurrency, formatAmountUSD } from "@/core/remittance";
import type { CashOutMatch, SettlementReceipt } from "@/types/remittance";

interface Props {
  receipt: SettlementReceipt | null;
  match: CashOutMatch | null;
  receiverCountry: string;
  onSettle: () => void;
  canSettle: boolean;
  isSettling: boolean;
}

export function Settlement({
  receipt,
  match,
  receiverCountry,
  onSettle,
  canSettle,
  isSettling,
}: Props) {
  if (receipt) {
    const isTestnetCapped = match
      ? receipt.amountPYUSD < match.netDeliveredUSD - 0.01
      : false;
    return (
      <div>
        <div className="text-xs mono uppercase tracking-widest text-muted mb-4">
          04 · Settled onchain
        </div>
        <div className="border border-accent p-6 bg-white">
          {match ? (
            <>
              <div className="serif text-3xl mb-1">
                {formatLocalCurrency(match.netDeliveredMXN, receiverCountry)} delivered
              </div>
              <div className="text-xs mono text-muted mb-6">
                via {receipt.corridor} → {match.partnerName} · payout in{" "}
                {match.estimatedPayoutMinutes}min
              </div>
            </>
          ) : (
            <>
              <div className="serif text-3xl mb-1">
                {receipt.amountPYUSD.toFixed(4)} PYUSD sent
              </div>
              <div className="text-xs mono text-muted mb-6">
                via {receipt.corridor} → {receipt.partner}
              </div>
            </>
          )}

          <div className="space-y-2 text-xs mono">
            <div>
              <span className="text-muted">onchain proof · </span>
              {receipt.amountPYUSD.toFixed(4)} PYUSD
              {isTestnetCapped && (
                <span className="text-muted">
                  {" "}
                  · testnet cap (mainnet settles full {formatAmountUSD(match?.netDeliveredUSD ?? 0)})
                </span>
              )}
            </div>
            <div>
              <span className="text-muted">tx · </span>
              <a
                href={kitescanUrl(receipt.txHash, receipt.chainId)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-accent"
              >
                {shortHash(receipt.txHash, 8)}
              </a>
            </div>
            <div>
              <span className="text-muted">network · </span>
              {receipt.chainId === 2366
                ? "Kite Ozone mainnet"
                : "Kite Ozone testnet"}
            </div>
            <div>
              <span className="text-muted">block · </span>
              {receipt.blockNumber.toLocaleString()}
            </div>
            <div>
              <span className="text-muted">from · </span>
              {shortHash(receipt.fromWallet, 6)}
            </div>
            <div>
              <span className="text-muted">to · </span>
              {shortHash(receipt.toWallet, 6)}
            </div>
            <div>
              <span className="text-muted">facilitator · </span>
              {receipt.facilitator}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-xs mono uppercase tracking-widest text-muted mb-4">
        03 · Authorize the payout
      </div>
      <div className="border border-line p-6">
        <p className="text-sm leading-relaxed mb-6 text-muted">
          Maria&rsquo;s wallet signs an EIP-3009 gasless authorization. The
          wasiai-facilitator pays the gas and settles in PYUSD on Kite Ozone.
          Mama receives the cash-out at the partner&rsquo;s location within minutes.
        </p>
        <button
          type="button"
          onClick={onSettle}
          disabled={!canSettle || isSettling}
          className="bg-ink text-paper px-6 py-3 mono text-xs uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSettling ? "Settling..." : "Sign & settle"}
        </button>
      </div>
    </div>
  );
}
