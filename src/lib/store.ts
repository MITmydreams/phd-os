"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { seedData } from "./seed";
import type {
  AppData,
  Application,
  ApplicationStatus,
  ContactStatus,
  Document,
  Email,
  FitPriority,
  Paper,
  Professor,
  ProfessorFit,
  Recommendation,
  ResearchTopic,
  Task,
  TaskPriority,
  TaskStatus,
  TimelineEvent,
} from "./types";
import { todayISO, uid } from "./utils";

type CreateApplicationInput = {
  schoolName: string;
  programName: string;
  degree: string;
  cycle: string;
  deadline: string;
  funding?: string;
};

type Store = AppData & {
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  resetToSeed: () => void;
  replaceData: (data: AppData) => void;
  updateSettings: (partial: Partial<AppData["settings"]>) => void;
  createApplication: (input: CreateApplicationInput) => string;
  updateApplicationStatus: (id: string, status: ApplicationStatus) => void;
  updateApplication: (id: string, partial: Partial<Application>) => void;
  createProfessor: (input: Omit<Professor, "id" | "createdAt">) => string;
  updateProfessor: (id: string, partial: Partial<Professor>) => void;
  linkProfessorToApplication: (input: {
    professorId: string;
    applicationId: string;
    priority: FitPriority;
    whyFit?: string;
    overallFit?: number;
  }) => void;
  updateProfessorFit: (id: string, partial: Partial<ProfessorFit>) => void;
  createTask: (input: Omit<Task, "id" | "createdAt">) => string;
  updateTask: (id: string, partial: Partial<Task>) => void;
  completeTask: (id: string) => void;
  createPaper: (input: Omit<Paper, "id" | "createdAt">) => string;
  updatePaper: (id: string, partial: Partial<Paper>) => void;
  createTopic: (input: Omit<ResearchTopic, "id">) => string;
  createDocument: (input: Omit<Document, "id" | "createdAt" | "updatedAt" | "versions"> & { versionLabel?: string }) => string;
  addDocumentVersion: (documentId: string, label: string, notes?: string) => void;
  recordEmail: (input: Omit<Email, "id">) => string;
  updateRecommendation: (id: string, partial: Partial<Recommendation>) => void;
  addTimelineEvent: (event: Omit<TimelineEvent, "id">) => void;
};

function pushEvent(
  events: TimelineEvent[],
  event: Omit<TimelineEvent, "id">,
): TimelineEvent[] {
  return [{ ...event, id: uid("tl") }, ...events];
}

