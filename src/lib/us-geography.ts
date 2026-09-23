import type { Professor } from "./types";

/** FIPS → USPS state code */
export const FIPS_TO_STATE: Record<string, string> = {
  "01": "AL",
  "02": "AK",
  "04": "AZ",
  "05": "AR",
  "06": "CA",
  "08": "CO",
  "09": "CT",
  "10": "DE",
  "11": "DC",
  "12": "FL",
  "13": "GA",
  "15": "HI",
  "16": "ID",
  "17": "IL",
  "18": "IN",
  "19": "IA",
  "20": "KS",
  "21": "KY",
  "22": "LA",
  "23": "ME",
  "24": "MD",
  "25": "MA",
  "26": "MI",
  "27": "MN",
  "28": "MS",
  "29": "MO",
  "30": "MT",
  "31": "NE",
  "32": "NV",
  "33": "NH",
  "34": "NJ",
  "35": "NM",
  "36": "NY",
  "37": "NC",
  "38": "ND",
  "39": "OH",
  "40": "OK",
  "41": "OR",
  "42": "PA",
  "44": "RI",
  "45": "SC",
  "46": "SD",
  "47": "TN",
  "48": "TX",
  "49": "UT",
  "50": "VT",
  "51": "VA",
  "53": "WA",
  "54": "WV",
  "55": "WI",
  "56": "WY",
};

export const STATE_NAMES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District of Columbia",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

/** Special buckets for professors outside the continental map. */
export const OUTSIDE_US = "OUTSIDE_US";
export const UNKNOWN_REGION = "UNKNOWN";

type RegionCode = string;

/**
 * Known university / institution → US state (or OUTSIDE_US).
 * Matched case-insensitively as substring against institution text.
 * Longer / more specific keys should be listed first where ambiguity exists.
 */
const INSTITUTION_STATE_RULES: Array<{ match: string; state: RegionCode }> = [
  // California
  { match: "stanford", state: "CA" },
  { match: "berkeley", state: "CA" },
  { match: "caltech", state: "CA" },
  { match: "california institute of technology", state: "CA" },
  { match: "ucla", state: "CA" },
  { match: "uc san diego", state: "CA" },
  { match: "ucsd", state: "CA" },
  { match: "uc santa barbara", state: "CA" },
  { match: "ucsb", state: "CA" },
  { match: "uc irvine", state: "CA" },
  { match: "uci", state: "CA" },
  { match: "uc davis", state: "CA" },
  { match: "uc santa cruz", state: "CA" },
  { match: "usc", state: "CA" },
  { match: "university of southern california", state: "CA" },
  { match: "carnegie mellon silicon valley", state: "CA" },

  // Massachusetts
  { match: "massachusetts institute of technology", state: "MA" },
  { match: "mit", state: "MA" },
  { match: "harvard", state: "MA" },
  { match: "boston university", state: "MA" },
  { match: "northeastern university", state: "MA" },
  { match: "tufts", state: "MA" },
  { match: "umass", state: "MA" },
  { match: "university of massachusetts", state: "MA" },

  // New York
  { match: "columbia", state: "NY" },
  { match: "cornell tech", state: "NY" },
  { match: "cornell", state: "NY" },
  { match: "nyu", state: "NY" },
  { match: "new york university", state: "NY" },
  { match: "rochester", state: "NY" },
  { match: "stony brook", state: "NY" },
  { match: "buffalo", state: "NY" },

  // Connecticut
  { match: "yale", state: "CT" },

  // New Jersey
  { match: "princeton", state: "NJ" },
  { match: "rutgers", state: "NJ" },
  { match: "stevens institute", state: "NJ" },

  // Pennsylvania
  { match: "carnegie mellon", state: "PA" },
  { match: "cmu", state: "PA" },
  { match: "upenn", state: "PA" },
  { match: "university of pennsylvania", state: "PA" },
  { match: "penn state", state: "PA" },
  { match: "pittsburgh", state: "PA" },

  // Illinois
  { match: "northwestern", state: "IL" },
  { match: "university of chicago", state: "IL" },
  { match: "uchicago", state: "IL" },
  { match: "uiuc", state: "IL" },
  { match: "illinois urbana", state: "IL" },
  { match: "university of illinois", state: "IL" },

  // Indiana
  { match: "purdue", state: "IN" },
  { match: "indiana university", state: "IN" },
  { match: "notre dame", state: "IN" },

  // Texas
  { match: "ut dallas", state: "TX" },
  { match: "university of texas at dallas", state: "TX" },
  { match: "ut austin", state: "TX" },
  { match: "university of texas at austin", state: "TX" },
  { match: "texas a&m", state: "TX" },
  { match: "rice university", state: "TX" },
  { match: "rice ", state: "TX" },

  // Washington
  { match: "university of washington", state: "WA" },
  { match: "uw seattle", state: "WA" },

  // Georgia
  { match: "georgia tech", state: "GA" },
  { match: "georgia institute of technology", state: "GA" },
  { match: "emory", state: "GA" },

  // Maryland / DC / Virginia
  { match: "johns hopkins", state: "MD" },
  { match: "university of maryland", state: "MD" },
  { match: "umd", state: "MD" },
  { match: "george washington", state: "DC" },
  { match: "georgetown", state: "DC" },
  { match: "virginia tech", state: "VA" },
  { match: "university of virginia", state: "VA" },

  // Michigan
  { match: "university of michigan", state: "MI" },
  { match: "michigan state", state: "MI" },
  { match: "wayne state", state: "MI" },

  // Wisconsin / Minnesota / Ohio
  { match: "university of wisconsin", state: "WI" },
  { match: "university of minnesota", state: "MN" },
  { match: "ohio state", state: "OH" },
  { match: "case western", state: "OH" },

  // Colorado / Arizona / Oregon / Utah
  { match: "university of colorado", state: "CO" },
  { match: "arizona state", state: "AZ" },
  { match: "university of arizona", state: "AZ" },
  { match: "oregon state", state: "OR" },
  { match: "university of oregon", state: "OR" },
  { match: "university of utah", state: "UT" },

  // North Carolina
  { match: "duke", state: "NC" },
  { match: "unc chapel", state: "NC" },
  { match: "university of north carolina", state: "NC" },
  { match: "nc state", state: "NC" },

  // Florida
  { match: "university of florida", state: "FL" },
  { match: "florida state", state: "FL" },
  { match: "university of miami", state: "FL" },

  // Outside US (common international)
  { match: "hong kong", state: OUTSIDE_US },
  { match: "hkbu", state: OUTSIDE_US },
  { match: "pku", state: OUTSIDE_US },
  { match: "peking", state: OUTSIDE_US },
  { match: "tsinghua", state: OUTSIDE_US },
  { match: "university of toronto", state: OUTSIDE_US },
  { match: "mcgill", state: OUTSIDE_US },
  { match: "oxford", state: OUTSIDE_US },
  { match: "cambridge", state: OUTSIDE_US },
  { match: "eth zurich", state: OUTSIDE_US },
  { match: "epfl", state: OUTSIDE_US },
  { match: "national university of singapore", state: OUTSIDE_US },
  { match: "nus", state: OUTSIDE_US },
  { match: "kaist", state: OUTSIDE_US },
  { match: "tokyo", state: OUTSIDE_US },
  { match: "seoul", state: OUTSIDE_US },
  { match: "beijing", state: OUTSIDE_US },
  { match: "shanghai", state: OUTSIDE_US },
  { match: "london", state: OUTSIDE_US },
  { match: "edinburgh", state: OUTSIDE_US },
  { match: "australian national", state: OUTSIDE_US },
  { match: "university of melbourne", state: OUTSIDE_US },
];

