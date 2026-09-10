"use client";

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
import { applicationLabel, getProfessor } from "@/lib/selectors";
import { useAppStore, useData } from "@/lib/store";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ResearchPage() {
  const data = useData();
  const createPaper = useAppStore((s) => s.createPaper);
  const createTopic = useAppStore((s) => s.createTopic);
  const router = useRouter();
  const [paperOpen, setPaperOpen] = useState(false);
  const [topicOpen, setTopicOpen] = useState(false);
  const [paperForm, setPaperForm] = useState({
    title: "",
    authors: "",
    venue: "",
    year: String(new Date().getFullYear()),
    url: "",
    topicId: "",
    professorId: "",
    relevance: "8",
    whyMatters: "",
  });
  const [topicForm, setTopicForm] = useState({
    name: "",
    description: "",
  });

  const avgRelevance =
    data.papers.length === 0
      ? 0
      : Math.round(
          (data.papers.reduce((sum, p) => sum + p.relevance, 0) / data.papers.length) * 10,
        ) / 10;

  const onCreatePaper = () => {
    if (!paperForm.title) return;
    const id = createPaper({
      title: paperForm.title,
      authors: paperForm.authors
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      venue: paperForm.venue || "Unknown",
      year: Number(paperForm.year) || new Date().getFullYear(),
      url: paperForm.url || undefined,
      topicIds: paperForm.topicId ? [paperForm.topicId] : [],
      professorIds: paperForm.professorId ? [paperForm.professorId] : [],
      relevance: Number(paperForm.relevance) || 8,
      whyMatters: paperForm.whyMatters || undefined,
    });
    setPaperOpen(false);
    setPaperForm({
      title: "",
      authors: "",
      venue: "",
      year: String(new Date().getFullYear()),
      url: "",
      topicId: "",
      professorId: "",
      relevance: "8",
      whyMatters: "",
    });
    router.push(`/research/papers/${id}`);
  };

  const onCreateTopic = () => {
    if (!topicForm.name) return;
    createTopic({
      name: topicForm.name,
      description: topicForm.description || undefined,
      professorIds: [],
      applicationIds: [],
    });
    setTopicOpen(false);
    setTopicForm({ name: "", description: "" });
  };

  return (
    <div>
      <PageHeader
        title="Research"
        description="Topics, papers, and how they connect to faculty and applications."
        actions={
          <>
            <Button variant="secondary" onClick={() => setTopicOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add Topic
            </Button>
            <Button variant="primary" onClick={() => setPaperOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add Paper
            </Button>
          </>
        }
      />

      <StatStrip
        items={[
          { label: "Topics", value: data.researchTopics.length },
          { label: "Papers", value: data.papers.length, accent: true },
          { label: "Avg Relevance", value: avgRelevance },
          {
            label: "With Faculty",
            value: data.papers.filter((p) => p.professorIds.length > 0).length,
          },
          {
            label: "With Topics",
            value: data.papers.filter((p) => p.topicIds.length > 0).length,
          },
          {
            label: "Apps Linked",
            value: new Set(data.researchTopics.flatMap((t) => t.applicationIds)).size,
          },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Topics" description="Research threads across your cycle">
          {data.researchTopics.length === 0 ? (
            <EmptyState
              title="No topics yet."
              description="Name the research threads that structure your applications."
              actionLabel="Add Topic"
              onAction={() => setTopicOpen(true)}
            />
          ) : (
            <Panel>
              <ul className="divide-y divide-border">
                {data.researchTopics.map((topic) => {
                  const papers = data.papers.filter((p) => p.topicIds.includes(topic.id));
                  const professors = topic.professorIds
                    .map((pid) => getProfessor(data, pid))
                    .filter(Boolean);
                  const apps = topic.applicationIds
                    .map((aid) => data.applications.find((a) => a.id === aid))
                    .filter(Boolean);
                  return (
                    <li key={topic.id} className="px-4 py-3">
                      <div className="text-[13px] font-medium">{topic.name}</div>
                      {topic.description ? (
                        <div className="mt-0.5 text-[12px] text-ink-muted">
                          {topic.description}
                        </div>
                      ) : null}
                      <div className="mt-2 space-y-1 text-[12px] text-ink-secondary">
                        <div>
                          <span className="text-ink-faint">Papers · </span>
                          {papers.length === 0
                            ? "None"
                            : papers.map((p, i) => (
                                <span key={p.id}>
                                  {i > 0 ? ", " : ""}
                                  <Link
                                    href={`/research/papers/${p.id}`}
                                    className="hover:text-accent"
                                  >
                                    {p.title.length > 40
                                      ? `${p.title.slice(0, 40)}…`
                                      : p.title}
                                  </Link>
                                </span>
                              ))}
                        </div>
                        <div>
                          <span className="text-ink-faint">Professors · </span>
                          {professors.length === 0
                            ? "None"
                            : professors.map((p, i) => (
                                <span key={p!.id}>
                                  {i > 0 ? ", " : ""}
                                  <Link
                                    href={`/professors/${p!.id}`}
                                    className="hover:text-accent"
                                  >
                                    {p!.name}
                                  </Link>
                                </span>
                              ))}
                        </div>
                        <div>
                          <span className="text-ink-faint">Applications · </span>
                          {apps.length === 0
                            ? "None"
                            : apps.map((a, i) => (
                                <span key={a!.id}>
                                  {i > 0 ? ", " : ""}
                                  <Link
                                    href={`/applications/${a!.id}`}
                                    className="hover:text-accent"
                                  >
                                    {applicationLabel(data, a!)}
                                  </Link>
                                </span>
                              ))}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}
        </Section>

        <Section title="Papers" description="Reading list with relevance scores">
          {data.papers.length === 0 ? (
            <EmptyState
              title="No papers saved."
              description="Capture papers that shape your research narrative and faculty fit."
              actionLabel="Add Paper"
              onAction={() => setPaperOpen(true)}
            />
          ) : (
            <Panel>
              <ul className="divide-y divide-border">
                {[...data.papers]
                  .sort((a, b) => b.relevance - a.relevance)
                  .map((paper) => (
                    <li key={paper.id}>
                      <Link
                        href={`/research/papers/${paper.id}`}
                        className="block px-4 py-3 hover:bg-bg-hover"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium">{paper.title}</div>
                            <div className="mt-0.5 text-[12px] text-ink-muted">
                              {paper.authors.slice(0, 2).join(", ")}
                              {paper.authors.length > 2 ? " et al." : ""} · {paper.venue}{" "}
                              {paper.year}
                            </div>
                            <div className="mt-1 text-[11px] text-ink-faint">
                              {paper.topicIds
                                .map(
                                  (tid) =>
                                    data.researchTopics.find((t) => t.id === tid)?.name,
                                )
                                .filter(Boolean)
                                .join(" · ") || "Untagged"}
                              {paper.professorIds.length
                                ? ` → ${paper.professorIds
                                    .map((pid) => getProfessor(data, pid)?.name)
                                    .filter(Boolean)
                                    .join(", ")}`
                                : ""}
                            </div>
                          </div>
                          <span className="shrink-0 font-mono text-[12px] tabular-nums text-ink-muted">
                            {paper.relevance}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
              </ul>
            </Panel>
          )}
        </Section>
      </div>

      <Dialog
        open={topicOpen}
        onClose={() => setTopicOpen(false)}
        title="Add Topic"
        description="A research thread that can connect papers, faculty, and apps."
      >
        <div className="space-y-3">
          <Field label="Name">
            <Input
              value={topicForm.name}
              onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
              placeholder="Machine Unlearning"
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={topicForm.description}
              onChange={(e) =>
                setTopicForm({ ...topicForm, description: e.target.value })
              }
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setTopicOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onCreateTopic}>
              Create
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={paperOpen}
        onClose={() => setPaperOpen(false)}
        title="Add Paper"
        description="Save a paper and optionally link topic and faculty."
        wide
      >
        <div className="space-y-3">
          <Field label="Title">
            <Input
              value={paperForm.title}
              onChange={(e) => setPaperForm({ ...paperForm, title: e.target.value })}
            />
          </Field>
          <Field label="Authors">
            <Input
              value={paperForm.authors}
              onChange={(e) => setPaperForm({ ...paperForm, authors: e.target.value })}
              placeholder="Wei Chen, A. Brooks"
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Venue">
              <Input
                value={paperForm.venue}
                onChange={(e) => setPaperForm({ ...paperForm, venue: e.target.value })}
              />
            </Field>
            <Field label="Year">
              <Input
                value={paperForm.year}
                onChange={(e) => setPaperForm({ ...paperForm, year: e.target.value })}
              />
            </Field>
            <Field label="Relevance">
              <Input
                type="number"
                min={1}
                max={10}
                step={0.1}
                value={paperForm.relevance}
                onChange={(e) =>
                  setPaperForm({ ...paperForm, relevance: e.target.value })
                }
              />
            </Field>
          </div>
          <Field label="URL">
            <Input
              value={paperForm.url}
              onChange={(e) => setPaperForm({ ...paperForm, url: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Topic">
              <Select
                value={paperForm.topicId}
                onChange={(e) => setPaperForm({ ...paperForm, topicId: e.target.value })}
              >
                <option value="">None</option>
                {data.researchTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Professor">
              <Select
                value={paperForm.professorId}
                onChange={(e) =>
                  setPaperForm({ ...paperForm, professorId: e.target.value })
                }
              >
                <option value="">None</option>
                {data.professors.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Why it matters">
            <Textarea
              value={paperForm.whyMatters}
              onChange={(e) =>
                setPaperForm({ ...paperForm, whyMatters: e.target.value })
              }
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setPaperOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onCreatePaper}>
              Create
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
