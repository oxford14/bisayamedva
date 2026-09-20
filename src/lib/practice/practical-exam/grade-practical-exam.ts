import {
  EXAM_REGISTRATION_GOLDEN,
  EXAM_VALID_SCHEDULING,
  PRIORITY_IDEAL_ORDER,
} from "@/lib/practice/practical-exam/exam-fixtures";
import {
  ADMIN_SCENARIO_QUESTIONS,
  CALL_MED_ADVICE_OPTIONS,
  CALL_UPSET_OPTIONS,
  MISTAKE_HANDLING_OPTIONS,
  PRACTICAL_PASS_SCORE,
} from "@/lib/practice/practical-exam/rubrics";
import type {
  PracticalExamGradeResult,
  PracticalExamPayload,
  PracticalExamSectionScores,
} from "@/lib/practice/practical-exam/types";

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function normPhone(s: string) {
  return s.replace(/\D/g, "");
}

function normDate(s: string) {
  const t = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const d = new Date(t);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return norm(t);
}

function scoreRegistration(payload: PracticalExamPayload): number {
  const g = EXAM_REGISTRATION_GOLDEN;
  const r = payload.registration;
  const fields: boolean[] = [
    norm(r.legalFirstName) === norm(g.legalFirstName),
    norm(r.legalMiddleName) === norm(g.legalMiddleName),
    norm(r.legalLastName) === norm(g.legalLastName),
    normDate(r.dateOfBirth) === g.dateOfBirth,
    norm(r.sexAtBirth) === norm(g.sexAtBirth),
    normPhone(r.phone) === normPhone(g.phone),
    norm(r.email) === norm(g.email),
    norm(r.addressLine1) === norm(g.addressLine1),
    norm(r.city) === norm(g.city),
    norm(r.state) === norm(g.state),
    norm(r.zip) === norm(g.zip),
    norm(r.emergencyContactName) === norm(g.emergencyContactName),
    normPhone(r.emergencyContactPhone) === normPhone(g.emergencyContactPhone),
    norm(r.emergencyContactRelationship) === norm(g.emergencyContactRelationship),
    norm(r.insurancePayer) === norm(g.insurancePayer),
    norm(r.insuranceMemberId) === norm(g.insuranceMemberId),
    norm(r.insuranceGroupNumber) === norm(g.insuranceGroupNumber),
  ];
  const ratio = fields.filter(Boolean).length / fields.length;
  return Math.round(ratio * 10);
}

function scoreScheduling(payload: PracticalExamPayload): number {
  const s = payload.scheduling;
  const v = EXAM_VALID_SCHEDULING;
  let pts = 0;
  if (norm(s.patientName).includes("maria") && norm(s.patientName).includes("santos")) pts += 2;
  if (norm(s.provider).includes("miller")) pts += 2;
  if (norm(s.visitType).includes("follow")) pts += 2;
  if (s.date === v.date && s.time === v.time) pts += 3;
  else if (s.date === v.date && s.time === "09:00") pts += 3;
  if (norm(s.location).length > 0) pts += 1;
  return Math.min(10, pts);
}

function scoreOptionSet(
  selectedId: string,
  options: readonly { id: string; correct: boolean; critical?: boolean }[],
): { points: number; max: number; critical: boolean } {
  const opt = options.find((o) => o.id === selectedId);
  if (!opt) return { points: 0, max: 1, critical: false };
  return {
    points: opt.correct ? 1 : 0,
    max: 1,
    critical: Boolean(opt.critical && !opt.correct && selectedId === opt.id),
  };
}

function scoreCallWorkflow(payload: PracticalExamPayload): {
  score: number;
  critical: boolean;
} {
  const med = scoreOptionSet(payload.callMedAdvice, CALL_MED_ADVICE_OPTIONS);
  const upset = scoreOptionSet(payload.callUpset, CALL_UPSET_OPTIONS);
  const raw = med.points + upset.points;
  const score = Math.round((raw / 2) * 15);
  const critical =
    (med.critical && payload.callMedAdvice === "give_dose_advice") ||
    (med.critical && payload.callMedAdvice === "google_it") ||
    (upset.critical && payload.callUpset === "promise_today") ||
    payload.callMedAdvice === "give_dose_advice" ||
    payload.callMedAdvice === "google_it";
  return { score, critical };
}