const STATE_CODE_SET = new Set(Object.keys(STATE_NAMES));

const STATE_NAME_PATTERN = Object.entries(STATE_NAMES)
  .sort((a, b) => b[1].length - a[1].length)
  .map(([code, name]) => ({ code, re: new RegExp(`\\b${name.replace(/\s+/g, "\\s+")}\\b`, "i") }));

/** Resolve a free-text institution string to a US state code, OUTSIDE_US, or UNKNOWN. */
export function resolveInstitutionRegion(institution: string): RegionCode {
  const raw = institution.trim();
  if (!raw) return UNKNOWN_REGION;
  const lower = raw.toLowerCase();

  // Explicit ", CA" / " CA" / "(CA)" style abbreviations
  const abbr = raw.match(/[,\s(]([A-Z]{2})\)?\s*$/);
  if (abbr && STATE_CODE_SET.has(abbr[1])) return abbr[1];

  // Full state name in the string
  for (const { code, re } of STATE_NAME_PATTERN) {
    if (re.test(raw)) return code;
  }

  // Known institutions
  for (const rule of INSTITUTION_STATE_RULES) {
    if (lower.includes(rule.match)) {
      // Dual appointments: prefer US campus when both appear
      if (rule.state === OUTSIDE_US && /northwestern|stanford|yale|mit|harvard/i.test(raw)) {
        continue;
      }
      return rule.state;
    }
  }

  // Heuristic: non-ASCII / known country words → outside
  if (
    /university of (hong kong|tokyo|toronto|oxford|cambridge|edinburgh|melbourne|sydney)/i.test(
      raw,
    ) ||
    /\b(china|japan|korea|singapore|canada|uk|england|germany|france|switzerland|australia)\b/i.test(
      lower,
    )
  ) {
    return OUTSIDE_US;
  }

  return UNKNOWN_REGION;
}

export function regionLabel(code: RegionCode): string {
  if (code === OUTSIDE_US) return "Outside the U.S.";
  if (code === UNKNOWN_REGION) return "Unknown location";
  return STATE_NAMES[code] ?? code;
}

export type ProfessorRegionGroup = {
  code: RegionCode;
  label: string;
  professors: Professor[];
};

export function groupProfessorsByRegion(
  professors: Professor[],
): {
  byState: Map<string, Professor[]>;
  outside: Professor[];
  unknown: Professor[];
  groups: ProfessorRegionGroup[];
} {
  const byState = new Map<string, Professor[]>();
  const outside: Professor[] = [];
  const unknown: Professor[] = [];

  for (const p of professors) {
    const code = resolveInstitutionRegion(p.institution);
    if (code === OUTSIDE_US) {
      outside.push(p);
      continue;
    }
    if (code === UNKNOWN_REGION) {
      unknown.push(p);
      continue;
    }
    const list = byState.get(code) ?? [];
    list.push(p);
    byState.set(code, list);
  }

  const groups: ProfessorRegionGroup[] = [
    ...[...byState.entries()]
      .map(([code, list]) => ({
        code,
        label: regionLabel(code),
        professors: list.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => b.professors.length - a.professors.length || a.label.localeCompare(b.label)),
  ];

  if (outside.length) {
    groups.push({
      code: OUTSIDE_US,
      label: regionLabel(OUTSIDE_US),
      professors: outside.sort((a, b) => a.name.localeCompare(b.name)),
    });
  }
  if (unknown.length) {
    groups.push({
      code: UNKNOWN_REGION,
      label: regionLabel(UNKNOWN_REGION),
      professors: unknown.sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  return { byState, outside, unknown, groups };
}
