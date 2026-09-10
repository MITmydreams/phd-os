"use client";

import { PageHeader, Panel } from "@/components/ui/panel";
import { useData } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { useMemo } from "react";

const typeGlyph: Record<string, string> = {
  application_created: "+",
  application_status_changed: "→",
  professor_added: "+",
  professor_linked: "↗",
  paper_added: "◈",
  document_uploaded: "⬆",
  document_version: "✓",
  email_recorded: "✉",
  task_completed: "✓",
  task_created: "·",
  recommendation_updated: "↗",
  note: "·",
};

export default function TimelinePage() {
  const data = useData();

  const groups = useMemo(() => {
    const sorted = [...data.timelineEvents].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
    const map = new Map<string, typeof sorted>();
    for (const ev of sorted) {
      const key = format(parseISO(ev.date), "MMM yyyy").toUpperCase();
      const arr = map.get(key) ?? [];
      arr.push(ev);
      map.set(key, arr);
    }
    return [...map.entries()];
  }, [data.timelineEvents]);

  const hrefFor = (ev: (typeof data.timelineEvents)[number]) => {
    if (ev.applicationId) return `/applications/${ev.applicationId}`;
    if (ev.professorId) return `/professors/${ev.professorId}`;
    if (ev.paperId) return `/research/papers/${ev.paperId}`;
    if (ev.documentId) return "/documents";
    if (ev.taskId) return "/tasks";
    return undefined;
  };

  return (
    <div>
      <PageHeader
        title="Timeline"
        description="What has happened during your application season"
      />

      {groups.length === 0 ? (
        <Panel className="px-4 py-10 text-[13px] text-ink-muted">
          Timeline events appear automatically as you work — applications, outreach,
          documents, and completed tasks.
        </Panel>
      ) : (
        <div className="space-y-8">
          {groups.map(([month, events]) => (
            <section key={month}>
              <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
                {month}
              </h2>
              <Panel>
                <ul className="divide-y divide-border">
                  {events.map((ev) => {
                    const href = hrefFor(ev);
                    const inner = (
                      <div className="flex gap-3 px-4 py-3">
                        <div className="w-6 shrink-0 text-center font-mono text-[13px] text-accent">
                          {typeGlyph[ev.type] ?? "·"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] text-ink">{ev.title}</div>
                          {ev.description ? (
                            <div className="text-[12px] text-ink-secondary">
                              {ev.description}
                            </div>
                          ) : null}
                        </div>
                        <div className="shrink-0 text-[12px] tabular-nums text-ink-muted">
                          {formatDate(ev.date)}
                        </div>
                      </div>
                    );
                    return (
                      <li key={ev.id}>
                        {href ? (
                          <Link href={href} className="block hover:bg-bg-hover">
                            {inner}
                          </Link>
                        ) : (
                          inner
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
