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
import { fitsForProfessor } from "@/lib/selectors";
import { useAppStore, useData } from "@/lib/store";
import { CONTACT_STATUSES, type ContactStatus, type FitPriority } from "@/lib/types";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function ProfessorsPage() {
  const data = useData();
  const createProfessor = useAppStore((s) => s.createProfessor);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [areaFilter, setAreaFilter] = useState("All");
  const [contactFilter, setContactFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [form, setForm] = useState({
    name: "",
    title: "Assistant Professor",
    institution: "",
    email: "",
    website: "",
    researchAreas: "",
    lookingForStudents: true,
    notes: "",
  });

  const areas = useMemo(() => {
    const set = new Set<string>();
    for (const p of data.professors) {
      for (const a of p.researchAreas) set.add(a);
    }
    return [...set].sort();
  }, [data.professors]);

  const highPriority = data.professorFits.filter((f) => f.priority === "High").length;
  const contacted = data.professorFits.filter(
    (f) => f.contactStatus !== "Not Contacted",
  ).length;
  const waiting = data.professorFits.filter(
    (f) => f.contactStatus === "Waiting" || f.contactStatus === "Follow-up Due",
  ).length;
  const looking = data.professors.filter((p) => p.lookingForStudents).length;

  const filtered = useMemo(() => {
    return data.professors.filter((p) => {
      if (areaFilter !== "All" && !p.researchAreas.includes(areaFilter)) return false;
      const fits = fitsForProfessor(data, p.id);
      if (contactFilter !== "All") {
        if (fits.length === 0) return contactFilter === "Not Contacted";
        if (!fits.some((f) => f.contactStatus === contactFilter)) return false;
      }
      if (priorityFilter !== "All") {
        if (!fits.some((f) => f.priority === priorityFilter)) return false;
      }
      return true;
    });
  }, [data, areaFilter, contactFilter, priorityFilter]);

  const onCreate = () => {
    if (!form.name || !form.institution) return;
    const id = createProfessor({
      name: form.name,
      title: form.title,
      institution: form.institution,
      email: form.email || undefined,
      website: form.website || undefined,
      researchAreas: form.researchAreas
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      lookingForStudents: form.lookingForStudents,
      notes: form.notes || undefined,
    });
    setOpen(false);
    setForm({
      name: "",
      title: "Assistant Professor",
      institution: "",
      email: "",
      website: "",
      researchAreas: "",
      lookingForStudents: true,
      notes: "",
    });
    router.push(`/professors/${id}`);
  };

  return (
    <div>
      <PageHeader
        title="Professors"
        description="Academic CRM for faculty fit, outreach, and follow-ups."
        actions={
          <>
            <Link href="/map">
              <Button variant="ghost">Map</Button>
            </Link>
            <Button variant="primary" onClick={() => setOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add Professor
            </Button>
          </>
        }
      />

      <StatStrip
        items={[
          { label: "Total", value: data.professors.length },
          { label: "Recruiting", value: looking, accent: true },
          { label: "High Priority", value: highPriority },
          { label: "Contacted", value: contacted },
          { label: "Waiting", value: waiting, accent: waiting > 0 },
          { label: "Fits", value: data.professorFits.length },
        ]}
      />

      <Section>
        <div className="mb-3 flex flex-wrap gap-2">
          <Select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="w-auto min-w-40"
          >
            <option value="All">All research areas</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
          <Select
            value={contactFilter}
            onChange={(e) => setContactFilter(e.target.value)}
            className="w-auto min-w-36"
          >
            <option value="All">All contact</option>
            {CONTACT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-auto min-w-32"
          >
            <option value="All">All priority</option>
            {(["High", "Medium", "Low"] as FitPriority[]).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No professors match."
            description="Adjust filters, or add a faculty contact you want to track this cycle."
            actionLabel="Add Professor"
            onAction={() => setOpen(true)}
          />
        ) : (
          <Panel className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-[13px]">
              <thead className="border-b border-border text-[11px] uppercase tracking-[0.06em] text-ink-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Professor</th>
                  <th className="px-4 py-2.5 font-medium">Institution</th>
                  <th className="px-4 py-2.5 font-medium">Areas</th>
                  <th className="px-4 py-2.5 font-medium">Apps</th>
                  <th className="px-4 py-2.5 font-medium">Best Fit</th>
                  <th className="px-4 py-2.5 font-medium">Contact</th>
                  <th className="px-4 py-2.5 font-medium">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => {
                  const fits = fitsForProfessor(data, p.id);
                  const best = [...fits].sort((a, b) => b.overallFit - a.overallFit)[0];
                  const contact: ContactStatus =
                    best?.contactStatus ?? "Not Contacted";
                  return (
                    <tr key={p.id} className="hover:bg-bg-hover">
                      <td className="px-4 py-3">
                        <Link
                          href={`/professors/${p.id}`}
                          className="font-medium hover:text-accent"
                        >
                          {p.name}
                        </Link>
                        <div className="text-[12px] text-ink-muted">{p.title}</div>
                      </td>
                      <td className="px-4 py-3 text-ink-secondary">{p.institution}</td>
                      <td className="px-4 py-3 text-ink-secondary">
                        {p.researchAreas.slice(0, 2).join(", ") || "—"}
                        {p.researchAreas.length > 2 ? "…" : ""}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-ink-secondary">
                        {fits.length}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-ink-secondary">
                        {best ? best.overallFit.toFixed(1) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={contact} />
                      </td>
                      <td className="px-4 py-3">
                        {best ? <StatusBadge status={best.priority} /> : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>
        )}
      </Section>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add Professor"
        description="Capture the essentials — fit and outreach live on the detail page."
        wide
      >
        <div className="space-y-3">
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Prof. Wei Chen"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Title">
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field label="Institution">
              <Input
                value={form.institution}
                onChange={(e) => setForm({ ...form, institution: e.target.value })}
                placeholder="Princeton University"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Website">
              <Input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Research areas">
            <Input
              value={form.researchAreas}
              onChange={(e) => setForm({ ...form, researchAreas: e.target.value })}
              placeholder="Machine Unlearning, Privacy"
            />
          </Field>
          <Field label="Notes">
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
          <label className="flex items-center gap-2 text-[13px] text-ink-secondary">
            <input
              type="checkbox"
              checked={form.lookingForStudents}
              onChange={(e) =>
                setForm({ ...form, lookingForStudents: e.target.checked })
              }
            />
            Looking for students
          </label>
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
