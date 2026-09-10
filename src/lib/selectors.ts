import type {
  AppData,
  Application,
  ApplicationStatus,
  ContactStatus,
  Document,
  ProfessorFit,
  Recommendation,
  Requirement,
  Task,
} from "./types";
import { clamp, daysUntil } from "./utils";

export function getSchool(data: AppData, schoolId: string) {
  return data.schools.find((s) => s.id === schoolId);
}

export function getProgram(data: AppData, programId: string) {
  return data.programs.find((p) => p.id === programId);
}

export function getApplication(data: AppData, id: string) {
  return data.applications.find((a) => a.id === id);
}

export function getProfessor(data: AppData, id: string) {
  return data.professors.find((p) => p.id === id);
}

export function applicationLabel(data: AppData, app: Application): string {
  const school = getSchool(data, app.schoolId);
  const program = getProgram(data, app.programId);
  return `${school?.shortName ?? "School"} ${program?.name ?? "Program"}`;
}

export function applicationTitle(data: AppData, app: Application): string {
  const school = getSchool(data, app.schoolId);
  return school?.name ?? "Unknown School";
}

export function applicationSubtitle(data: AppData, app: Application): string {
  const program = getProgram(data, app.programId);
  return `${program?.name ?? "Program"} · ${program?.degree ?? "PhD"} · ${app.cycle}`;
}

export function fitsForApplication(data: AppData, applicationId: string): ProfessorFit[] {
  return data.professorFits.filter((f) => f.applicationId === applicationId);
}

export function fitsForProfessor(data: AppData, professorId: string): ProfessorFit[] {
  return data.professorFits.filter((f) => f.professorId === professorId);
}

export function tasksForApplication(data: AppData, applicationId: string): Task[] {
  return data.tasks.filter((t) => t.applicationId === applicationId);
}

export function openTasks(data: AppData): Task[] {
  return data.tasks.filter((t) => t.status !== "Done");
}

export function recommendationsForApplication(
  data: AppData,
  applicationId: string,
): Recommendation[] {
  return data.recommendations.filter((r) => r.applicationId === applicationId);
}

export function requirementsForApplication(
  data: AppData,
  applicationId: string,
): Requirement[] {
  return data.requirements.filter((r) => r.applicationId === applicationId);
}

export function documentsForApplication(data: AppData, applicationId: string): Document[] {
  return data.documents.filter((d) => d.applicationIds.includes(applicationId));
}

export function recommendationProgress(data: AppData, applicationId: string) {
  const recs = recommendationsForApplication(data, applicationId);
  const submitted = recs.filter((r) => r.status === "Submitted").length;
  return { submitted, total: recs.length || 3 };
}

export function applicationProgress(data: AppData, applicationId: string) {
  const app = getApplication(data, applicationId);
  if (!app) return { percent: 0, parts: { research: 0, professors: 0, documents: 0, requirements: 0, submission: 0 } };

  const fits = fitsForApplication(data, applicationId);
  const docs = documentsForApplication(data, applicationId);
  const reqs = requirementsForApplication(data, applicationId);
  const rec = recommendationProgress(data, applicationId);
  const relatedTopics = data.researchTopics.filter((t) =>
    t.applicationIds.includes(applicationId),
  );
  const relatedPapers = data.papers.filter((p) =>
    p.professorIds.some((pid) => fits.some((f) => f.professorId === pid)),
  );

  const research = clamp(
    (relatedTopics.length > 0 ? 40 : 0) +
      (relatedPapers.length >= 2 ? 40 : relatedPapers.length * 20) +
      (app.notes ? 20 : 0),
    0,
    100,
  );

  const professors = clamp(
    fits.length === 0
      ? 0
      : (fits.filter((f) => f.overallFit >= 7).length / Math.max(fits.length, 1)) * 50 +
        (fits.filter((f) => f.contactStatus !== "Not Contacted").length /
          Math.max(fits.length, 1)) *
          50,
    0,
    100,
  );

  const readyDocs = docs.filter((d) => d.status === "Ready" || d.status === "Submitted").length;
  const documents = clamp(
    docs.length === 0 ? 0 : (readyDocs / Math.max(docs.length, 1)) * 100,
    0,
    100,
  );

  const completeReqs = reqs.filter((r) => r.status === "Complete" || r.status === "Waived").length;
  const requirements = clamp(
    reqs.length === 0
      ? (rec.total ? (rec.submitted / rec.total) * 100 : 0)
      : (completeReqs / reqs.length) * 80 + (rec.total ? (rec.submitted / rec.total) * 20 : 20),
    0,
    100,
  );

  const statusWeight: Record<ApplicationStatus, number> = {
    Interested: 5,
    Researching: 15,
    Preparing: 35,
    "Ready to Submit": 70,
    Submitted: 90,
    Interview: 95,
    Accepted: 100,
    Rejected: 100,
    Withdrawn: 100,
  };
  const submission = statusWeight[app.status];

  const percent = Math.round(
    research * 0.15 + professors * 0.2 + documents * 0.25 + requirements * 0.25 + submission * 0.15,
  );

  return {
    percent,
    parts: { research, professors, documents, requirements, submission },
  };
}

