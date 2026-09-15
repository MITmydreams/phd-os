"use client";

import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  EmptyState,
  PageHeader,
  Panel,
  Section,
} from "@/components/ui/panel";
import {
  applicationLabel,
  fitsForProfessor,
  getApplication,
} from "@/lib/selectors";
import { useAppStore, useData } from "@/lib/store";
import {
  CONTACT_STATUSES,
  type ContactStatus,
  type FitPriority,
} from "@/lib/types";
import { formatDate, formatDateLong, todayISO } from "@/lib/utils";
import { ExternalLink, Link2, Mail, Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function ProfessorDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const data = useData();
  const updateProfessor = useAppStore((s) => s.updateProfessor);
  const updateProfessorFit = useAppStore((s) => s.updateProfessorFit);
  const linkProfessorToApplication = useAppStore((s) => s.linkProfessorToApplication);
  const recordEmail = useAppStore((s) => s.recordEmail);

  const prof = data.professors.find((p) => p.id === id);
  const [linkOpen, setLinkOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [fitEditId, setFitEditId] = useState<string | null>(null);
  const [fitEditForm, setFitEditForm] = useState({
    overallFit: "8",
    researchAlignment: "8",
    recentWork: "8",
    methodology: "8",
    applicationRelevance: "8",
    priority: "High" as FitPriority,
    contactStatus: "Not Contacted" as ContactStatus,
    whyFit: "",
    followUpDate: "",
  });
  const [notesDraft, setNotesDraft] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    title: "",
    institution: "",
    email: "",
    website: "",
    researchAreas: "",
    lookingForStudents: true,
    expectations: "",
    expectationsSource: "",
  });
  const [linkForm, setLinkForm] = useState({
    applicationId: "",
    priority: "High" as FitPriority,
    whyFit: "",
    overallFit: "8",
  });
  const [emailForm, setEmailForm] = useState({
    subject: "",
    content: "",
    direction: "outbound" as "outbound" | "inbound" | "draft",
    status: "Contacted" as ContactStatus,
    applicationId: "",
    followUpDate: "",
    date: todayISO(),
  });

  if (!prof) {
    return (
      <EmptyState
        title="Professor not found."
        description="This faculty profile may have been removed from your CRM."
      />
    );
  }

  const openEdit = () => {
    setEditForm({
      name: prof.name,
      title: prof.title,
      institution: prof.institution,
      email: prof.email ?? "",
      website: prof.website ?? "",
      researchAreas: prof.researchAreas.join(", "),
      lookingForStudents: prof.lookingForStudents ?? false,
      expectations: (prof.expectations ?? []).join("\n"),
      expectationsSource: prof.expectationsSource ?? "",
    });
    setEditOpen(true);
  };

  const onSaveEdit = () => {
    if (!editForm.name.trim() || !editForm.institution.trim()) return;
    updateProfessor(prof.id, {
      name: editForm.name.trim(),
      title: editForm.title.trim() || "Professor",
      institution: editForm.institution.trim(),
      email: editForm.email.trim() || undefined,
      website: editForm.website.trim() || undefined,
      researchAreas: editForm.researchAreas
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      lookingForStudents: editForm.lookingForStudents,
      expectations: editForm.expectations
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      expectationsSource: editForm.expectationsSource.trim() || undefined,
      expectationsUpdatedAt: todayISO(),
    });
    setEditOpen(false);
  };

  const openFitEdit = (fitId: string) => {
    const fit = fitsForProfessor(data, id).find((f) => f.id === fitId);
    if (!fit) return;
    setFitEditForm({
      overallFit: String(fit.overallFit),
      researchAlignment: String(fit.researchAlignment),
      recentWork: String(fit.recentWork),
      methodology: String(fit.methodology),
      applicationRelevance: String(fit.applicationRelevance),
      priority: fit.priority,
      contactStatus: fit.contactStatus,
      whyFit: fit.whyFit ?? "",
      followUpDate: fit.followUpDate ?? "",
    });
    setFitEditId(fitId);
  };

  const onSaveFit = () => {
    if (!fitEditId) return;
    updateProfessorFit(fitEditId, {
      overallFit: Number(fitEditForm.overallFit) || 0,
      researchAlignment: Number(fitEditForm.researchAlignment) || 0,
      recentWork: Number(fitEditForm.recentWork) || 0,
      methodology: Number(fitEditForm.methodology) || 0,
      applicationRelevance: Number(fitEditForm.applicationRelevance) || 0,
      priority: fitEditForm.priority,
      contactStatus: fitEditForm.contactStatus,
      whyFit: fitEditForm.whyFit || undefined,
      followUpDate: fitEditForm.followUpDate || undefined,
    });
    setFitEditId(null);
  };

  const fits = fitsForProfessor(data, prof.id);
  const linkedAppIds = new Set(fits.map((f) => f.applicationId));
  const availableApps = data.applications.filter((a) => !linkedAppIds.has(a.id));
  const papers = data.papers.filter((p) => p.professorIds.includes(prof.id));
  const topics = data.researchTopics.filter((t) => t.professorIds.includes(prof.id));
  const emails = data.emails
    .filter((e) => e.professorId === prof.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const timeline = data.timelineEvents
    .filter((e) => e.professorId === prof.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const notes = notesDraft ?? prof.notes ?? "";

  const onLink = () => {
    if (!linkForm.applicationId) return;
    linkProfessorToApplication({
      professorId: prof.id,
      applicationId: linkForm.applicationId,
      priority: linkForm.priority,
      whyFit: linkForm.whyFit || undefined,
      overallFit: Number(linkForm.overallFit) || 8,
    });
    setLinkOpen(false);
    setLinkForm({
      applicationId: "",
      priority: "High",
      whyFit: "",
      overallFit: "8",
    });
  };

  const onRecordEmail = () => {
    if (!emailForm.subject || !emailForm.content) return;
    recordEmail({
      professorId: prof.id,
      applicationId: emailForm.applicationId || undefined,
      date: emailForm.date,
      subject: emailForm.subject,
      sender:
        emailForm.direction === "inbound"
          ? prof.email ?? prof.name
          : data.settings.applicantName,
      recipient:
        emailForm.direction === "inbound"
          ? data.settings.applicantName
          : prof.email ?? prof.name,
      content: emailForm.content,
      status: emailForm.status,
      followUpDate: emailForm.followUpDate || undefined,
      direction: emailForm.direction,
    });
    setEmailOpen(false);
    setEmailForm({
      subject: "",
      content: "",
      direction: "outbound",
      status: "Contacted",
      applicationId: "",
      followUpDate: "",
      date: todayISO(),
    });
  };

  return (
    <div>
      <PageHeader
        eyebrow={prof.title}
        title={prof.name}
        description={`${prof.institution}${
          prof.lookingForStudents ? " · Looking for students" : ""
        }`}
        actions={
          <>
            <Button variant="secondary" onClick={openEdit}>
              Edit
            </Button>
            {prof.website ? (
              <a
                href={prof.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-border bg-bg-elevated px-3 text-[13px] font-medium text-ink hover:bg-bg-hover"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Website
              </a>
            ) : null}
            <Button variant="secondary" onClick={() => setEmailOpen(true)}>
              <Mail className="h-3.5 w-3.5" />
              Record Email
            </Button>
            <Button variant="primary" onClick={() => setLinkOpen(true)}>
              <Link2 className="h-3.5 w-3.5" />
              Add to Application
            </Button>
          </>
        }
      />

      {prof.researchAreas.length > 0 ? (
        <div className="mb-6 flex flex-wrap gap-1.5">
          {prof.researchAreas.map((a) => (
            <span
              key={a}
              className="rounded border border-border px-2 py-0.5 text-[12px] text-ink-secondary"
            >
              {a}
            </span>
          ))}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Research" description="Topics and focus areas">
          <Panel>
            {topics.length === 0 && !prof.researchAreas.length ? (
              <div className="px-4 py-6 text-[13px] text-ink-muted">
                No research topics linked yet.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {topics.map((t) => (
                  <li key={t.id} className="px-4 py-3">
                    <Link href="/research" className="text-[13px] font-medium hover:text-accent">
                      {t.name}
                    </Link>
                    {t.description ? (
                      <div className="mt-0.5 text-[12px] text-ink-muted">{t.description}</div>
                    ) : null}
                  </li>
                ))}
                {topics.length === 0
                  ? prof.researchAreas.map((a) => (
                      <li key={a} className="px-4 py-3 text-[13px]">
                        {a}
                      </li>
                    ))
                  : null}
              </ul>
            )}
          </Panel>
        </Section>

        <Section title="Expectations" description="What they say they want">
          <Panel className="p-4">
            {prof.expectations?.length ? (
              <>
                <ul className="list-inside list-disc space-y-1 text-[13px] text-ink-secondary">
                  {prof.expectations.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
                {(prof.expectationsSource || prof.expectationsUpdatedAt) && (
                  <div className="mt-3 text-[11px] text-ink-faint">
                    {prof.expectationsSource}
                    {prof.expectationsUpdatedAt
                      ? ` · ${formatDate(prof.expectationsUpdatedAt)}`
                      : ""}
                  </div>
                )}
              </>
            ) : (
              <p className="text-[13px] text-ink-muted">
                No recruiting expectations recorded yet.
              </p>
            )}
          </Panel>
        </Section>

        <Section title="Fit" description="Per-application alignment scores">
          <Panel>
            {fits.length === 0 ? (
              <div className="px-4 py-6 text-[13px] text-ink-muted">
                Not linked to any application yet.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {fits.map((fit) => {
                  const app = getApplication(data, fit.applicationId);
                  return (
                    <li key={fit.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/applications/${fit.applicationId}`}
                            className="text-[13px] font-medium hover:text-accent"
                          >
                            {app ? applicationLabel(data, app) : "Application"}
                          </Link>
                          <div className="mt-0.5 text-[12px] text-ink-muted">
                            Overall {fit.overallFit.toFixed(1)} · Research{" "}
                            {fit.researchAlignment.toFixed(1)} · Relevance{" "}
                            {fit.applicationRelevance.toFixed(1)}
                          </div>
                          {fit.whyFit ? (
                            <div className="mt-1 text-[12px] text-ink-secondary">
                              {fit.whyFit}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StatusBadge status={fit.priority} />
                          <StatusBadge status={fit.contactStatus} />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openFitEdit(fit.id)}
                          >
                            Edit fit
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </Section>

        <Section title="Applications" description="Programs where this faculty matters">
          <Panel>
            {fits.length === 0 ? (
              <div className="px-4 py-6 text-[13px] text-ink-muted">
                Link this professor to an application to start tracking.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {fits.map((fit) => {
                  const app = getApplication(data, fit.applicationId);
                  if (!app) return null;
                  return (
                    <li key={fit.id}>
                      <Link
                        href={`/applications/${app.id}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-bg-hover"
                      >
                        <div>
                          <div className="text-[13px] font-medium">
                            {applicationLabel(data, app)}
                          </div>
                          <div className="text-[12px] text-ink-muted">
                            Deadline {formatDate(app.deadline)}
                          </div>
                        </div>
                        <StatusBadge status={app.status} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </Section>

        <Section title="Papers" description="Work you've tagged to this faculty">
          <Panel>
            {papers.length === 0 ? (
              <div className="px-4 py-6 text-[13px] text-ink-muted">No papers linked.</div>
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
        </Section>

        <Section title="Communication" description="Email log">
          <Panel>
            {emails.length === 0 ? (
              <div className="flex flex-col items-start gap-3 px-4 py-6">
                <p className="text-[13px] text-ink-muted">No emails recorded yet.</p>
                <Button size="sm" onClick={() => setEmailOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Record Email
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {emails.map((e) => (
                  <li key={e.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[13px] font-medium">{e.subject}</div>
                        <div className="mt-0.5 text-[12px] text-ink-muted">
                          {e.direction} · {formatDateLong(e.date)}
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
            )}
          </Panel>
        </Section>

        <Section title="Timeline">
          <Panel>
            {timeline.length === 0 ? (
              <div className="px-4 py-6 text-[13px] text-ink-muted">No timeline events.</div>
            ) : (
              <ul className="divide-y divide-border">
                {timeline.map((ev) => (
                  <li key={ev.id} className="px-4 py-3">
                    <div className="text-[13px]">{ev.title}</div>
                    <div className="mt-0.5 text-[12px] text-ink-muted">
                      {formatDateLong(ev.date)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </Section>

        <Section title="Notes">
          <Panel className="p-4">
            <Field label="Professor notes">
              <Textarea
                value={notes}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Fit rationale, meeting notes, lab culture…"
                className="min-h-32"
              />
            </Field>
            <div className="mt-3 flex justify-end gap-2">
              <Button
                variant="ghost"
                disabled={notesDraft === null}
                onClick={() => setNotesDraft(null)}
              >
                Discard
              </Button>
              <Button
                variant="primary"
                disabled={notesDraft === null || notesDraft === (prof.notes ?? "")}
                onClick={() => {
                  updateProfessor(prof.id, { notes: notesDraft ?? "" });
                  setNotesDraft(null);
                }}
              >
                Save notes
              </Button>
            </div>
          </Panel>
        </Section>
      </div>

      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Professor"
        description="Update profile details for this faculty member."
        wide
      >
        <div className="space-y-3">
          <Field label="Name">
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Title">
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </Field>
            <Field label="Institution">
              <Input
                value={editForm.institution}
                onChange={(e) =>
                  setEditForm({ ...editForm, institution: e.target.value })
                }
              />
            </Field>
          </div>
          <Field label="Research areas">
            <Input
              value={editForm.researchAreas}
              onChange={(e) =>
                setEditForm({ ...editForm, researchAreas: e.target.value })
              }
              placeholder="Comma-separated"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <Input
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </Field>
            <Field label="Website">
              <Input
                value={editForm.website}
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={editForm.lookingForStudents}
              onChange={(e) =>
                setEditForm({ ...editForm, lookingForStudents: e.target.checked })
              }
            />
            Looking for PhD students
          </label>
          <Field label="Prospective student expectations">
            <Textarea
              value={editForm.expectations}
              onChange={(e) =>
                setEditForm({ ...editForm, expectations: e.target.value })
              }
              placeholder="One expectation per line"
            />
          </Field>
          <Field label="Expectations source">
            <Input
              value={editForm.expectationsSource}
              onChange={(e) =>
                setEditForm({ ...editForm, expectationsSource: e.target.value })
              }
              placeholder="Lab FAQ · homepage · email"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={onSaveEdit}
              disabled={!editForm.name.trim() || !editForm.institution.trim()}
            >
              Save
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={!!fitEditId}
        onClose={() => setFitEditId(null)}
        title="Edit Fit"
        description="Update scores and contact status for this application."
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Overall fit">
              <Input
                value={fitEditForm.overallFit}
                onChange={(e) =>
                  setFitEditForm({ ...fitEditForm, overallFit: e.target.value })
                }
              />
            </Field>
            <Field label="Research alignment">
              <Input
                value={fitEditForm.researchAlignment}
                onChange={(e) =>
                  setFitEditForm({
                    ...fitEditForm,
                    researchAlignment: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="Recent work">
              <Input
                value={fitEditForm.recentWork}
                onChange={(e) =>
                  setFitEditForm({ ...fitEditForm, recentWork: e.target.value })
                }
              />
            </Field>
            <Field label="Methodology">
              <Input
                value={fitEditForm.methodology}
                onChange={(e) =>
                  setFitEditForm({ ...fitEditForm, methodology: e.target.value })
                }
              />
            </Field>
            <Field label="Application relevance">
              <Input
                value={fitEditForm.applicationRelevance}
                onChange={(e) =>
                  setFitEditForm({
                    ...fitEditForm,
                    applicationRelevance: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="Follow-up date">
              <Input
                type="date"
                value={fitEditForm.followUpDate}
                onChange={(e) =>
                  setFitEditForm({ ...fitEditForm, followUpDate: e.target.value })
                }
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <Select
                value={fitEditForm.priority}
                onChange={(e) =>
                  setFitEditForm({
                    ...fitEditForm,
                    priority: e.target.value as FitPriority,
                  })
                }
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </Select>
            </Field>
            <Field label="Contact status">
              <Select
                value={fitEditForm.contactStatus}
                onChange={(e) =>
                  setFitEditForm({
                    ...fitEditForm,
                    contactStatus: e.target.value as ContactStatus,
                  })
                }
              >
                {CONTACT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Why fit">
            <Textarea
              value={fitEditForm.whyFit}
              onChange={(e) =>
                setFitEditForm({ ...fitEditForm, whyFit: e.target.value })
              }
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setFitEditId(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onSaveFit}>
              Save fit
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        title="Add to Application"
        description="Link this professor as a faculty fit for a program."
      >
        <div className="space-y-3">
          <Field label="Application">
            <Select
              value={linkForm.applicationId}
              onChange={(e) => setLinkForm({ ...linkForm, applicationId: e.target.value })}
            >
              <option value="">Select application</option>
              {availableApps.map((a) => (
                <option key={a.id} value={a.id}>
                  {applicationLabel(data, a)}
                </option>
              ))}
            </Select>
          </Field>
          {availableApps.length === 0 ? (
            <p className="text-[12px] text-ink-muted">
              Already linked to every application, or no applications exist.
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <Select
                value={linkForm.priority}
                onChange={(e) =>
                  setLinkForm({ ...linkForm, priority: e.target.value as FitPriority })
                }
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </Select>
            </Field>
            <Field label="Overall fit">
              <Input
                type="number"
                min={1}
                max={10}
                step={0.1}
                value={linkForm.overallFit}
                onChange={(e) => setLinkForm({ ...linkForm, overallFit: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Why fit">
            <Textarea
              value={linkForm.whyFit}
              onChange={(e) => setLinkForm({ ...linkForm, whyFit: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setLinkOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onLink} disabled={!linkForm.applicationId}>
              Link
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        title="Record Email"
        description="Log outreach without leaving the CRM."
        wide
      >
        <div className="space-y-3">
          <Field label="Subject">
            <Input
              value={emailForm.subject}
              onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Direction">
              <Select
                value={emailForm.direction}
                onChange={(e) =>
                  setEmailForm({
                    ...emailForm,
                    direction: e.target.value as "outbound" | "inbound" | "draft",
                  })
                }
              >
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
                <option value="draft">Draft</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select
                value={emailForm.status}
                onChange={(e) =>
                  setEmailForm({
                    ...emailForm,
                    status: e.target.value as ContactStatus,
                  })
                }
              >
                {CONTACT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <Input
                type="date"
                value={emailForm.date}
                onChange={(e) => setEmailForm({ ...emailForm, date: e.target.value })}
              />
            </Field>
            <Field label="Follow-up date">
              <Input
                type="date"
                value={emailForm.followUpDate}
                onChange={(e) =>
                  setEmailForm({ ...emailForm, followUpDate: e.target.value })
                }
              />
            </Field>
          </div>
          <Field label="Related application">
            <Select
              value={emailForm.applicationId}
              onChange={(e) =>
                setEmailForm({ ...emailForm, applicationId: e.target.value })
              }
            >
              <option value="">None</option>
              {fits.map((f) => {
                const app = getApplication(data, f.applicationId);
                return (
                  <option key={f.id} value={f.applicationId}>
                    {app ? applicationLabel(data, app) : f.applicationId}
                  </option>
                );
              })}
            </Select>
          </Field>
          <Field label="Content">
            <Textarea
              value={emailForm.content}
              onChange={(e) => setEmailForm({ ...emailForm, content: e.target.value })}
              className="min-h-32"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setEmailOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onRecordEmail}>
              Save
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