export const useAppStore = create<Store>()(
  persist(
    (set, get) => ({
      ...seedData,
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),

      resetToSeed: () => set({ ...seedData, hydrated: true }),

      replaceData: (data) => set({ ...data, hydrated: true }),

      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),

      createApplication: (input) => {
        const id = uid("app");
        const schoolId = uid("sch");
        const programId = uid("prg");
        const shortName = input.schoolName.split(" ")[0] ?? input.schoolName;
        set((s) => ({
          schools: [
            ...s.schools,
            {
              id: schoolId,
              name: input.schoolName,
              shortName,
              location: "",
            },
          ],
          programs: [
            ...s.programs,
            {
              id: programId,
              schoolId,
              name: input.programName,
              degree: input.degree,
              department: input.programName,
            },
          ],
          applications: [
            {
              id,
              schoolId,
              programId,
              cycle: input.cycle,
              status: "Interested",
              deadline: input.deadline,
              funding: input.funding,
              createdAt: todayISO(),
              updatedAt: todayISO(),
            },
            ...s.applications,
          ],
          timelineEvents: pushEvent(s.timelineEvents, {
            type: "application_created",
            title: `Added ${shortName} ${input.programName} ${input.degree}`,
            date: todayISO(),
            applicationId: id,
          }),
        }));
        return id;
      },

      updateApplicationStatus: (id, status) => {
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === id ? { ...a, status, updatedAt: todayISO() } : a,
          ),
          timelineEvents: pushEvent(s.timelineEvents, {
            type: "application_status_changed",
            title: `Status → ${status}`,
            date: todayISO(),
            applicationId: id,
            meta: { status },
          }),
        }));
      },

      updateApplication: (id, partial) =>
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === id ? { ...a, ...partial, updatedAt: todayISO() } : a,
          ),
        })),

      createProfessor: (input) => {
        const id = uid("prof");
        set((s) => ({
          professors: [
            { ...input, id, createdAt: todayISO() },
            ...s.professors,
          ],
          timelineEvents: pushEvent(s.timelineEvents, {
            type: "professor_added",
            title: `Added ${input.name}`,
            date: todayISO(),
            professorId: id,
          }),
        }));
        return id;
      },

      updateProfessor: (id, partial) =>
        set((s) => ({
          professors: s.professors.map((p) => (p.id === id ? { ...p, ...partial } : p)),
        })),

      linkProfessorToApplication: ({
        professorId,
        applicationId,
        priority,
        whyFit,
        overallFit = 8,
      }) => {
        const existing = get().professorFits.find(
          (f) => f.professorId === professorId && f.applicationId === applicationId,
        );
        if (existing) {
          set((s) => ({
            professorFits: s.professorFits.map((f) =>
              f.id === existing.id
                ? { ...f, priority, whyFit: whyFit ?? f.whyFit, overallFit }
                : f,
            ),
          }));
          return;
        }
        const id = uid("fit");
        set((s) => ({
          professorFits: [
            {
              id,
              professorId,
              applicationId,
              overallFit,
              researchAlignment: overallFit,
              recentWork: overallFit - 0.2,
              methodology: overallFit - 0.3,
              applicationRelevance: overallFit,
              priority,
              contactStatus: "Not Contacted" as ContactStatus,
              whyFit,
            },
            ...s.professorFits,
          ],
          timelineEvents: pushEvent(s.timelineEvents, {
            type: "professor_linked",
            title: "Linked professor to application",
            date: todayISO(),
            professorId,
            applicationId,
          }),
        }));
      },

      updateProfessorFit: (id, partial) =>
        set((s) => ({
          professorFits: s.professorFits.map((f) =>
            f.id === id ? { ...f, ...partial } : f,
          ),
        })),

      createTask: (input) => {
        const id = uid("task");
        set((s) => ({
          tasks: [{ ...input, id, createdAt: todayISO() }, ...s.tasks],
          timelineEvents: pushEvent(s.timelineEvents, {
            type: "task_created",
            title: input.title,
            date: todayISO(),
            taskId: id,
            applicationId: input.applicationId,
            professorId: input.professorId,
          }),
        }));
        return id;
      },

      updateTask: (id, partial) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...partial } : t)),
        })),

      completeTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? { ...t, status: "Done" as TaskStatus, completedAt: todayISO() }
              : t,
          ),
          timelineEvents: pushEvent(s.timelineEvents, {
            type: "task_completed",
            title: task.title,
            date: todayISO(),
            taskId: id,
            applicationId: task.applicationId,
            professorId: task.professorId,
          }),
        }));
      },

      createPaper: (input) => {
        const id = uid("paper");
        set((s) => ({
          papers: [{ ...input, id, createdAt: todayISO() }, ...s.papers],
          timelineEvents: pushEvent(s.timelineEvents, {
            type: "paper_added",
            title: `Added paper: ${input.title}`,
            date: todayISO(),
            paperId: id,
          }),
        }));
        return id;
      },

      updatePaper: (id, partial) =>
        set((s) => ({
          papers: s.papers.map((p) => (p.id === id ? { ...p, ...partial } : p)),
        })),

      createTopic: (input) => {
        const id = uid("topic");
        set((s) => ({
          researchTopics: [{ ...input, id }, ...s.researchTopics],
        }));
        return id;
      },

      createDocument: (input) => {
        const id = uid("doc");
        const { versionLabel, ...rest } = input;
        set((s) => ({
          documents: [
            {
              ...rest,
              id,
              versions: [
                {
                  id: uid("ver"),
                  version: 1,
                  label: versionLabel ?? "v1",
                  date: todayISO(),
                  isCurrent: true,
                },
              ],
              createdAt: todayISO(),
              updatedAt: todayISO(),
            },
            ...s.documents,
          ],
          timelineEvents: pushEvent(s.timelineEvents, {
            type: "document_uploaded",
            title: `Added document: ${input.title}`,
            date: todayISO(),
            documentId: id,
          }),
        }));
        return id;
      },

      addDocumentVersion: (documentId, label, notes) =>
        set((s) => ({
          documents: s.documents.map((d) => {
            if (d.id !== documentId) return d;
            const nextVersion = Math.max(...d.versions.map((v) => v.version), 0) + 1;
            return {
              ...d,
              updatedAt: todayISO(),
              versions: [
                ...d.versions.map((v) => ({ ...v, isCurrent: false })),
                {
                  id: uid("ver"),
                  version: nextVersion,
                  label,
                  date: todayISO(),
                  notes,
                  isCurrent: true,
                },
              ],
            };
          }),
          timelineEvents: pushEvent(s.timelineEvents, {
            type: "document_version",
            title: `Document version ${label}`,
            date: todayISO(),
            documentId,
          }),
        })),

      recordEmail: (input) => {
        const id = uid("email");
        set((s) => {
          let professorFits = s.professorFits;
          if (input.professorId && input.applicationId) {
            professorFits = s.professorFits.map((f) => {
              if (
                f.professorId === input.professorId &&
                f.applicationId === input.applicationId
              ) {
                return {
                  ...f,
                  contactStatus: input.status,
                  followUpDate: input.followUpDate ?? f.followUpDate,
                };
              }
              return f;
            });
          } else if (input.professorId) {
            professorFits = s.professorFits.map((f) =>
              f.professorId === input.professorId
                ? {
                    ...f,
                    contactStatus: input.status,
                    followUpDate: input.followUpDate ?? f.followUpDate,
                  }
                : f,
            );
          }
          return {
            emails: [ { ...input, id }, ...s.emails],
            professorFits,
            timelineEvents: pushEvent(s.timelineEvents, {
              type: "email_recorded",
              title: input.subject,
              date: input.date,
              professorId: input.professorId,
              applicationId: input.applicationId,
            }),
          };
        });
        return id;
      },

      updateRecommendation: (id, partial) =>
        set((s) => ({
          recommendations: s.recommendations.map((r) =>
            r.id === id ? { ...r, ...partial } : r,
          ),
          timelineEvents: pushEvent(s.timelineEvents, {
            type: "recommendation_updated",
            title: "Recommendation updated",
            date: todayISO(),
            meta: partial.status ? { status: partial.status } : undefined,
          }),
        })),

      addTimelineEvent: (event) =>
        set((s) => ({
          timelineEvents: pushEvent(s.timelineEvents, event),
        })),
    }),
    {
      name: "phd-os-data",
      partialize: (s) => {
        const {
          hydrated,
          setHydrated,
          resetToSeed,
          replaceData,
          updateSettings,
          createApplication,
          updateApplicationStatus,
          updateApplication,
          createProfessor,
          updateProfessor,
          linkProfessorToApplication,
          updateProfessorFit,
          createTask,
          updateTask,
          completeTask,
          createPaper,
          updatePaper,
          createTopic,
          createDocument,
          addDocumentVersion,
          recordEmail,
          updateRecommendation,
          addTimelineEvent,
          ...data
        } = s;
        return data;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export function useData(): AppData {
  const s = useAppStore();
  return {
    schools: s.schools,
    programs: s.programs,
    applications: s.applications,
    professors: s.professors,
    professorFits: s.professorFits,
    researchTopics: s.researchTopics,
    papers: s.papers,
    tasks: s.tasks,
    documents: s.documents,
    recommendations: s.recommendations,
    requirements: s.requirements,
    englishTests: s.englishTests,
    programEnglishRequirements: s.programEnglishRequirements,
    emails: s.emails,
    timelineEvents: s.timelineEvents,
    settings: s.settings,
  };
}

export type { TaskPriority };
