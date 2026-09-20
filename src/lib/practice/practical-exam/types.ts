import type { PracticePatientFormValues } from "@/lib/practice/patient-schema";

export type PracticalExamSchedulingAnswer = {
  patientName: string;
  provider: string;
  visitType: string;
  date: string;
  time: string;
  location: string;
};

export type PracticalExamPayload = {
  registration: PracticePatientFormValues;
  scheduling: PracticalExamSchedulingAnswer;
  callMedAdvice: string;
  callUpset: string;
  scenarios: Record<string, string>;
  priorityOrder: string[];
  priorityRationale: string;
  commDelay: string;
  commUnclear: string;
  commUnavailable: string;
  mistakeHandling: string;
};

export type PracticalExamSectionScores = {
  registration: number;
  scheduling: number;
  callWorkflow: number;
  adminScenarios: number;
  prioritization: number;
  clientComms: number;
  mistakeHandling: number;
};

export type PracticalExamGradeResult = {
  score: number;
  maxScore: number;
  passed: boolean;
  criticalError: boolean;
  criticalReasons: string[];
  sectionScores: PracticalExamSectionScores;
};

export type PracticalExamAttemptSummary = {
  score: number;
  maxScore: number;
  passed: boolean;
  criticalError: boolean;
  sectionScores: PracticalExamSectionScores;
  submittedAt: string;
};
