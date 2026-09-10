"use client";

import { StatusBadge, ProgressBar } from "@/components/ui/badge";
import { PageHeader, Panel, Section, StatStrip } from "@/components/ui/panel";
import {
  applicationLabel,
  applicationProgress,
  applicationSubtitle,
  applicationTitle,
  getProfessor,
  isActiveStatus,
  needsAttention,
  whatsNext,
} from "@/lib/selectors";
import { useData } from "@/lib/store";
import { daysUntil, formatDate, greeting } from "@/lib/utils";
import Link from "next/link";

export default function OverviewPage() {
  const data = useData();
  const apps = data.applications;
  const active = apps.filter((a) => isActiveStatus(a.status) && !["Submitted", "Interview"].includes(a.status));
  const urgent = needsAttention(data).filter((i) => i.severity === "Critical" || i.severity === "High");
  const next = whatsNext(data, 5);
  const attention = needsAttention(data).slice(0, 6);
  const pulse = [...apps]
    .filter((a) => !["Rejected", "Withdrawn"].includes(a.status))
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 6);
  const outreach = data.professorFits
    .filter((f) => f.priority === "High")
    .slice(0, 5);
  const upcoming = [
    ...apps.map((a) => ({
      id: a.id,
      title: `${applicationLabel(data, a)} deadline`,
      date: a.deadline,
      href: `/applications/${a.id}`,
      kind: "Deadline",
    })),
    ...data.tasks
      .filter((t) => t.status !== "Done" && t.dueDate)
      .map((t) => ({
        id: t.id,
        title: t.title,
        date: t.dueDate!,
        href: t.applicationId ? `/applications/${t.applicationId}` : "/tasks",
        kind: "Task",
      })),
    ...data.professorFits
      .filter((f) => f.followUpDate)
      .map((f) => ({
        id: f.id,
        title: `Follow up · ${getProfessor(data, f.professorId)?.name ?? "Professor"}`,
        date: f.followUpDate!,
        href: `/professors/${f.professorId}`,
        kind: "Follow-up",
      })),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 7);

  const recent = [...data.timelineEvents]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  return (
    <div>
      <PageHeader
        eyebrow={greeting()}
        title="PhD Application Season"
        description={`${data.settings.cycle} · Command center for research, outreach, and deadlines.`}
      />

      <StatStrip
        items={[
          { label: "Applications", value: apps.length },
          { label: "Professors", value: data.professors.length },
          { label: "Active", value: active.length, accent: true },
          { label: "Urgent", value: urgent.length, accent: urgent.length > 0 },
          { label: "Submitted", value: apps.filter((a) => a.status === "Submitted").length },
          { label: "Interviews", value: apps.filter((a) => a.status === "Interview").length },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Section title="What's Next" description="Highest-leverage actions right now">
            <Panel>
              {next.length === 0 ? (
                <div className="px-4 py-6 text-[13px] text-ink-muted">No open tasks.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {next.map((task) => {
                    const days = daysUntil(task.dueDate);
                    return (
                      <li key={task.id}>
                        <Link
                          href={task.applicationId ? `/applications/${task.applicationId}` : "/tasks"}
                          className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-bg-hover"
                        >
                          <div>
                            <div className="text-[13px] font-medium text-ink">{task.title}</div>
                            <div className="mt-0.5 text-[12px] text-ink-muted">
                              {(() => {
                                const linked = task.applicationId
                                  ? data.applications.find((a) => a.id === task.applicationId)
                                  : undefined;
                                return linked ? applicationLabel(data, linked) : "General";
                              })()}
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <StatusBadge status={task.priority} />
                            <div className="mt-1 text-[11px] text-ink-muted">
                              {days === null
                                ? "No due date"
                                : days < 0
                                  ? `Overdue ${Math.abs(days)}d`
                                  : days === 0
                                    ? "Due today"
                                    : days === 1
                                      ? "Due tomorrow"
                                      : `Due ${formatDate(task.dueDate)}`}
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </Section>

          <Section title="Application Pulse" description="Progress derived from real completion state">
            <Panel>
              <ul className="divide-y divide-border">
                {pulse.map((app) => {
                  const progress = applicationProgress(data, app.id);
                  const days = daysUntil(app.deadline);
                  return (
                    <li key={app.id}>
                      <Link
                        href={`/applications/${app.id}`}
                        className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 hover:bg-bg-hover sm:grid-cols-[minmax(0,1.2fr)_minmax(120px,1fr)_auto]"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-medium">{applicationTitle(data, app)}</div>
                          <div className="truncate text-[12px] text-ink-muted">
                            {applicationSubtitle(data, app)}
                          </div>
                        </div>
                        <div className="hidden sm:block self-center">
                          <ProgressBar value={progress.percent} showLabel />
                        </div>
                        <div className="self-center text-right text-[12px] tabular-nums text-ink-muted">
                          {formatDate(app.deadline)}
                          {days !== null ? (
                            <span className="ml-1 text-ink-faint">· {days}d</span>
                          ) : null}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </Section>

          <Section title="Professor Outreach">
            <Panel>
              <ul className="divide-y divide-border">
                {outreach.map((fit) => {
                  const prof = getProfessor(data, fit.professorId);
                  return (
                    <li key={fit.id}>
                      <Link
                        href={`/professors/${fit.professorId}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-bg-hover"
                      >
                        <div>
                          <div className="text-[13px] font-medium">{prof?.name}</div>
                          <div className="text-[12px] text-ink-muted">
                            Fit {fit.overallFit.toFixed(1)} · {fit.priority} priority
                          </div>
                        </div>
                        <StatusBadge status={fit.contactStatus} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </Section>
        </div>

        <div className="space-y-5">
          <Section title="Needs Attention">
            <Panel>
              {attention.length === 0 ? (
                <div className="px-4 py-6 text-[13px] text-ink-muted">
                  Nothing critical right now.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {attention.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className="block px-4 py-3 hover:bg-bg-hover"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-medium text-ink">{item.title}</span>
                          <StatusBadge status={item.severity} />
                        </div>
                        <div className="mt-0.5 text-[12px] text-ink-muted">{item.detail}</div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </Section>

          <Section title="Upcoming">
            <Panel>
              <ul className="divide-y divide-border">
                {upcoming.map((item) => (
                  <li key={`${item.kind}-${item.id}`}>
                    <Link href={item.href} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-bg-hover">
                      <div>
                        <div className="text-[13px] font-medium">{item.title}</div>
                        <div className="text-[11px] uppercase tracking-[0.06em] text-ink-faint">
                          {item.kind}
                        </div>
                      </div>
                      <div className="text-[12px] tabular-nums text-ink-muted">
                        {formatDate(item.date)}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          </Section>

          <Section title="Recent Activity">
            <Panel>
              <ul className="divide-y divide-border">
                {recent.map((ev) => (
                  <li key={ev.id} className="px-4 py-3">
                    <div className="text-[13px] text-ink">{ev.title}</div>
                    <div className="mt-0.5 text-[12px] text-ink-muted">{formatDate(ev.date)}</div>
                  </li>
                ))}
              </ul>
            </Panel>
          </Section>
        </div>
      </div>
    </div>
  );
}
