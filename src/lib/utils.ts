export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function formatDate(iso?: string, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", opts ?? { month: "short", day: "numeric" });
}

export function formatDateLong(iso?: string): string {
  return formatDate(iso, { month: "short", day: "numeric", year: "numeric" });
}

export function daysUntil(iso?: string, from = new Date()): number | null {
  if (!iso) return null;
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function todayISO(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function addDaysISO(days: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Compact school label for dropdowns / cards.
 * Avoids the old bug of taking only the first word ("University of …" → "University").
 */
export function deriveShortName(schoolName: string): string {
  const n = schoolName.trim().replace(/\s+/g, " ");
  if (!n) return "School";

  const known: Array<[RegExp, string]> = [
    [/^massachusetts institute of technology$/i, "MIT"],
    [/^california institute of technology$/i, "Caltech"],
    [/^georgia institute of technology$/i, "Georgia Tech"],
    [/^carnegie mellon university$/i, "CMU"],
    [/^new york university$/i, "NYU"],
    [/^university of california,?\s*berkeley$/i, "UC Berkeley"],
    [/^university of california,?\s*los angeles$/i, "UCLA"],
    [/^university of california,?\s*san diego$/i, "UCSD"],
    [/^university of california,?\s*santa barbara$/i, "UCSB"],
    [/^university of california,?\s*santa cruz$/i, "UCSC"],
    [/^university of california,?\s*irvine$/i, "UCI"],
    [/^university of california,?\s*davis$/i, "UC Davis"],
    [/^university of california,?\s*riverside$/i, "UCR"],
    [/^university of california,?\s*merced$/i, "UC Merced"],
    [/^university of california,?\s*san francisco$/i, "UCSF"],
    [/^university of illinois(?: at |,? )?urbana[- ]?champaign$/i, "UIUC"],
    [/^university of wisconsin[-–]?madison$/i, "UW–Madison"],
    [/^university of washington$/i, "UW"],
    [/^university of michigan$/i, "UMich"],
    [/^university of texas at austin$/i, "UT Austin"],
    [/^university of texas at dallas$/i, "UT Dallas"],
    [/^university of north carolina at charlotte$/i, "UNC Charlotte"],
    [/^university of north carolina at chapel hill$/i, "UNC Chapel Hill"],
    [/^pennsylvania state university$/i, "Penn State"],
    [/^ohio state university$/i, "Ohio State"],
  ];
  for (const [re, label] of known) {
    if (re.test(n)) return label;
  }

  const uc = n.match(/^University of California,?\s+(.+)$/i);
  if (uc) return `UC ${uc[1].trim()}`;

  const uof = n.match(/^University of (.+)$/i);
  if (uof) {
    const rest = uof[1].trim();
    if (rest.length <= 22) return rest;
    return rest.split(",")[0].trim();
  }

  const beforeUni = n.match(/^(.+?)\s+University$/i);
  if (beforeUni) {
    const head = beforeUni[1].trim();
    if (head.length <= 24) return head;
  }

  const beforeCollege = n.match(/^(.+?)\s+College$/i);
  if (beforeCollege && beforeCollege[1].trim().length <= 24) {
    return beforeCollege[1].trim();
  }

  if (n.length <= 28) return n;
  const words = n.split(" ");
  if (words.length <= 4) return n;
  return words.slice(0, 3).join(" ");
}

/** Prefer a usable shortName; fall back to deriving from the full school name. */
export function schoolShortLabel(school?: {
  name: string;
  shortName: string;
} | null): string {
  if (!school) return "School";
  const short = school.shortName?.trim() ?? "";
  const name = school.name?.trim() ?? "";
  if (!short || /^(university|the|college|institute)$/i.test(short)) {
    return deriveShortName(name || short);
  }
  // Legacy bug: shortName was only the first word of a longer name
  const first = name.split(/\s+/)[0] ?? "";
  if (name.split(/\s+/).length > 2 && short === first) {
    return deriveShortName(name);
  }
  return short;
}
