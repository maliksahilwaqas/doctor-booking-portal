import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Kicker({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`text-[11px] font-extrabold uppercase tracking-[0.1em] text-accent ${className}`}>
      {children}
    </div>
  );
}

export function RuleThick({ className = "" }: { className?: string }) {
  return <div className={`h-[2px] bg-divider ${className}`} />;
}

export function RuleThin({ className = "" }: { className?: string }) {
  return <div className={`h-px bg-divider/50 ${className}`} />;
}

export function Tag({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border border-divider px-2 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.05em] ${className}`}
    >
      {children}
    </span>
  );
}

export function CtaBar({
  children,
  className = "",
  disabled = false,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`flex h-[52px] w-full items-center justify-between px-4 text-[15px] font-extrabold transition-colors ${
        disabled
          ? "cursor-not-allowed bg-neutral-300 text-ink/45"
          : "cursor-pointer bg-accent text-white hover:bg-accent-600"
      } ${className}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

export function SectionHeading({ children, meta }: { children: ReactNode; meta?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.1em]">{children}</div>
      {meta ? <div className="text-[11.5px] text-muted">{meta}</div> : null}
    </div>
  );
}

export function TextField({
  label,
  hint,
  ...rest
}: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <div className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-muted">{label}</div>
      <input
        className="h-[42px] w-full border border-divider bg-surface px-3 text-sm font-medium text-ink outline-none focus:border-ink"
        {...rest}
      />
      {hint ? <div className="mt-1.5 text-[11px] text-muted">{hint}</div> : null}
    </label>
  );
}

/** A small blinking dot for a tab label -- e.g. "unread requests waiting." */
export function NotifyDot({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-[7px] w-[7px] flex-none bg-accent align-middle ${className}`}
      style={{ animation: "notify-blink 1.1s ease-in-out infinite" }}
    />
  );
}

export function TabRow({
  tabs,
  active,
  hrefFor,
}: {
  tabs: { key: string; label: ReactNode }[];
  active: string;
  hrefFor: (key: string) => string;
}) {
  return (
    <div className="flex border-t-2 border-divider text-[11.5px] font-extrabold tracking-[0.02em] sm:text-[12.5px] sm:tracking-[0.04em]">
      {tabs.map((t, i) => (
        <a
          key={t.key}
          href={hrefFor(t.key)}
          className="relative min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap px-1.5 py-2.5 text-center transition-colors hover:bg-accent-100 sm:px-3"
          style={{
            borderLeft: i === 0 ? "none" : "1px solid var(--divider)",
            background: active === t.key ? "var(--ink)" : "transparent",
            color: active === t.key ? "var(--bg)" : "var(--ink)",
          }}
        >
          {t.label}
        </a>
      ))}
    </div>
  );
}
