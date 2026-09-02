/** PFMEA shared types and AIAG-VDA rating helpers. */

export type PfmeaStudy = {
  id: string;
  company_id: string;
  npi_project_id: string | null;
  title: string | null;
  part_number: string;
  part_name: string | null;
  customer: string | null;
  program: string | null;
  process_family: string;
  revision: string | null;
  status: "draft" | "active" | "approved" | "archived";
  owner_id: string | null;
  source: "manual" | "import" | "drawing" | "ai";
  drawing_path: string | null;
  notes: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PfmeaRow = {
  id: string;
  study_id: string;
  sort_order: number;
  step_no: string | null;
  step_name: string;
  function_req: string | null;
  failure_mode: string | null;
  effect: string | null;
  severity: number | null;
  classification: string | null;
  cause: string | null;
  occurrence: number | null;
  prevention_control: string | null;
  detection_control: string | null;
  detection: number | null;
  action: string | null;
  action_owner_id: string | null;
  due_date: string | null;
  action_status: "open" | "in_progress" | "done" | "not_required";
  post_severity: number | null;
  post_occurrence: number | null;
  post_detection: number | null;
};

/** A row as produced by the wizard, before it is written to the database. */
export type DraftRow = Omit<PfmeaRow, "id" | "study_id"> & { tempId: string };

export const PROCESS_FAMILIES = [
  { value: "machining", label: "Machining" },
  { value: "sheet_metal", label: "Sheet metal / forming" },
  { value: "assembly", label: "Assembly" },
  { value: "surface_treatment", label: "Surface treatment / finishing" },
  { value: "composites", label: "Composites" },
  { value: "electronics", label: "Electronics" },
  { value: "welding", label: "Welding / joining" },
  { value: "other", label: "Other" },
] as const;

export const ACTION_STATUSES = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
  { value: "not_required", label: "Not required" },
] as const;

export type ActionPriority = "H" | "M" | "L" | null;

/**
 * AIAG-VDA Action Priority (AP) table, 1st edition.
 * Severity bands 9-10 / 7-8 / 4-6 / 2-3 / 1, each split by occurrence and
 * detection bands. Returns High, Medium or Low.
 */
export function actionPriority(
  s: number | null | undefined,
  o: number | null | undefined,
  d: number | null | undefined,
): ActionPriority {
  if (!s || !o || !d) return null;
  const hi = (n: number, ...bands: number[]) => bands.includes(n);
  const band = (n: number) => (n >= 8 ? 3 : n >= 6 ? 2 : n >= 4 ? 1 : 0);
  void hi;

  if (s >= 9) {
    if (o >= 6) return "H";
    if (o >= 4) return d >= 4 ? "H" : "M";
    if (o >= 2) return d >= 7 ? "H" : d >= 4 ? "M" : "L";
    return d >= 7 ? "M" : "L";
  }
  if (s >= 7) {
    if (o >= 8) return "H";
    if (o >= 6) return d >= 4 ? "H" : "M";
    if (o >= 4) return d >= 7 ? "H" : d >= 4 ? "M" : "L";
    if (o >= 2) return d >= 7 ? "M" : "L";
    return "L";
  }
  if (s >= 4) {
    if (o >= 8) return d >= 4 ? "H" : "M";
    if (o >= 6) return d >= 7 ? "H" : d >= 4 ? "M" : "L";
    if (o >= 4) return d >= 7 ? "M" : "L";
    return band(d) >= 3 ? "L" : "L";
  }
  if (s >= 2) {
    if (o >= 8) return d >= 7 ? "M" : "L";
    return "L";
  }
  return "L";
}

export function rpn(
  s: number | null | undefined,
  o: number | null | undefined,
  d: number | null | undefined,
): number | null {
  if (!s || !o || !d) return null;
  return s * o * d;
}

export const AP_LABEL: Record<"H" | "M" | "L", string> = { H: "High", M: "Medium", L: "Low" };

export function apClasses(ap: ActionPriority) {
  if (ap === "H") return "bg-destructive/15 text-destructive border-destructive/30";
  if (ap === "M") return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
  if (ap === "L") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
  return "bg-muted text-muted-foreground border-border";
}

/** Short rating guidance shown in the S/O/D pickers. */
export const SEVERITY_GUIDE: Record<number, string> = {
  10: "Hazard without warning / regulatory non-compliance",
  9: "Hazard with warning / safety or airworthiness impact",
  8: "Product inoperable, loss of primary function",
  7: "Reduced primary function, customer very dissatisfied",
  6: "Loss of secondary function, escape to customer",
  5: "Reduced secondary function, rework off-line",
  4: "Appearance / noise defect noticed by most customers",
  3: "Minor defect noticed by some customers",
  2: "Minor defect noticed by discriminating customers",
  1: "No discernible effect",
};

export const OCCURRENCE_GUIDE: Record<number, string> = {
  10: "Very high — failure almost inevitable, no controls",
  9: "Very high — new process, no experience",
  8: "High — frequent failures, weak prevention",
  7: "High — process not statistically capable",
  6: "Moderate — occasional failures",
  5: "Moderate — process capable but drifts",
  4: "Moderate — isolated failures",
  3: "Low — few failures, capable process",
  2: "Low — proven process, very few failures",
  1: "Very low — prevention eliminates the cause",
};

export const DETECTION_GUIDE: Record<number, string> = {
  10: "No control / cannot detect",
  9: "Very remote chance of detection",
  8: "Remote — indirect or random checks",
  7: "Very low — visual check only",
  6: "Low — double visual check",
  5: "Moderate — chart / SPC after the fact",
  4: "Moderately high — gauge check after the operation",
  3: "High — in-station gauging with feedback",
  2: "Very high — automatic detection, part locked",
  1: "Almost certain — error-proofed, cannot make the defect",
};

export function emptyDraftRow(order: number): DraftRow {
  return {
    tempId: crypto.randomUUID(),
    sort_order: order,
    step_no: null,
    step_name: "",
    function_req: null,
    failure_mode: null,
    effect: null,
    severity: null,
    classification: null,
    cause: null,
    occurrence: null,
    prevention_control: null,
    detection_control: null,
    detection: null,
    action: null,
    action_owner_id: null,
    due_date: null,
    action_status: "open",
    post_severity: null,
    post_occurrence: null,
    post_detection: null,
  };
}