export function nextActionForApplication(data: AppData, applicationId: string): Task | null {
  const app = getApplication(data, applicationId);
  if (app?.nextActionTaskId) {
    const pinned = data.tasks.find(
      (t) => t.id === app.nextActionTaskId && t.status !== "Done",
    );
    if (pinned) return pinned;
  }
  const candidates = tasksForApplication(data, applicationId)
    .filter((t) => t.status !== "Done")
    .sort((a, b) => {
      const p = priorityRank(a.priority) - priorityRank(b.priority);
      if (p !== 0) return p;
      return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
    });
  return candidates[0] ?? null;
}

function priorityRank(p: Task["priority"]) {
  return { Urgent: 0, High: 1, Normal: 2, Low: 3 }[p];
}

export type AttentionItem = {
  id: string;
  title: string;
  detail: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  href: string;
  dueDate?: string;
};

export function needsAttention(data: AppData, now = new Date()): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const app of data.applications) {
    if (["Accepted", "Rejected", "Withdrawn"].includes(app.status)) continue;
    const days = daysUntil(app.deadline, now);
    if (days !== null && days < 0) {
      items.push({
        id: `deadline-overdue-${app.id}`,
        title: `Overdue deadline · ${applicationLabel(data, app)}`,
        detail: `${Math.abs(days)} days past deadline`,
        severity: "Critical",
        href: `/applications/${app.id}`,
        dueDate: app.deadline,
      });
    } else if (days !== null && days <= 3) {
      items.push({
        id: `deadline-critical-${app.id}`,
        title: `Deadline in ${days} day${days === 1 ? "" : "s"} · ${applicationLabel(data, app)}`,
        detail: "Application deadline approaching",
        severity: "Critical",
        href: `/applications/${app.id}`,
        dueDate: app.deadline,
      });
    } else if (days !== null && days <= 7) {
      items.push({
        id: `deadline-high-${app.id}`,
        title: `Deadline in ${days} days · ${applicationLabel(data, app)}`,
        detail: "Prepare remaining materials",
        severity: "High",
        href: `/applications/${app.id}`,
        dueDate: app.deadline,
      });
    }

    const missing = requirementsForApplication(data, app.id).filter(
      (r) => r.required && r.status === "Missing",
    );
    for (const req of missing.slice(0, 2)) {
      items.push({
        id: `req-${req.id}`,
        title: `Missing · ${req.name}`,
        detail: applicationLabel(data, app),
        severity: days !== null && days <= 14 ? "High" : "Medium",
        href: `/applications/${app.id}`,
      });
    }
  }

  for (const task of openTasks(data)) {
    const days = daysUntil(task.dueDate, now);
    if (days !== null && days < 0) {
      items.push({
        id: `task-overdue-${task.id}`,
        title: task.title,
        detail: `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`,
        severity: "Critical",
        href: task.applicationId ? `/applications/${task.applicationId}` : "/tasks",
        dueDate: task.dueDate,
      });
    } else if (days === 0) {
      items.push({
        id: `task-today-${task.id}`,
        title: task.title,
        detail: "Due today",
        severity: "High",
        href: task.applicationId ? `/applications/${task.applicationId}` : "/tasks",
        dueDate: task.dueDate,
      });
    }
  }

  for (const fit of data.professorFits) {
    if (fit.contactStatus === "Follow-up Due" || fit.followUpDate) {
      const days = daysUntil(fit.followUpDate, now);
      if (fit.contactStatus === "Follow-up Due" || (days !== null && days <= 0)) {
        const prof = getProfessor(data, fit.professorId);
        items.push({
          id: `followup-${fit.id}`,
          title: `Follow up · ${prof?.name ?? "Professor"}`,
          detail: "Professor outreach follow-up due",
          severity: "High",
          href: `/professors/${fit.professorId}`,
          dueDate: fit.followUpDate,
        });
      }
    }
  }

  const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  return items
    .sort((a, b) => order[a.severity] - order[b.severity])
    .slice(0, 12);
}

