"use client";

import { StatusBadge, ProgressBar } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import {
  EmptyState,
  PageHeader,
  Panel,
  Section,
  SegmentedControl,
  StatStrip,
} from "@/components/ui/panel";
import {
  applicationProgress,
  applicationTitle,
  fitsForApplication,
  nextActionForApplication,
  recommendationProgress,
  statusCounts,
} from "@/lib/selectors";
import { useAppStore, useData } from "@/lib/store";
import type { Application, ApplicationStatus } from "@/lib/types";
import { BOARD_STATUSES } from "@/lib/types";
import { cn, daysUntil, formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function ApplicationCard({ app }: { app: Application }) {
  const data = useData();
  const progress = applicationProgress(data, app.id);
  const rec = recommendationProgress(data, app.id);
  const fits = fitsForApplication(data, app.id);
  const next = nextActionForApplication(data, app.id);
  const days = daysUntil(app.deadline);

  return (
    <Link
      href={`/applications/${app.id}`}
      className="block rounded-[var(--radius)] border border-border bg-bg-elevated p-3 transition-colors hover:border-border-strong hover:bg-bg-hover"
    >
      <div className="text-[13px] font-semibold text-ink">{applicationTitle(data, app)}</div>
      <div className="mt-0.5 text-[12px] text-ink-muted">
        {data.programs.find((p) => p.id === app.programId)?.name} · PhD
      </div>
      <div className="mt-2">
        <StatusBadge status={app.status} />
      </div>
      <div className="mt-3 flex items-center justify-between text-[12px] text-ink-secondary">
        <span>Deadline</span>
        <span className="tabular-nums">
          {formatDate(app.deadline)}
          {days !== null ? ` · ${days}d` : ""}
        </span>
      </div>
      <div className="mt-2">
        <div className="mb-1 flex justify-between text-[11px] text-ink-muted">
          <span>Progress</span>
          <span className="tabular-nums">{progress.percent}%</span>
        </div>
        <ProgressBar value={progress.percent} />
      </div>
      <div className="mt-3 flex gap-3 text-[11px] text-ink-muted">
        <span>{fits.length} Professors</span>
        <span>
          {rec.submitted} / {rec.total} Recs
        </span>
      </div>
      {next ? (
        <div className="mt-2 border-t border-border pt-2 text-[12px] text-ink-secondary">
          <span className="text-ink-faint">Next: </span>
          {next.title}
        </div>
      ) : null}
    </Link>
  );
}

export default function ApplicationsPage() {
  const data = useData();
  const createApplication = useAppStore((s) => s.createApplication);
  const updateApplicationStatus = useAppStore((s) => s.updateApplicationStatus);
  const router = useRouter();
  const [view, setView] = useState<"list" | "board">("board");
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [schoolFilter, setSchoolFilter] = useState("All");
  const [dragId, setDragId] = useState<string | null>(null);
  const [form, setForm] = useState({
    schoolName: "",
    programName: "Computer Science",
    degree: "PhD",
    cycle: data.settings.cycle,
    deadline: "",
    funding: "",
  });

  const counts = statusCounts(data);
  const schools = data.schools;

  const filtered = useMemo(() => {
    return data.applications.filter((a) => {
      if (statusFilter !== "All" && a.status !== statusFilter) return false;
      if (schoolFilter !== "All" && a.schoolId !== schoolFilter) return false;
      return true;
    });
  }, [data.applications, statusFilter, schoolFilter]);

  const onCreate = () => {
    if (!form.schoolName || !form.deadline) return;
    const id = createApplication(form);
    setOpen(false);
    router.push(`/applications/${id}`);
  };

  return (
    <div>
      <PageHeader
        title="Applications"
        description={`${data.settings.cycle} PhD Application Cycle`}
        actions={
          <>
            <SegmentedControl
              value={view}
              onChange={(v) => setView(v as "list" | "board")}
              options={[
                { value: "list", label: "List" },
                { value: "board", label: "Board" },
              ]}
            />
            <Button variant="primary" onClick={() => setOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add Application
            </Button>
          </>
        }
      />

      <StatStrip
        items={[
          { label: "Total", value: data.applications.length },
          { label: "Researching", value: counts.Researching ?? 0 },
          { label: "Preparing", value: counts.Preparing ?? 0 },
          { label: "Ready", value: counts["Ready to Submit"] ?? 0 },
          { label: "Submitted", value: counts.Submitted ?? 0 },
          { label: "Interview", value: counts.Interview ?? 0 },
        ]}
      />

      {view === "list" ? (
        <Section>
          <div className="mb-3 flex flex-wrap gap-2">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-auto min-w-36"
            >
              <option value="All">All statuses</option>
              {BOARD_STATUSES.concat(["Accepted", "Rejected", "Withdrawn"]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="w-auto min-w-40"
            >
              <option value="All">All schools</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shortName}
                </option>
              ))}
            </Select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="No applications yet."
              description="Start by adding the first PhD program you are seriously considering."
              actionLabel="Add Application"
              onAction={() => setOpen(true)}
            />
          ) : (
            <Panel className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-[13px]">
                <thead className="border-b border-border text-[11px] uppercase tracking-[0.06em] text-ink-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Application</th>
                    <th className="px-4 py-2.5 font-medium">Program</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">Deadline</th>
                    <th className="px-4 py-2.5 font-medium">Progress</th>
                    <th className="px-4 py-2.5 font-medium">Professors</th>
                    <th className="px-4 py-2.5 font-medium">Reqs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((app) => {
                    const progress = applicationProgress(data, app.id);
                    const fits = fitsForApplication(data, app.id);
                    const reqs = data.requirements.filter((r) => r.applicationId === app.id);
                    const done = reqs.filter((r) => r.status === "Complete" || r.status === "Waived").length;
                    return (
                      <tr key={app.id} className="hover:bg-bg-hover">
                        <td className="px-4 py-3">
                          <Link href={`/applications/${app.id}`} className="font-medium hover:text-accent">
                            {applicationTitle(data, app)}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-ink-secondary">
                          {data.programs.find((p) => p.id === app.programId)?.name}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="px-4 py-3 tabular-nums text-ink-secondary">
                          {formatDate(app.deadline)}
                        </td>
                        <td className="px-4 py-3 min-w-[140px]">
                          <ProgressBar value={progress.percent} showLabel />
                        </td>
                        <td className="px-4 py-3 tabular-nums text-ink-secondary">{fits.length}</td>
                        <td className="px-4 py-3 tabular-nums text-ink-secondary">
                          {reqs.length ? `${done}/${reqs.length}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Panel>
          )}
        </Section>
      ) : (
        <Section>
          {data.applications.length === 0 ? (
            <EmptyState
              title="No applications yet."
              description="Start by adding the first PhD program you are seriously considering."
              actionLabel="Add Application"
              onAction={() => setOpen(true)}
            />
          ) : (
            <div className="scroll-thin -mx-1 flex gap-3 overflow-x-auto pb-2">
              {BOARD_STATUSES.map((status) => {
                const columnApps = data.applications.filter((a) => a.status === status);
                return (
                  <div
                    key={status}
                    className="w-[260px] shrink-0"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragId) updateApplicationStatus(dragId, status as ApplicationStatus);
                      setDragId(null);
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between px-1">
                      <h3 className="text-[12px] font-semibold text-ink">{status}</h3>
                      <span className="font-mono text-[11px] text-ink-faint">{columnApps.length}</span>
                    </div>
                    <div
                      className={cn(
                        "min-h-[120px] space-y-2 rounded-[var(--radius-lg)] border border-dashed border-border bg-bg-muted/40 p-2",
                      )}
                    >
                      {columnApps.map((app) => (
                        <div
                          key={app.id}
                          draggable
                          onDragStart={() => setDragId(app.id)}
                          onDragEnd={() => setDragId(null)}
                          className="cursor-grab active:cursor-grabbing"
                        >
                          <ApplicationCard app={app} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add Application"
        description="Keep it light — details can be filled in after creation."
      >
        <div className="space-y-3">
          <Field label="School">
            <Input
              value={form.schoolName}
              onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
              placeholder="Stanford University"
            />
          </Field>
          <Field label="Program">
            <Input
              value={form.programName}
              onChange={(e) => setForm({ ...form, programName: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Degree">
              <Input
                value={form.degree}
                onChange={(e) => setForm({ ...form, degree: e.target.value })}
              />
            </Field>
            <Field label="Cycle">
              <Input
                value={form.cycle}
                onChange={(e) => setForm({ ...form, cycle: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Deadline">
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </Field>
            <Field label="Funding">
              <Input
                value={form.funding}
                onChange={(e) => setForm({ ...form, funding: e.target.value })}
                placeholder="RA / Fellowship"
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onCreate}>
              Create
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
