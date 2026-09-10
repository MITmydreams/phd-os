import type { AppData } from "./types";

const KEYS: (keyof AppData)[] = [
  "schools",
  "programs",
  "applications",
  "professors",
  "professorFits",
  "researchTopics",
  "papers",
  "tasks",
  "documents",
  "recommendations",
  "requirements",
  "englishTests",
  "programEnglishRequirements",
  "emails",
  "timelineEvents",
  "settings",
];

export function pickAppData(source: AppData): AppData {
  const out = {} as AppData;
  for (const key of KEYS) {
    out[key] = source[key] as never;
  }
  return out;
}

export function isAppData(value: unknown): value is AppData {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return KEYS.every((key) => key in v);
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
