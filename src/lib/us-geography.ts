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
  { match: "chicago state", state: "IL" },
  { match: "northwestern", state: "IL" },
  { match: "university of chicago", state: "IL" },
  { match: "uchicago", state: "IL" },
  { match: "uiuc", state: "IL" },
  { match: "illinois urbana", state: "IL" },
  { match: "university of illinois", state: "IL" },
  { match: "illinois institute of technology", state: "IL" },
  { match: "depaul", state: "IL" },
  { match: "loyola university chicago", state: "IL" },

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

  const campus = resolveCampus(raw);
  if (campus) return campus.state;

  const lower = raw.toLowerCase();

  // Explicit ", CA" / " CA" / "(CA)" style abbreviations
  const abbr = raw.match(/[,\s(]([A-Z]{2})\)?\s*$/);
  if (abbr && STATE_CODE_SET.has(abbr[1])) return abbr[1];

  // Full state name in the string
  for (const { code, re } of STATE_NAME_PATTERN) {
    if (re.test(raw)) return code;
  }

  // Known institutions (state only, no pin yet)
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

/** Known campus coordinates for state drill-down pins (lat/lng WGS84). */
export type CampusPin = {
  id: string;
  match: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
};

/**
 * Longer / more specific `match` values win. Keep in sync with state rules above.
 */
export const CAMPUS_PINS: CampusPin[] = [
  // California
  { id: "stanford", match: "stanford", name: "Stanford University", city: "Stanford", state: "CA", lat: 37.4275, lng: -122.1697 },
  { id: "berkeley", match: "berkeley", name: "UC Berkeley", city: "Berkeley", state: "CA", lat: 37.8719, lng: -122.2585 },
  { id: "ucla", match: "ucla", name: "UCLA", city: "Los Angeles", state: "CA", lat: 34.0689, lng: -118.4452 },
  { id: "caltech", match: "caltech", name: "Caltech", city: "Pasadena", state: "CA", lat: 34.1377, lng: -118.1253 },
  { id: "usc", match: "university of southern california", name: "USC", city: "Los Angeles", state: "CA", lat: 34.0224, lng: -118.2851 },

  // Massachusetts
  { id: "mit", match: "massachusetts institute of technology", name: "MIT", city: "Cambridge", state: "MA", lat: 42.3601, lng: -71.0942 },
  { id: "harvard", match: "harvard", name: "Harvard University", city: "Cambridge", state: "MA", lat: 42.3770, lng: -71.1167 },

  // Connecticut
  { id: "yale", match: "yale", name: "Yale University", city: "New Haven", state: "CT", lat: 41.3163, lng: -72.9223 },

  // New Jersey
  { id: "princeton", match: "princeton", name: "Princeton University", city: "Princeton", state: "NJ", lat: 40.3431, lng: -74.6551 },
  { id: "rutgers", match: "rutgers", name: "Rutgers University", city: "New Brunswick", state: "NJ", lat: 40.5008, lng: -74.4474 },

  // Pennsylvania
  { id: "cmu", match: "carnegie mellon", name: "Carnegie Mellon", city: "Pittsburgh", state: "PA", lat: 40.4433, lng: -79.9436 },
  { id: "upenn", match: "university of pennsylvania", name: "UPenn", city: "Philadelphia", state: "PA", lat: 39.9522, lng: -75.1932 },

  // New York
  { id: "columbia", match: "columbia", name: "Columbia University", city: "New York", state: "NY", lat: 40.8075, lng: -73.9626 },
  { id: "cornell", match: "cornell", name: "Cornell University", city: "Ithaca", state: "NY", lat: 42.4534, lng: -76.4735 },
  { id: "nyu", match: "new york university", name: "NYU", city: "New York", state: "NY", lat: 40.7295, lng: -73.9965 },

  // Illinois
  { id: "chicago_state", match: "chicago state", name: "Chicago State University", city: "Chicago", state: "IL", lat: 41.7185, lng: -87.6097 },
  { id: "northwestern", match: "northwestern", name: "Northwestern University", city: "Evanston", state: "IL", lat: 42.0565, lng: -87.6753 },
  { id: "uchicago", match: "university of chicago", name: "University of Chicago", city: "Chicago", state: "IL", lat: 41.7886, lng: -87.5987 },
  { id: "uiuc", match: "illinois urbana", name: "UIUC", city: "Urbana-Champaign", state: "IL", lat: 40.1020, lng: -88.2272 },
  { id: "uiuc2", match: "uiuc", name: "UIUC", city: "Urbana-Champaign", state: "IL", lat: 40.1020, lng: -88.2272 },
  { id: "iit", match: "illinois institute of technology", name: "Illinois Tech", city: "Chicago", state: "IL", lat: 41.8350, lng: -87.6272 },

  // Indiana
  { id: "purdue", match: "purdue", name: "Purdue University", city: "West Lafayette", state: "IN", lat: 40.4237, lng: -86.9212 },
  { id: "notre_dame", match: "notre dame", name: "Notre Dame", city: "Notre Dame", state: "IN", lat: 41.7056, lng: -86.2353 },

  // Texas
  { id: "utd", match: "university of texas at dallas", name: "UT Dallas", city: "Richardson", state: "TX", lat: 32.9857, lng: -96.7502 },
  { id: "utd2", match: "ut dallas", name: "UT Dallas", city: "Richardson", state: "TX", lat: 32.9857, lng: -96.7502 },
  { id: "utaustin", match: "university of texas at austin", name: "UT Austin", city: "Austin", state: "TX", lat: 30.2849, lng: -97.7341 },
  { id: "rice", match: "rice university", name: "Rice University", city: "Houston", state: "TX", lat: 29.7174, lng: -95.4018 },

  // Michigan
  { id: "umich", match: "university of michigan", name: "University of Michigan", city: "Ann Arbor", state: "MI", lat: 42.2780, lng: -83.7382 },
  { id: "msu", match: "michigan state", name: "Michigan State", city: "East Lansing", state: "MI", lat: 42.7018, lng: -84.4822 },
  { id: "wayne", match: "wayne state", name: "Wayne State University", city: "Detroit", state: "MI", lat: 42.3573, lng: -83.0703 },

  // Wisconsin
  { id: "uwmadison", match: "university of wisconsin", name: "UW–Madison", city: "Madison", state: "WI", lat: 43.0766, lng: -89.4125 },

  // Washington
  { id: "uw", match: "university of washington", name: "University of Washington", city: "Seattle", state: "WA", lat: 47.6553, lng: -122.3035 },

  // Georgia
  { id: "gatech", match: "georgia tech", name: "Georgia Tech", city: "Atlanta", state: "GA", lat: 33.7756, lng: -84.3963 },
  { id: "gatech2", match: "georgia institute of technology", name: "Georgia Tech", city: "Atlanta", state: "GA", lat: 33.7756, lng: -84.3963 },

  // North Carolina
  { id: "duke", match: "duke", name: "Duke University", city: "Durham", state: "NC", lat: 36.0014, lng: -78.9382 },

  // Maryland
  { id: "jhu", match: "johns hopkins", name: "Johns Hopkins", city: "Baltimore", state: "MD", lat: 39.3299, lng: -76.6205 },
];

