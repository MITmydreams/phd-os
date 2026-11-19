"use client";

import { StatusBadge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import type { Email } from "@/lib/types";
import { formatDateLong } from "@/lib/utils";

export function EmailReader({
  email,
  onClose,
}: {
  email: Email | null;
  onClose: () => void;
}) {
  if (!email) return null;

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={email.subject}
      description={`${email.direction} · ${formatDateLong(email.date)}`}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={email.status} />
          <span className="text-[12px] text-ink-muted">{email.direction}</span>
        </div>
        <dl className="grid gap-1.5 text-[13px]">
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-ink-faint">From</dt>
            <dd className="min-w-0 break-all text-ink-secondary">{email.sender}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-ink-faint">To</dt>
            <dd className="min-w-0 break-all text-ink-secondary">{email.recipient}</dd>
          </div>
          {email.followUpDate ? (
            <div className="flex gap-2">
              <dt className="w-16 shrink-0 text-ink-faint">Follow-up</dt>
              <dd className="text-ink-secondary">{formatDateLong(email.followUpDate)}</dd>
            </div>
          ) : null}
        </dl>
        <div className="max-h-[min(55vh,420px)] overflow-y-auto rounded-[var(--radius)] border border-border bg-bg px-3 py-3">
          <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-ink">
            {email.content}
          </pre>
        </div>
        <p className="text-[11px] text-ink-faint">Read-only archive of the recorded email.</p>
      </div>
    </Dialog>
  );
}