function scoreAdminScenarios(payload: PracticalExamPayload): {
  score: number;
  critical: boolean;
} {
  let correct = 0;
  let critical = false;
  for (const q of ADMIN_SCENARIO_QUESTIONS) {
    const selected = payload.scenarios[q.id];
    const opt = q.options.find((o) => o.id === selected);
    if (opt?.correct) correct += 1;
    if (opt?.critical && !opt.correct) critical = true;
    if (selected && q.options.some((o) => o.id === selected && o.critical && !o.correct)) {
      critical = true;
    }
  }
  const ratio = correct / ADMIN_SCENARIO_QUESTIONS.length;
  return { score: Math.round(ratio * 35), critical };
}

function scorePrioritization(payload: PracticalExamPayload): number {
  const order = payload.priorityOrder.slice(0, 6);
  if (order.length < 6) return Math.round((order.length / 6) * 5);
  let matches = 0;
  for (let i = 0; i < 6; i++) {
    if (order[i] === PRIORITY_IDEAL_ORDER[i]) matches += 1;
  }
  let pts = Math.round((matches / 6) * 12);
  const rationale = norm(payload.priorityRationale);
  if (
    rationale.includes("phone") ||
    rationale.includes("patient") ||
    rationale.includes("wait")
  ) {
    pts += 1;
  }
  if (
    rationale.includes("consequence") ||
    rationale.includes("priority") ||
    rationale.includes("urgent")
  ) {
    pts += 2;
  }
  return Math.min(15, pts);
}

function scoreClientComms(payload: PracticalExamPayload): number {
  let pts = 0;
  const delay = norm(payload.commDelay);
  if (delay.length >= 20) pts += 2;
  if (/2|3|pm|hour|status|delay|complete|finish|update/.test(delay)) pts += 3;

  const unclear = norm(payload.commUnclear);
  if (unclear.length >= 15) pts += 2;
  if (/which|what field|information|update|specific|confirm/.test(unclear)) pts += 3;

  const unavail = norm(payload.commUnavailable);
  if (unavail.length >= 15) pts += 2;
  if (/document|wait|task|other|pending|note|without guessing/.test(unavail)) pts += 3;

  return Math.min(15, pts);
}

function scoreMistake(payload: PracticalExamPayload): {
  score: number;
  critical: boolean;
} {
  const m = scoreOptionSet(payload.mistakeHandling, MISTAKE_HANDLING_OPTIONS);
  return {
    score: m.points * 5,
    critical: payload.mistakeHandling === "hide",
  };
}

function detectPhiCritical(payload: PracticalExamPayload): boolean {
  const blob = JSON.stringify(payload).toLowerCase();
  const blocked = ["@gmail.com", "@yahoo.com", "real patient", "ssn", "social security"];
  if (blocked.some((b) => blob.includes(b) && !blob.includes("@example.com"))) {
    return false;
  }
  return false;
}

export function gradePracticalExam(payload: PracticalExamPayload): PracticalExamGradeResult {
  const criticalReasons: string[] = [];

  const registration = scoreRegistration(payload);
  const scheduling = scoreScheduling(payload);
  const call = scoreCallWorkflow(payload);
  const admin = scoreAdminScenarios(payload);
  const prioritization = scorePrioritization(payload);
  const clientComms = scoreClientComms(payload);
  const mistake = scoreMistake(payload);

  if (call.critical) criticalReasons.push("Call workflow: clinical boundary or unsafe promise.");
  if (admin.critical) criticalReasons.push("Administrative scenario: unsafe choice selected.");
  if (mistake.critical) criticalReasons.push("Mistake handling: do not hide errors.");
  if (detectPhiCritical(payload)) criticalReasons.push("Possible real patient information.");

  const sectionScores: PracticalExamSectionScores = {
    registration,
    scheduling,
    callWorkflow: call.score,
    adminScenarios: admin.score,
    prioritization,
    clientComms,
    mistakeHandling: mistake.score,
  };

  const score = Object.values(sectionScores).reduce((a, b) => a + b, 0);
  const criticalError =
    call.critical || admin.critical || mistake.critical || detectPhiCritical(payload);
  const passed = score >= PRACTICAL_PASS_SCORE && !criticalError;

  return {
    score,
    maxScore: 100,
    passed,
    criticalError,
    criticalReasons,
    sectionScores,
  };
}
