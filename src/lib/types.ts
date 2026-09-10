export type ApplicationStatus =
  | "Interested"
  | "Researching"
  | "Preparing"
  | "Ready to Submit"
  | "Submitted"
  | "Interview"
  | "Accepted"
  | "Rejected"
  | "Withdrawn";

export type TaskStatus = "Todo" | "In Progress" | "Done";
export type TaskPriority = "Urgent" | "High" | "Normal" | "Low";
export type ContactStatus =
  | "Not Contacted"
  | "Drafted"
  | "Contacted"
  | "Waiting"
  | "Replied"
  | "Follow-up Due"
  | "Archived";
export type FitPriority = "High" | "Medium" | "Low";
export type DocumentCategory =
  | "SOP"
  | "CV"
  | "Recommendation"
  | "Transcript"
  | "English Test"
  | "Other";
export type DocumentStatus = "Draft" | "Ready" | "Submitted" | "Archived";
export type RecommendationStatus =
  | "Not Requested"
  | "Requested"
  | "Accepted"
  | "Submitted";
export type RequirementStatus = "Missing" | "In Progress" | "Complete" | "Waived";
export type EnglishTestType = "TOEFL" | "IELTS" | "Duolingo" | "Other";
export type TimelineEventType =
  | "application_created"
  | "application_status_changed"
  | "professor_added"
  | "professor_linked"
  | "paper_added"
  | "document_uploaded"
  | "document_version"
  | "email_recorded"
  | "task_completed"
  | "task_created"
  | "recommendation_updated"
  | "note";

export interface School {
  id: string;
  name: string;
  shortName: string;
  location: string;
  website?: string;
}

export interface Program {
  id: string;
  schoolId: string;
  name: string;
  degree: string;
  department: string;
  website?: string;
}

export interface Application {
  id: string;
  schoolId: string;
  programId: string;
  cycle: string;
  status: ApplicationStatus;
  deadline: string;
  funding?: string;
  notes?: string;
  nextActionTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Professor {
  id: string;
  name: string;
  title: string;
  institution: string;
  schoolId?: string;
  email?: string;
  website?: string;
  researchAreas: string[];
  lookingForStudents?: boolean;
  expectations?: string[];
  expectationsSource?: string;
  expectationsUpdatedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface ProfessorFit {
  id: string;
  professorId: string;
  applicationId: string;
  overallFit: number;
  researchAlignment: number;
  recentWork: number;
  methodology: number;
  applicationRelevance: number;
  priority: FitPriority;
  contactStatus: ContactStatus;
  whyFit?: string;
  notes?: string;
  followUpDate?: string;
}

export interface ResearchTopic {
  id: string;
  name: string;
  description?: string;
  professorIds: string[];
  applicationIds: string[];
}

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  venue: string;
  year: number;
  url?: string;
  topicIds: string[];
  professorIds: string[];
  relevance: number;
  whyMatters?: string;
  keyIdea?: string;
  myThoughts?: string;
  potentialConnection?: string;
  notes?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  applicationId?: string;
  professorId?: string;
  documentId?: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface DocumentVersion {
  id: string;
  version: number;
  label: string;
  date: string;
  url?: string;
  notes?: string;
  isCurrent: boolean;
}

export interface Document {
  id: string;
  title: string;
  category: DocumentCategory;
  status: DocumentStatus;
  applicationIds: string[];
  versions: DocumentVersion[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Recommendation {
  id: string;
  recommenderName: string;
  professorId?: string;
  applicationId: string;
  requestDate?: string;
  deadline?: string;
  status: RecommendationStatus;
  notes?: string;
}

export interface Requirement {
  id: string;
  applicationId: string;
  name: string;
  description?: string;
  status: RequirementStatus;
  required: boolean;
  linkedDocumentId?: string;
  category?: string;
}

export interface EnglishTest {
  id: string;
  type: EnglishTestType;
  score?: number;
  date?: string;
  status: "Planned" | "Taken" | "Satisfied" | "Expired";
  notes?: string;
}

export interface ProgramEnglishRequirement {
  id: string;
  programId: string;
  type: EnglishTestType;
  minimum: number;
  required: boolean;
  notes?: string;
}

export interface Email {
  id: string;
  professorId?: string;
  applicationId?: string;
  date: string;
  subject: string;
  sender: string;
  recipient: string;
  content: string;
  status: ContactStatus;
  followUpDate?: string;
  direction: "outbound" | "inbound" | "draft";
}

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  date: string;
  applicationId?: string;
  professorId?: string;
  taskId?: string;
  documentId?: string;
  paperId?: string;
  meta?: Record<string, string>;
}

export interface AppSettings {
  applicantName: string;
  cycle: string;
  timezone: string;
  accentColor: string;
}

export interface AppData {
  schools: School[];
  programs: Program[];
  applications: Application[];
  professors: Professor[];
  professorFits: ProfessorFit[];
  researchTopics: ResearchTopic[];
  papers: Paper[];
  tasks: Task[];
  documents: Document[];
  recommendations: Recommendation[];
  requirements: Requirement[];
  englishTests: EnglishTest[];
  programEnglishRequirements: ProgramEnglishRequirement[];
  emails: Email[];
  timelineEvents: TimelineEvent[];
  settings: AppSettings;
}

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "Interested",
  "Researching",
  "Preparing",
  "Ready to Submit",
  "Submitted",
  "Interview",
  "Accepted",
  "Rejected",
  "Withdrawn",
];

export const BOARD_STATUSES: ApplicationStatus[] = [
  "Interested",
  "Researching",
  "Preparing",
  "Ready to Submit",
  "Submitted",
  "Interview",
];

export const CONTACT_STATUSES: ContactStatus[] = [
  "Not Contacted",
  "Drafted",
  "Contacted",
  "Waiting",
  "Replied",
  "Follow-up Due",
  "Archived",
];
