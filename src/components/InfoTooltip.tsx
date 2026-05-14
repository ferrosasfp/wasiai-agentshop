"use client";

interface Props {
  children: string;
  dark?: boolean;
}

export function InfoTooltip({ children, dark }: Props) {
  return (
    <span className="relative inline-block group align-middle">
      <span
        className={
          dark
            ? "cursor-help text-[10px] inline-flex items-center justify-center w-4 h-4 rounded-full border border-slate-500 text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition-colors"
            : "cursor-help text-[10px] inline-flex items-center justify-center w-4 h-4 rounded-full border border-muted text-muted hover:bg-ink hover:text-paper transition-colors"
        }
        aria-label="info"
      >
        i
      </span>
      <span
        className={
          dark
            ? "pointer-events-none absolute left-0 top-6 z-20 hidden group-hover:block w-80 p-3 bg-slate-900 border border-slate-700 text-slate-100 text-[11px] leading-relaxed shadow-xl rounded-sm"
            : "pointer-events-none absolute left-0 top-6 z-20 hidden group-hover:block w-80 p-3 bg-ink text-paper text-[11px] leading-relaxed shadow-xl rounded-sm"
        }
      >
        {children}
      </span>
    </span>
  );
}
