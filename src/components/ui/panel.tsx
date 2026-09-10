import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Button } from "./button";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  className,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start justify-center rounded-[var(--radius-lg)] border border-dashed border-border bg-bg-elevated/60 px-6 py-10",
        className,
      )}
    >
      <h3 className="font-serif text-xl text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-ink-secondary">
        {description}
      </p>
      {actionLabel && onAction ? (
        <Button className="mt-5" variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-serif text-[28px] leading-tight text-ink">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-[13px] text-ink-secondary">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Section({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mb-6", className)}>
      {(title || actions) && (
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            {title ? <h2 className="text-[15px] font-semibold text-ink">{title}</h2> : null}
            {description ? (
              <p className="mt-0.5 text-[12px] text-ink-muted">{description}</p>
            ) : null}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-border bg-bg-elevated",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatStrip({
  items,
}: {
  items: Array<{ label: string; value: string | number; accent?: boolean }>;
}) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border bg-border sm:grid-cols-4 lg:grid-cols-6">
      {items.map((item) => (
        <div key={item.label} className="bg-bg-elevated px-3 py-2.5">
          <div className="text-[11px] uppercase tracking-[0.06em] text-ink-muted">
            {item.label}
          </div>
          <div
            className={cn(
              "mt-0.5 font-serif text-2xl tabular-nums",
              item.accent ? "text-accent" : "text-ink",
            )}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SegmentedControl({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex rounded-[var(--radius)] border border-border bg-bg-muted p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-[4px] px-2.5 py-1 text-[12px] font-medium transition-colors",
            value === opt.value
              ? "bg-bg-elevated text-ink shadow-[var(--shadow-sm)]"
              : "text-ink-muted hover:text-ink",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
