import { cn } from "@/lib/utils";
import type { ApplicationStatus, ContactStatus, TaskPriority, TaskStatus } from "@/lib/types";

const statusTone: Record<string, string> = {
  Interested: "bg-bg-muted text-ink-secondary",
  Researching: "bg-[oklch(0.94_0.03_230)] text-[oklch(0.4_0.08_230)]",
  Preparing: "bg-accent-soft text-accent",
  "Ready to Submit": "bg-[oklch(0.94_0.04_145)] text-[oklch(0.38_0.09_145)]",
  Submitted: "bg-[oklch(0.94_0.03_260)] text-[oklch(0.4_0.08_260)]",
  Interview: "bg-warning-soft text-warning",
  Accepted: "bg-success-soft text-success",
  Rejected: "bg-danger-soft text-danger",
  Withdrawn: "bg-bg-muted text-ink-muted",
  Todo: "bg-bg-muted text-ink-secondary",
  "In Progress": "bg-accent-soft text-accent",
  Done: "bg-success-soft text-success",
  Urgent: "bg-danger-soft text-danger",
  High: "bg-warning-soft text-warning",
  Normal: "bg-bg-muted text-ink-secondary",
  Low: "bg-bg-muted text-ink-faint",
  Critical: "bg-danger-soft text-danger",
  Medium: "bg-warning-soft text-warning",
  "Not Contacted": "bg-bg-muted text-ink-muted",
  Drafted: "bg-bg-muted text-ink-secondary",
  Contacted: "bg-[oklch(0.94_0.03_230)] text-[oklch(0.4_0.08_230)]",
  Waiting: "bg-warning-soft text-warning",
  Replied: "bg-success-soft text-success",
  "Follow-up Due": "bg-danger-soft text-danger",
  Archived: "bg-bg-muted text-ink-faint",
  Draft: "bg-warning-soft text-warning",
  Ready: "bg-success-soft text-success",
  Complete: "bg-success-soft text-success",
  Missing: "bg-danger-soft text-danger",
  Requested: "bg-warning-soft text-warning",
  Accepted_rec: "bg-accent-soft text-accent",
};

export function Badge({
  children,
  tone,
  className,
}: {
  children: React.ReactNode;
  tone?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium leading-none",
        tone ? statusTone[tone] ?? "bg-bg-muted text-ink-secondary" : "bg-bg-muted text-ink-secondary",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({
  status,
}: {
  status: ApplicationStatus | TaskStatus | ContactStatus | TaskPriority | string;
}) {
  return <Badge tone={status}>{status}</Badge>;
}

export function ProgressBar({
  value,
  className,
  showLabel,
}: {
  value: number;
  className?: string;
  showLabel?: boolean;
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="progress-track min-w-0 flex-1">
        <div className="progress-fill" style={{ width: `${v}%` }} />
      </div>
      {showLabel ? (
        <span className="font-mono text-[11px] tabular-nums text-ink-muted">{v}%</span>
      ) : null}
    </div>
  );
}
