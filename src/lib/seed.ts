import type { AppData } from "./types";

/** Empty starter — no demo/showcase professors, papers, or applications. */
export const seedData: AppData = {
  settings: {
    applicantName: "",
    cycle: "2026–27",
    timezone: "America/New_York",
    accentColor: "forest",
  },
  schools: [],
  programs: [],
  applications: [],
  professors: [],
  professorFits: [],
  researchTopics: [],
  papers: [],
  tasks: [],
  documents: [],
  recommendations: [],
  requirements: [],
  englishTests: [],
  programEnglishRequirements: [],
  emails: [],
  timelineEvents: [],
};