export function whatsNext(data: AppData, limit = 5): Task[] {
  return openTasks(data)
    .sort((a, b) => {
      const p = priorityRank(a.priority) - priorityRank(b.priority);
      if (p !== 0) return p;
      return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
    })
    .slice(0, limit);
}

export function statusCounts(data: AppData) {
  const counts: Record<string, number> = {};
  for (const app of data.applications) {
    counts[app.status] = (counts[app.status] ?? 0) + 1;
  }
  return counts;
}

export function isActiveStatus(status: ApplicationStatus) {
  return !["Accepted", "Rejected", "Withdrawn"].includes(status);
}

export function contactLabel(status: ContactStatus) {
  return status;
}

export function currentDocumentVersion(doc: Document) {
  return doc.versions.find((v) => v.isCurrent) ?? doc.versions[doc.versions.length - 1];
}

export function searchAll(data: AppData, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [] as Array<{ type: string; id: string; title: string; subtitle?: string; href: string }>;

  const results: Array<{ type: string; id: string; title: string; subtitle?: string; href: string }> = [];

  for (const app of data.applications) {
    const label = applicationLabel(data, app);
    const school = getSchool(data, app.schoolId);
    if (label.toLowerCase().includes(q) || school?.name.toLowerCase().includes(q)) {
      results.push({
        type: "Applications",
        id: app.id,
        title: label,
        subtitle: app.status,
        href: `/applications/${app.id}`,
      });
    }
  }

  for (const p of data.professors) {
    if (
      p.name.toLowerCase().includes(q) ||
      p.institution.toLowerCase().includes(q) ||
      p.researchAreas.some((a) => a.toLowerCase().includes(q))
    ) {
      results.push({
        type: "Professors",
        id: p.id,
        title: p.name,
        subtitle: p.institution,
        href: `/professors/${p.id}`,
      });
    }
  }

  for (const paper of data.papers) {
    if (paper.title.toLowerCase().includes(q) || paper.authors.some((a) => a.toLowerCase().includes(q))) {
      results.push({
        type: "Papers",
        id: paper.id,
        title: paper.title,
        subtitle: `${paper.venue} ${paper.year}`,
        href: `/research/papers/${paper.id}`,
      });
    }
  }

  for (const task of data.tasks) {
    if (task.title.toLowerCase().includes(q)) {
      results.push({
        type: "Tasks",
        id: task.id,
        title: task.title,
        subtitle: task.status,
        href: "/tasks",
      });
    }
  }

  for (const doc of data.documents) {
    if (doc.title.toLowerCase().includes(q)) {
      results.push({
        type: "Documents",
        id: doc.id,
        title: doc.title,
        subtitle: doc.category,
        href: "/documents",
      });
    }
  }

  for (const email of data.emails) {
    if (email.subject.toLowerCase().includes(q) || email.content.toLowerCase().includes(q)) {
      results.push({
        type: "Emails",
        id: email.id,
        title: email.subject,
        subtitle: email.date,
        href: email.professorId ? `/professors/${email.professorId}` : "/professors",
      });
    }
  }

  for (const topic of data.researchTopics) {
    if (topic.name.toLowerCase().includes(q)) {
      results.push({
        type: "Topics",
        id: topic.id,
        title: topic.name,
        subtitle: "Research topic",
        href: "/research",
      });
    }
  }

  return results.slice(0, 24);
}
