"use client";

import { MOCK_REMITTANCES } from "@/lib/mock-data";
import { formatAmountUSD } from "@/core/remittance";
import type { Remittance } from "@/types/remittance";

interface Props {
  onSelect: (remittance: Remittance) => void;
  disabled?: boolean;
}

const FLAG: Record<string, string> = {
  MX: "🇲🇽",
  CO: "🇨🇴",
  PE: "🇵🇪",
  AR: "🇦🇷",
  US: "🇺🇸",
  CA: "🇨🇦",
  ES: "🇪🇸",
};

export function RemittancePicker({ onSelect, disabled }: Props) {
  return (
    <div>
      <div className="text-xs mono uppercase tracking-widest text-muted mb-4">
        01 · Pick a remittance request
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MOCK_REMITTANCES.map((rem) => (
          <button
            key={rem.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(rem)}
            className="text-left border border-line hover:border-ink p-5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="text-xs mono text-muted mb-2">
              {FLAG[rem.sender.country]} → {FLAG[rem.receiver.country]} ·{" "}
              {rem.purpose.replace("-", " ")}
            </div>
            <div className="font-medium text-sm mb-1">
              {rem.sender.name} → {rem.receiver.name}
            </div>
            <div className="text-xs text-muted mb-3">{rem.receiver.city}</div>
            <div className="serif text-3xl">
              {formatAmountUSD(rem.amountUSD)}
            </div>
            <div className="text-xs mono text-muted mt-2">
              cash-out preference · {rem.receiver.cashOutPreference}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
