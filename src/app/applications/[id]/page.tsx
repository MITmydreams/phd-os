"use client";

import { StatusBadge, ProgressBar } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import {
  EmptyState,
  PageHeader,
  Panel,
  Section,
  SegmentedControl,
} from "@/components/ui/panel";
import {
  applicationProgress,
  applicationSubtitle,
  applicationTitle,
  currentDocumentVersion,
  documentsForApplication,
  fitsForApplication,
  getProfessor,
  needsAttention,
  nextActionForApplication,
  recommendationsForApplication,
  requirementsForApplication,
  tasksForApplication,
} from "@/lib/selectors";
import { useAppStore, useData } from "@/lib/store";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/types";
import { cn, daysUntil, formatDate, formatDateLong } from "@/lib/utils";
import { Check, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

const TABS = [
  "Documents",
  "Requirements",
  "Professors",
  "Research",
  "Communication",
  "Tasks",
  "Timeline",
  "Notes",
] as const;

type Tab = (typeof TABS)[number];

export default function ApplicationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const data = useData();
  const updateApplicationStatus = useAppStore((s) => s.updateApplicationStatus);
  const updateApplication = useAppStore((s) => s.updateApplication);
  const completeTask = useAppStore((s) => s.completeTask);
  const [tab, setTab] = useState<Tab>("Documents");
  const [notesDraft, setNotesDraft] = useState<string | null>(null);

  const app = data.applications.find((a) => a.id === id);

  const progress = useMemo(
    () => (app ? applicationProgress(data, app.id) : null),
    [data, app],
  );
  const next = app ? nextActionForApplication(data, app.id) : null;
  const docs = app ? documentsForApplication(data, app.id) : [];
  const reqs = app ? requirementsForApplication(data, app.id) : [];
  const recs = app ? recommendationsForApplication(data, app.id) : [];
  const fits = app ? fitsForApplication(data, app.id) : [];
  const tasks = app ? tasksForApplication(data, app.id) : [];
  const emails = data.emails.filter((e) => e.applicationId === id);
  const timeline = data.timelineEvents
    .filter((e) => e.applicationId === id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const topics = data.researchTopics.filter((t) => t.applicationIds.includes(id));
  const papers = data.papers.filter((p) =>
    p.professorIds.some((pid) => fits.some((f) => f.professorId === pid)) ||
    topics.some((t) => p.topicIds.includes(t.id)),
  );
  const attention = needsAttention(data).filter((i) => i.href.includes(id));
  const days = app ? daysUntil(app.deadline) : null;

  if (!app || !progress) {
    return (
      <EmptyState
        title="Application not found."
        description="This application may have been removed, or the link is outdated."
      />
    );
  }

  const notes = notesDraft ?? app.notes ?? "";
  const partLabels: Array<{ key: keyof typeof progress.parts; label: string }> = [
    { key: "research", label: "Research" },
    { key: "professors", label: "Professors" },
    { key: "documents", label: "Documents" },
    { key: "requirements", label: "Requirements" },
    { key: "submission", label: "Submission" },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Application"
        title={applicationTitle(data, app)}
        description={applicationSubtitle(data, app)}
        actions={
          <Select
            value={app.status}
            onChange={(e) =>
              updateApplicationStatus(app.id, e.target.value as ApplicationStatus)
            }
            className="w-auto min-w-40"
          >
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StatusBadge status={app.status} />
        <span className="text-[13px] text-ink-secondary">
          Deadline {formatDateLong(app.deadline)}
          {days !== null ? (
            <span
              className={cn(
                "ml-1.5 tabular-nums",
                days < 0 ? "text-danger" : days <= 7 ? "text-warning" : "text-ink-muted",
              )}
            >
              ·{" "}
              {days < 0
                ? `${Math.abs(days)}d overdue`
                : days === 0
                  ? "due today"
                  : `${days}d remaining`}
            </span>
          ) : null}
        </span>
        {app.funding ? (
          <span className="text-[12px] text-ink-muted">Funding · {app.funding}</span>
        ) : null}
      </div>

      {progress ? (
        <Section title="Progress" description={`${progress.percent}% overall readiness`}>
          <Panel className="p-4">
            <div className="mb-4">
              <ProgressBar value={progress.percent} showLabel />
            </div>
            <div className="grid gap-3 sm:grid-cols-5">
              {partLabels.map(({ key, label }) => (
                <div key={key}>
                  <div className="mb-1 flex justify-between text-[11px] text-ink-muted">
                    <span>{label}</span>
                    <span className="tabular-nums">{Math.round(progress.parts[key])}%</span>
                  </div>
                  <ProgressBar value={progress.parts[key]} />
                </div>
              ))}
            </div>
          </Panel>
        </Section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div>
          <div className="mb-4 overflow-x-auto">
            <SegmentedControl
              value={tab}
              onChange={(v) => setTab(v as Tab)}
              options={TABS.map((t) => ({ value: t, label: t }))}
            />
          </div>

          {tab === "Documents" ? (
            <Section title="Documents" description="SOP, CV, recommendations and supporting files">
              {docs.length === 0 ? (
                <EmptyState
                  title="No documents linked yet."
                  description="Attach SOP, CV, and recommendation drafts from the Documents library."
                />
              ) : (
                <Panel>
                  <ul className="divide-y divide-border">
                    {docs.map((doc) => {
                      const ver = currentDocumentVersion(doc);
                      return (
                        <li key={doc.id} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-[13px] font-medium">{doc.title}</div>
                              <div className="mt-0.5 text-[12px] text-ink-muted">
                                {doc.category} · {ver?.label ?? "—"} · {formatDate(ver?.date)}
                              </div>
                            </div>
                            <StatusBadge status={doc.status} />
                          </div>
                          {doc.versions.length > 1 ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {[...doc.versions]
                                .sort((a, b) => b.version - a.version)
                                .map((v) => (
                                  <span
                                    key={v.id}
                                    className={cn(
                                      "rounded border px-1.5 py-0.5 text-[11px]",
                                      v.isCurrent
                                        ? "border-accent/40 text-accent"
                                        : "border-border text-ink-muted",
                                    )}
                                  >
                                    {v.label}
                                  </span>
                                ))}
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </Panel>
              )}
              {recs.length > 0 ? (
                <div className="mt-4">
                  <h3 className="mb-2 text-[13px] font-semibold">Recommendations</h3>
                  <Panel>
                    <ul className="divide-y divide-border">
                      {recs.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center justify-between gap-3 px-4 py-3"
                        >
                          <div>
                            <div className="text-[13px] font-medium">{r.recommenderName}</div>
                            <div className="text-[12px] text-ink-muted">
                              {r.deadline
                                ? `Due ${formatDate(r.deadline)}`
                                : "No deadline set"}
                            </div>
                          </div>
                          <StatusBadge status={r.status} />
                        </li>
                      ))}
                    </ul>
                  </Panel>
                </div>
              ) : null}
            </Section>
          ) : null}

          {tab === "Requirements" ? (
            <Section title="Requirements" description="Checklist for this program">
              {reqs.length === 0 ? (
                <EmptyState
                  title="No requirements tracked."
                  description="Add program-specific materials so nothing slips past the deadline."
                />
              ) : (
                <Panel>
                  <ul className="divide-y divide-border">
                    {reqs.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-start justify-between gap-3 px-4 py-3"
                      >
                        <div>
                          <div className="text-[13px] font-medium">
                            {r.name}
                            {r.required ? (
                              <span className="ml-1.5 text-[11px] text-ink-faint">Required</span>
                            ) : null}
                          </div>
                          {r.description ? (
                            <div className="mt-0.5 text-[12px] text-ink-muted">{r.description}</div>
                          ) : null}
                        </div>
                        <StatusBadge status={r.status} />
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}
            </Section>
          ) : null}

          {tab === "Professors" ? (
            <Section title="Professor Fits" description="Faculty aligned with this application">
              {fits.length === 0 ? (
                <EmptyState
                  title="No professors linked."
                  description="Link faculty from the Professors CRM to track fit and outreach."
                />
              ) : (
                <Panel>
                  <ul className="divide-y divide-border">
                    {[...fits]
                      .sort((a, b) => b.overallFit - a.overallFit)
                      .map((fit) => {
                        const prof = getProfessor(data, fit.professorId);
                        return (
                          <li key={fit.id}>
                            <Link
                              href={`/professors/${fit.professorId}`}
                              className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-bg-hover"
                            >
                              <div>
                                <div className="text-[13px] font-medium">{prof?.name}</div>
                                <div className="mt-0.5 text-[12px] text-ink-muted">
                                  Fit {fit.overallFit.toFixed(1)} · {fit.priority} priority
                                </div>
                                {fit.whyFit ? (
                                  <div className="mt-1 text-[12px] text-ink-secondary">
                                    {fit.whyFit}
                                  </div>
                                ) : null}
                              </div>
                              <StatusBadge status={fit.contactStatus} />
                            </Link>
                          </li>
                        );
                      })}
                  </ul>
                </Panel>
              )}
            </Section>
          ) : null}

          {tab === "Research" ? (
            <Section title="Research Context" description="Topics and papers tied to this application">
              <div className="space-y-4">
                <Panel>
                  {topics.length === 0 ? (
                    <div className="px-4 py-6 text-[13px] text-ink-muted">
                      No research topics linked yet.
                    </div>
                  ) : (
                    <ul className="divide-y divide-border">
                      {topics.map((t) => (
                        <li key={t.id} className="px-4 py-3">
                          <div className="text-[13px] font-medium">{t.name}</div>
                          {t.description ? (
                            <div className="mt-0.5 text-[12px] text-ink-muted">{t.description}</div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
                <Panel>
                  {papers.length === 0 ? (
                    <div className="px-4 py-6 text-[13px] text-ink-muted">No related papers.</div>
                  ) : (
                    <ul className="divide-y divide-border">
                      {papers.map((p) => (
                        <li key={p.id}>
                          <Link
                            href={`/research/papers/${p.id}`}
                            className="block px-4 py-3 hover:bg-bg-hover"
                          >
                            <div className="text-[13px] font-medium">{p.title}</div>
                            <div className="mt-0.5 text-[12px] text-ink-muted">
                              {p.venue} {p.year} · Relevance {p.relevance}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </div>
            </Section>
          ) : null}

          {tab === "Communication" ? (
            <Section title="Communication" description="Emails tied to this application">
              {emails.length === 0 ? (
                <EmptyState
                  title="No emails recorded."
                  description="Log outreach from professor pages so the conversation history stays in one place."
                />
              ) : (
                <Panel>
                  <ul className="divide-y divide-border">
                    {[...emails]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((e) => (
                        <li key={e.id} className="px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-[13px] font-medium">{e.subject}</div>
                              <div className="mt-0.5 text-[12px] text-ink-muted">
                                {e.direction} · {e.sender} → {e.recipient} ·{" "}
                                {formatDate(e.date)}
                              </div>
                            </div>
                            <StatusBadge status={e.status} />
                          </div>
                          <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-ink-secondary">
                            {e.content}
                          </p>
                        </li>
                      ))}
                  </ul>
                </Panel>
              )}
            </Section>
          ) : null}

          {tab === "Tasks" ? (
            <Section title="Tasks" description="Work remaining for this application">
              {tasks.length === 0 ? (
                <EmptyState
                  title="No tasks yet."
                  description="Break the application into concrete next steps from the Tasks board."
                />
              ) : (
                <Panel>
                  <ul className="divide-y divide-border">
                    {[...tasks]
                      .sort((a, b) => {
                        if (a.status === "Done" && b.status !== "Done") return 1;
                        if (b.status === "Done" && a.status !== "Done") return -1;
                        return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
                      })
                      .map((task) => (
                        <li
                          key={task.id}
                          className="flex items-start justify-between gap-3 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <div
                              className={cn(
                                "text-[13px] font-medium",
                                task.status === "Done" && "text-ink-muted line-through",
                              )}
                            >
                              {task.title}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-ink-muted">
                              <StatusBadge status={task.status} />
                              <StatusBadge status={task.priority} />
                              {task.dueDate ? <span>Due {formatDate(task.dueDate)}</span> : null}
                            </div>
                          </div>
                          {task.status !== "Done" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => completeTask(task.id)}
                              aria-label="Complete task"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          ) : null}
                        </li>
                      ))}
                  </ul>
                </Panel>
              )}
            </Section>
          ) : null}

          {tab === "Timeline" ? (
            <Section title="Timeline" description="Events generated for this application">
              {timeline.length === 0 ? (
                <EmptyState
                  title="No activity yet."
                  description="Status changes, documents, and outreach will appear here automatically."
                />
              ) : (
                <Panel>
                  <ul className="divide-y divide-border">
                    {timeline.map((ev) => (
                      <li key={ev.id} className="px-4 py-3">
                        <div className="text-[13px] text-ink">{ev.title}</div>
                        <div className="mt-0.5 text-[12px] text-ink-muted">
                          {formatDateLong(ev.date)}
                          {ev.description ? ` · ${ev.description}` : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}
            </Section>
          ) : null}

          {tab === "Notes" ? (
            <Section title="Notes" description="Private notes for this application">
              <Panel className="p-4">
                <Field label="Application notes">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder="Strategy, funding notes, interview prep…"
                    className="min-h-40"
                  />
                </Field>
                <div className="mt-3 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setNotesDraft(null)}
                    disabled={notesDraft === null}
                  >
                    Discard
                  </Button>
                  <Button
                    variant="primary"
                    disabled={notesDraft === null || notesDraft === (app.notes ?? "")}
                    onClick={() => {
                      updateApplication(app.id, { notes: notesDraft ?? "" });
                      setNotesDraft(null);
                    }}
                  >
                    Save notes
                  </Button>
                </div>
              </Panel>
            </Section>
          ) : null}
        </div>

        <aside className="space-y-5">
          <Section title="Next Action">
            <Panel className="p-4">
              {next ? (
                <div>
                  <div className="text-[13px] font-medium text-ink">{next.title}</div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <StatusBadge status={next.priority} />
                    {next.dueDate ? (
                      <span className="text-[12px] text-ink-muted">
                        Due {formatDate(next.dueDate)}
                      </span>
                    ) : null}
                  </div>
                  {next.status !== "Done" ? (
                    <Button
                      className="mt-3 w-full"
                      size="sm"
                      variant="primary"
                      onClick={() => completeTask(next.id)}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Mark complete
                    </Button>
                  ) : null}
                </div>
              ) : (
                <p className="text-[13px] text-ink-muted">No open next action.</p>
              )}
            </Panel>
          </Section>

          <Section title="Deadline">
            <Panel className="p-4">
              <div className="font-serif text-2xl tabular-nums text-ink">
                {formatDate(app.deadline, { month: "short", day: "numeric" })}
              </div>
              <div className="mt-1 text-[12px] text-ink-muted">
                {formatDateLong(app.deadline)}
                {days !== null
                  ? days < 0
                    ? ` · ${Math.abs(days)}d past`
                    : ` · ${days}d left`
                  : ""}
              </div>
              {data.programs.find((p) => p.id === app.programId)?.website ? (
                <a
                  href={data.programs.find((p) => p.id === app.programId)?.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-[12px] text-accent hover:underline"
                >
                  Program site <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </Panel>
          </Section>

          <Section title="Needs Attention">
            <Panel>
              {attention.length === 0 ? (
                <div className="px-4 py-4 text-[13px] text-ink-muted">
                  Nothing flagged for this application.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {attention.map((item) => (
                    <li key={item.id} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium">{item.title}</span>
                        <StatusBadge status={item.severity} />
                      </div>
                      <div className="mt-0.5 text-[12px] text-ink-muted">{item.detail}</div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </Section>
        </aside>
      </div>
    </div>
  );
}
