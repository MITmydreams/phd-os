"use client";

import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import {
  EmptyState,
  PageHeader,
  Panel,
  Section,
} from "@/components/ui/panel";
import { applicationLabel, getProfessor } from "@/lib/selectors";
import { useAppStore, useData } from "@/lib/store";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

type NoteFields = {
  whyMatters: string;
  keyIdea: string;
  myThoughts: string;
  potentialConnection: string;
  notes: string;
};

export default function PaperDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const data = useData();
  const updatePaper = useAppStore((s) => s.updatePaper);
  const paper = data.papers.find((p) => p.id === id);
  const [draft, setDraft] = useState<NoteFields | null>(null);

  if (!paper) {
    return (
      <EmptyState
        title="Paper not found."
        description="This paper may have been removed from your reading list."
      />
    );
  }

  const topics = data.researchTopics.filter((t) => paper.topicIds.includes(t.id));
  const professors = paper.professorIds
    .map((pid) => getProfessor(data, pid))
    .filter(Boolean);
  const apps = data.applications.filter((a) =>
    topics.some((t) => t.applicationIds.includes(a.id)),
  );

  const baseline: NoteFields = {
    whyMatters: paper.whyMatters ?? "",
    keyIdea: paper.keyIdea ?? "",
    myThoughts: paper.myThoughts ?? "",
    potentialConnection: paper.potentialConnection ?? "",
    notes: paper.notes ?? "",
  };
  const values = draft ?? baseline;
  const dirty =
    draft !== null &&
    (Object.keys(baseline) as Array<keyof NoteFields>).some(
      (k) => draft[k] !== baseline[k],
    );

  const setField = (key: keyof NoteFields, value: string) => {
    setDraft({ ...(draft ?? baseline), [key]: value });
  };

  return (
    <div>
      <PageHeader
        eyebrow={`${paper.venue} · ${paper.year}`}
        title={paper.title}
        description={`${paper.authors.join(", ")} · Relevance ${paper.relevance}`}
        actions={
          paper.url ? (
            <a
              href={paper.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-border bg-bg-elevated px-3 text-[13px] font-medium text-ink hover:bg-bg-hover"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open paper
            </a>
          ) : null
        }
      />

      <div className="mb-6 flex flex-wrap gap-4 text-[12px] text-ink-secondary">
        <div>
          <span className="text-ink-faint">Topics · </span>
          {topics.length
            ? topics.map((t, i) => (
                <span key={t.id}>
                  {i > 0 ? ", " : ""}
                  <Link href="/research" className="hover:text-accent">
                    {t.name}
                  </Link>
                </span>
              ))
            : "—"}
        </div>
        <div>
          <span className="text-ink-faint">Professors · </span>
          {professors.length
            ? professors.map((p, i) => (
                <span key={p!.id}>
                  {i > 0 ? ", " : ""}
                  <Link href={`/professors/${p!.id}`} className="hover:text-accent">
                    {p!.name}
                  </Link>
                </span>
              ))
            : "—"}
        </div>
        <div>
          <span className="text-ink-faint">Applications · </span>
          {apps.length
            ? apps.map((a, i) => (
                <span key={a.id}>
                  {i > 0 ? ", " : ""}
                  <Link href={`/applications/${a.id}`} className="hover:text-accent">
                    {applicationLabel(data, a)}
                  </Link>
                </span>
              ))
            : "—"}
        </div>
      </div>

      <Section title="Reading notes" description="Capture why this paper matters for your cycle">
        <Panel className="space-y-4 p-4">
          <Field label="Why it matters">
            <Textarea
              value={values.whyMatters}
              onChange={(e) => setField("whyMatters", e.target.value)}
              placeholder="What does this paper unlock for your narrative?"
            />
          </Field>
          <Field label="Key idea">
            <Textarea
              value={values.keyIdea}
              onChange={(e) => setField("keyIdea", e.target.value)}
              placeholder="One-sentence core contribution"
            />
          </Field>
          <Field label="My thoughts">
            <Textarea
              value={values.myThoughts}
              onChange={(e) => setField("myThoughts", e.target.value)}
              placeholder="Critiques, extensions, questions"
            />
          </Field>
          <Field label="Potential connection">
            <Textarea
              value={values.potentialConnection}
              onChange={(e) => setField("potentialConnection", e.target.value)}
              placeholder="How this bridges to a professor or application"
            />
          </Field>
          <Field label="Additional notes">
            <Textarea
              value={values.notes}
              onChange={(e) => setField("notes", e.target.value)}
              className="min-h-28"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" disabled={!draft} onClick={() => setDraft(null)}>
              Discard
            </Button>
            <Button
              variant="primary"
              disabled={!dirty}
              onClick={() => {
                if (!draft) return;
                updatePaper(paper.id, {
                  whyMatters: draft.whyMatters || undefined,
                  keyIdea: draft.keyIdea || undefined,
                  myThoughts: draft.myThoughts || undefined,
                  potentialConnection: draft.potentialConnection || undefined,
                  notes: draft.notes || undefined,
                });
                setDraft(null);
              }}
            >
              Save notes
            </Button>
          </div>
        </Panel>
      </Section>
    </div>
  );
}
