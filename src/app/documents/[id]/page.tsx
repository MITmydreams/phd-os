"use client";

import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { PageHeader, Panel, Section } from "@/components/ui/panel";
import { applicationLabel, currentDocumentVersion } from "@/lib/selectors";
import {
  isPreviewable,
  openAttachment,
  readFileAsAttachment,
  type AttachedFile,
} from "@/lib/files";
import { useAppStore, useData } from "@/lib/store";
import type { DocumentStatus, DocumentVersion } from "@/lib/types";
import { formatDateLong } from "@/lib/utils";
import { ArrowLeft, Download, Eye, Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function DocumentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const data = useData();
  const addDocumentVersion = useAppStore((s) => s.addDocumentVersion);
  const updateDocument = useAppStore((s) => s.updateDocument);
  const doc = data.documents.find((d) => d.id === id);

  const [versionOpen, setVersionOpen] = useState(false);
  const [versionForm, setVersionForm] = useState({ label: "", notes: "" });
  const [file, setFile] = useState<AttachedFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [preview, setPreview] = useState<DocumentVersion | null>(null);

  const current = doc ? currentDocumentVersion(doc) : undefined;
  const versions = useMemo(
    () => (doc ? [...doc.versions].sort((a, b) => b.version - a.version) : []),
    [doc],
  );

  if (!doc) {
    return (
      <div>
        <p className="text-[13px] text-ink-muted">Document not found.</p>
        <Link href="/documents" className="mt-3 inline-block text-[13px] text-accent">
          Back to Documents
        </Link>
      </div>
    );
  }

  const onPickFile = async (picked: File | null) => {
    setFileError(null);
    setFile(null);
    if (!picked) return;
    try {
      setFile(await readFileAsAttachment(picked));
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Could not attach file.");
    }
  };

  const onAddVersion = () => {
    if (!versionForm.label) return;
    addDocumentVersion(
      doc.id,
      versionForm.label,
      versionForm.notes || undefined,
      file
        ? { url: file.url, fileName: file.fileName, mimeType: file.mimeType }
        : undefined,
    );
    setVersionOpen(false);
    setVersionForm({ label: "", notes: "" });
    setFile(null);
  };

  const previewKind = preview?.url
    ? isPreviewable(preview.mimeType, preview.fileName)
    : null;

  return (
    <div>
      <Link
        href="/documents"
        className="mb-3 inline-flex items-center gap-1 text-[12px] text-ink-muted hover:text-accent"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Documents
      </Link>
      <PageHeader
        title={doc.title}
        description={`${doc.category} · ${versions.length} version${versions.length === 1 ? "" : "s"}`}
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setVersionForm({
                label: `v${Math.max(...doc.versions.map((v) => v.version), 0) + 1}`,
                notes: "",
              });
              setFile(null);
              setFileError(null);
              setVersionOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            New version
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
        <Panel className="p-4 sm:p-5">
          <Section title="Current file" description={current?.label ?? "No version yet"}>
            {current?.url ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  variant="primary"
                  onClick={() => setPreview(current)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Open
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => openAttachment(current.url!, current.fileName)}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
                <span className="text-[12px] text-ink-muted">
                  {current.fileName ?? "Attached file"}
                </span>
              </div>
            ) : (
              <p className="mt-3 text-[13px] text-ink-muted">
                No file attached yet. Add a version with a PDF or other file.
              </p>
            )}
            {current?.notes ? (
              <p className="mt-3 text-[13px] leading-relaxed text-ink-secondary">
                {current.notes}
              </p>
            ) : null}
          </Section>

          <Section title="Version history">
            <ul className="mt-2 divide-y divide-border rounded-[var(--radius)] border border-border">
              {versions.map((v) => (
                <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                  <div>
                    <div className="text-[13px] font-medium">
                      {v.label}
                      {v.isCurrent ? (
                        <span className="ml-2 text-[11px] font-normal text-accent">current</span>
                      ) : null}
                    </div>
                    <div className="text-[12px] text-ink-muted">
                      {formatDateLong(v.date)}
                      {v.fileName ? ` · ${v.fileName}` : " · no file"}
                    </div>
                    {v.notes ? (
                      <div className="mt-0.5 text-[12px] text-ink-secondary">{v.notes}</div>
                    ) : null}
                  </div>
                  {v.url ? (
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => setPreview(v)}>
                        Open
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </Section>
        </Panel>

        <div className="space-y-4">
          <Panel className="p-4">
            <Field label="Status">
              <Select
                value={doc.status}
                onChange={(e) =>
                  updateDocument(doc.id, { status: e.target.value as DocumentStatus })
                }
              >
                {(["Draft", "Ready", "Submitted", "Archived"] as DocumentStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="mt-3">
              <StatusBadge status={doc.status} />
            </div>
          </Panel>
          <Panel className="p-4">
            <Field label="Notes">
              <Textarea
                value={doc.notes ?? ""}
                onChange={(e) => updateDocument(doc.id, { notes: e.target.value })}
                placeholder="Audience, school-specific tweaks…"
                className="min-h-28"
              />
            </Field>
          </Panel>
          <Panel className="p-4">
            <div className="text-[12px] font-medium uppercase tracking-[0.06em] text-ink-muted">
              Linked applications
            </div>
            {doc.applicationIds.length === 0 ? (
              <p className="mt-2 text-[13px] text-ink-muted">None</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {doc.applicationIds.map((aid) => {
                  const app = data.applications.find((a) => a.id === aid);
                  return (
                    <li key={aid}>
                      <Link href={`/applications/${aid}`} className="text-[13px] hover:text-accent">
                        {app ? applicationLabel(data, app) : aid}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <Dialog
        open={versionOpen}
        onClose={() => setVersionOpen(false)}
        title="Add version"
        description="Upload a file and mark it as the current revision."
      >
        <div className="space-y-3">
          <Field label="Version label">
            <Input
              value={versionForm.label}
              onChange={(e) => setVersionForm({ ...versionForm, label: e.target.value })}
            />
          </Field>
          <Field label="File">
            <input
              type="file"
              className="block w-full text-[13px] text-ink-secondary file:mr-3 file:rounded-[var(--radius)] file:border file:border-border file:bg-bg file:px-2.5 file:py-1"
              onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <p className="mt-1 text-[12px] text-ink-muted">Attached: {file.fileName}</p>
            ) : null}
            {fileError ? (
              <p className="mt-1 text-[12px] text-danger">{fileError}</p>
            ) : null}
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
              Save version
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        size="lg"
        title={preview?.fileName ?? preview?.label ?? "File"}
        description={preview ? `${preview.label} · ${formatDateLong(preview.date)}` : undefined}
      >
        {preview?.url ? (
          <div className="space-y-3">
            {previewKind === "pdf" || previewKind === "image" ? (
              previewKind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.url}
                  alt={preview.fileName ?? preview.label}
                  className="max-h-[60vh] w-full rounded-[var(--radius)] object-contain bg-bg"
                />
              ) : (
                <iframe
                  title={preview.fileName ?? "PDF"}
                  src={preview.url}
                  className="h-[60vh] w-full rounded-[var(--radius)] border border-border bg-bg"
                />
              )
            ) : (
              <p className="text-[13px] text-ink-secondary">
                Preview isn’t available for this file type. Download to open it locally.
              </p>
            )}
            <Button
              variant="secondary"
              onClick={() => openAttachment(preview.url!, preview.fileName)}
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
