"use client";

import { useState } from "react";

interface Props {
  text: string;
  label?: string;
  className?: string;
  dark?: boolean;
}

export function CopyButton({ text, label, className, dark }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard API not available — silent no-op */
    }
  }

  const baseClass = dark
    ? "inline-flex items-center justify-center w-4 h-4 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-200 transition-colors"
    : "inline-flex items-center justify-center w-4 h-4 rounded hover:bg-line text-muted hover:text-ink transition-colors";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={className ?? baseClass}
      aria-label={copied ? "Copied" : label ?? "Copy"}
      title={copied ? "Copied!" : label ?? "Copy to clipboard"}
    >
      {copied ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="w-3 h-3 text-emerald-400"
        >
          <path
            d="M20 6L9 17l-5-5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-3 h-3"
        >
          <rect
            x="9"
            y="9"
            width="11"
            height="11"
            rx="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M6 14H5a2 2 0 01-2-2V5a2 2 0 012-2h7a2 2 0 012 2v1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