const CAMPUS_PINS_SORTED = [...CAMPUS_PINS].sort(
  (a, b) => b.match.length - a.match.length,
);

/** Match an institution string to a known campus pin (for map markers). */
export function resolveCampus(institution: string): CampusPin | null {
  const lower = institution.trim().toLowerCase();
  if (!lower) return null;

  // Prefer US campus when dual appointment lists an international school too
  const preferUs = /northwestern|stanford|yale|mit|harvard|chicago state|wayne state/i.test(
    institution,
  );

  for (const campus of CAMPUS_PINS_SORTED) {
    if (!lower.includes(campus.match)) continue;
    if (preferUs && campus.state === OUTSIDE_US) continue;
    return campus;
  }
  return null;
}

export type CampusProfessorGroup = {
  campus: CampusPin;
  professors: Professor[];
};

/** Group professors in a US state by resolved campus pin. */
export function groupProfessorsByCampus(
  professors: Professor[],
  stateCode: string,
): {
  located: CampusProfessorGroup[];
  unresolved: Professor[];
} {
  const map = new Map<string, CampusProfessorGroup>();
  const unresolved: Professor[] = [];

  for (const p of professors) {
    const campus = resolveCampus(p.institution);
    if (!campus || campus.state !== stateCode) {
      unresolved.push(p);
      continue;
    }
    const existing = map.get(campus.id);
    if (existing) {
      existing.professors.push(p);
    } else {
      map.set(campus.id, { campus, professors: [p] });
    }
  }

  const located = [...map.values()]
    .map((g) => ({
      ...g,
      professors: g.professors.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.campus.name.localeCompare(b.campus.name));

  return { located, unresolved };
}

/** Approximate state view centers for empty / fallback framing. */
export const STATE_VIEW: Record<string, { lat: number; lng: number; zoom: number }> = {
  AL: { lat: 32.8, lng: -86.8, zoom: 7 },
  AK: { lat: 64.2, lng: -153.0, zoom: 4 },
  AZ: { lat: 34.2, lng: -111.6, zoom: 7 },
  AR: { lat: 34.8, lng: -92.2, zoom: 7 },
  CA: { lat: 37.2, lng: -119.5, zoom: 6 },
  CO: { lat: 39.0, lng: -105.5, zoom: 7 },
  CT: { lat: 41.6, lng: -72.7, zoom: 9 },
  DE: { lat: 39.0, lng: -75.5, zoom: 9 },
  DC: { lat: 38.9, lng: -77.0, zoom: 11 },
  FL: { lat: 27.8, lng: -81.7, zoom: 7 },
  GA: { lat: 32.7, lng: -83.4, zoom: 7 },
  HI: { lat: 20.8, lng: -157.0, zoom: 7 },
  ID: { lat: 44.4, lng: -114.5, zoom: 6 },
  IL: { lat: 40.0, lng: -89.2, zoom: 7 },
  IN: { lat: 39.9, lng: -86.3, zoom: 7 },
  IA: { lat: 42.0, lng: -93.5, zoom: 7 },
  KS: { lat: 38.5, lng: -98.3, zoom: 7 },
  KY: { lat: 37.8, lng: -85.3, zoom: 7 },
  LA: { lat: 31.0, lng: -92.0, zoom: 7 },
  ME: { lat: 45.3, lng: -69.2, zoom: 7 },
  MD: { lat: 39.1, lng: -76.8, zoom: 8 },
  MA: { lat: 42.2, lng: -71.8, zoom: 8 },
  MI: { lat: 44.3, lng: -85.4, zoom: 6 },
  MN: { lat: 46.3, lng: -94.3, zoom: 6 },
  MS: { lat: 32.7, lng: -89.7, zoom: 7 },
  MO: { lat: 38.4, lng: -92.5, zoom: 7 },
  MT: { lat: 46.8, lng: -110.0, zoom: 6 },
  NE: { lat: 41.5, lng: -99.8, zoom: 7 },
  NV: { lat: 39.3, lng: -116.6, zoom: 6 },
  NH: { lat: 43.7, lng: -71.6, zoom: 8 },
  NJ: { lat: 40.2, lng: -74.6, zoom: 8 },
  NM: { lat: 34.4, lng: -106.1, zoom: 7 },
  NY: { lat: 42.9, lng: -75.5, zoom: 7 },
  NC: { lat: 35.5, lng: -79.4, zoom: 7 },
  ND: { lat: 47.5, lng: -100.5, zoom: 7 },
  OH: { lat: 40.3, lng: -82.8, zoom: 7 },
  OK: { lat: 35.5, lng: -97.5, zoom: 7 },
  OR: { lat: 44.0, lng: -120.5, zoom: 7 },
  PA: { lat: 40.9, lng: -77.8, zoom: 7 },
  RI: { lat: 41.7, lng: -71.6, zoom: 10 },
  SC: { lat: 33.9, lng: -80.9, zoom: 7 },
  SD: { lat: 44.4, lng: -100.2, zoom: 7 },
  TN: { lat: 35.8, lng: -86.3, zoom: 7 },
  TX: { lat: 31.3, lng: -99.3, zoom: 6 },
  UT: { lat: 39.3, lng: -111.7, zoom: 7 },
  VT: { lat: 44.1, lng: -72.7, zoom: 8 },
  VA: { lat: 37.5, lng: -78.6, zoom: 7 },
  WA: { lat: 47.4, lng: -120.5, zoom: 7 },
  WV: { lat: 38.6, lng: -80.6, zoom: 7 },
  WI: { lat: 44.5, lng: -89.7, zoom: 7 },
  WY: { lat: 43.0, lng: -107.5, zoom: 6 },
};
