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
  StatStrip,
} from "@/components/ui/panel";
import { applicationLabel, currentDocumentVersion } from "@/lib/selectors";
import { useAppStore, useData } from "@/lib/store";
import type { DocumentCategory, DocumentStatus } from "@/lib/types";
import { formatDate, formatDateLong } from "@/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const CATEGORIES: DocumentCategory[] = [
  "SOP",
  "CV",
  "Recommendation",
  "Transcript",
  "English Test",
  "Other",
];

export default function DocumentsPage() {
  const data = useData();
  const createDocument = useAppStore((s) => s.createDocument);
  const addDocumentVersion = useAppStore((s) => s.addDocumentVersion);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);
  const [versionDocId, setVersionDocId] = useState("");
  const [form, setForm] = useState({
    title: "",
    category: "SOP" as DocumentCategory,
    status: "Draft" as DocumentStatus,
    applicationId: "",
    versionLabel: "v1",
    notes: "",
  });
  const [versionForm, setVersionForm] = useState({ label: "", notes: "" });

  const filtered = useMemo(() => {
    return data.documents.filter(
      (d) => categoryFilter === "All" || d.category === categoryFilter,
    );
  }, [data.documents, categoryFilter]);

  const byCategory = CATEGORIES.map((c) => ({
    category: c,
    count: data.documents.filter((d) => d.category === c).length,
  }));

  const onCreate = () => {
    if (!form.title) return;
    createDocument({
      title: form.title,
      category: form.category,
      status: form.status,
      applicationIds: form.applicationId ? [form.applicationId] : [],
      notes: form.notes || undefined,
      versionLabel: form.versionLabel || "v1",
    });
    setAddOpen(false);
    setForm({
      title: "",
      category: "SOP",
      status: "Draft",
      applicationId: "",
      versionLabel: "v1",
      notes: "",
    });
  };

  const onAddVersion = () => {
    if (!versionDocId || !versionForm.label) return;
    addDocumentVersion(versionDocId, versionForm.label, versionForm.notes || undefined);
    setVersionOpen(false);
    setVersionDocId("");
    setVersionForm({ label: "", notes: "" });
  };

  return (
    <div>
      <PageHeader
        title="Documents"
        description="SOP, CV, recommendations, and supporting materials with versions."
        actions={
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Document
          </Button>
        }
      />

      <StatStrip
        items={[
          { label: "Total", value: data.documents.length },
          { label: "SOP", value: byCategory.find((c) => c.category === "SOP")?.count ?? 0 },
          { label: "CV", value: byCategory.find((c) => c.category === "CV")?.count ?? 0 },
          {
            label: "Recs",
            value: byCategory.find((c) => c.category === "Recommendation")?.count ?? 0,
          },
          {
            label: "Ready",
            value: data.documents.filter((d) => d.status === "Ready" || d.status === "Submitted")
              .length,
            accent: true,
          },
          {
            label: "Drafts",
            value: data.documents.filter((d) => d.status === "Draft").length,
          },
        ]}
      />

      <Section>
        <div className="mb-3 flex flex-wrap gap-2">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-auto min-w-36"
          >
            <option value="All">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No documents yet."
            description="Start with a SOP or CV draft — versions keep your history intact."
            actionLabel="Add Document"
            onAction={() => setAddOpen(true)}
          />
        ) : (
          <div className="space-y-5">
            {(categoryFilter === "All" ? CATEGORIES : [categoryFilter as DocumentCategory]).map(
              (cat) => {
                const docs = filtered.filter((d) => d.category === cat);
                if (docs.length === 0) return null;
                return (
                  <div key={cat}>
                    <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
                      {cat}
                    </h3>
                    <Panel>
                      <ul className="divide-y divide-border">
                        {docs.map((doc) => {
                          const ver = currentDocumentVersion(doc);
                          return (
                            <li key={doc.id} className="px-4 py-3">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[13px] font-medium">{doc.title}</span>
                                    <StatusBadge status={doc.status} />
                                  </div>
                                  <div className="mt-0.5 text-[12px] text-ink-muted">
                                    Current {ver?.label ?? "—"} · Updated{" "}
                                    {formatDateLong(doc.updatedAt)}
                                  </div>
                                  <div className="mt-1 text-[12px] text-ink-secondary">
                                    <span className="text-ink-faint">Applications · </span>
                                    {doc.applicationIds.length === 0
                                      ? "None"
                                      : doc.applicationIds.map((aid, i) => {
                                          const app = data.applications.find(
                                            (a) => a.id === aid,
                                          );
                                          return (
                                            <span key={aid}>
                                              {i > 0 ? ", " : ""}
                                              {app ? (
                                                <Link
                                                  href={`/applications/${aid}`}
                                                  className="hover:text-accent"
                                                >
                                                  {applicationLabel(data, app)}
                                                </Link>
                                              ) : (
                                                aid
                                              )}
                                            </span>
                                          );
                                        })}
                                  </div>
                                  {doc.versions.length > 0 ? (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                      {[...doc.versions]
                                        .sort((a, b) => b.version - a.version)
                                        .map((v) => (
                                          <span
                                            key={v.id}
                                            className={
                                              v.isCurrent
                                                ? "rounded border border-accent/40 px-1.5 py-0.5 text-[11px] text-accent"
                                                : "rounded border border-border px-1.5 py-0.5 text-[11px] text-ink-muted"
                                            }
                                          >
                                            {v.label} · {formatDate(v.date)}
                                          </span>
                                        ))}
                                    </div>
                                  ) : null}
                                </div>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setVersionDocId(doc.id);
                                    setVersionForm({
                                      label: `v${Math.max(...doc.versions.map((v) => v.version), 0) + 1}`,
                                      notes: "",
                                    });
                                    setVersionOpen(true);
                                  }}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Version
                                </Button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </Panel>
                  </div>
                );
              },
            )}
          </div>
        )}
      </Section>

      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Document"
        description="Create a document record and its first version."
      >
        <div className="space-y-3">
          <Field label="Title">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Stanford SOP"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as DocumentCategory })
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as DocumentStatus })
                }
              >
                {(["Draft", "Ready", "Submitted", "Archived"] as DocumentStatus[]).map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ),
                )}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Version label">
              <Input
                value={form.versionLabel}
                onChange={(e) => setForm({ ...form, versionLabel: e.target.value })}
              />
            </Field>
            <Field label="Application">
              <Select
                value={form.applicationId}
                onChange={(e) => setForm({ ...form, applicationId: e.target.value })}
              >
                <option value="">None</option>
                {data.applications.map((a) => (
                  <option key={a.id} value={a.id}>
                    {applicationLabel(data, a)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Notes">
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onCreate}>
              Create
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={versionOpen}
        onClose={() => setVersionOpen(false)}
        title="Add Version"
        description="Mark a new revision as current without losing history."
      >
        <div className="space-y-3">
          <Field label="Version label">
            <Input
              value={versionForm.label}
              onChange={(e) => setVersionForm({ ...versionForm, label: e.target.value })}
              placeholder="v2"
            />
          </Field>
          <Field label="Notes">
            <Textarea
              value={versionForm.notes}
              onChange={(e) => setVersionForm({ ...versionForm, notes: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setVersionOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onAddVersion}>
              Add version
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
