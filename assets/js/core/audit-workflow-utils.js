import { buildMutationRequest } from "./mutation-utils.js";

const CYCLE_STATUSES = new Set(["open", "in_progress", "closed", "finalized", "archived"]);
const AUDIT_STATUSES = new Set(["open", "in_progress", "completed", "closed", "archived"]);
const FINDING_STATUSES = new Set(["draft", "submitted", "returned", "approved", "action_monitoring", "closed"]);
const ACTION_STATUSES = new Set(["open", "in_progress", "awaiting_verification", "verified", "returned", "closed", "archived"]);
const REVIEW_ROLES = new Set(["super_admin", "institution_admin", "reviewer", "pentadbir"]);
const EDIT_ROLES = new Set(["super_admin", "institution_admin", "auditor", "reviewer", "pentadbir", "pengguna"]);

export function buildAuditMutation(action, token, payload = {}, idFactory) {
  return buildMutationRequest(action, token, payload, idFactory);
}

export function validateAuditCycleDraft(input = {}) {
  const title = clean(input.title);
  const auditYear = clean(input.audit_year) || String(new Date().getFullYear());
  if (!title) return invalid("Tajuk kitaran audit wajib diisi.");
  if (!/^\d{4}$/.test(auditYear)) return invalid("Tahun audit mesti dalam format 4 digit.");
  return valid({
    id: clean(input.id),
    institution_id: clean(input.institution_id),
    title,
    audit_year: auditYear,
    start_date: clean(input.start_date),
    end_date: clean(input.end_date),
    status: normalizeChoice(input.status, CYCLE_STATUSES, "open"),
    report_reference: clean(input.report_reference)
  });
}

export function validateAuditDraft(input = {}) {
  const cycleId = clean(input.cycle_id);
  const auditCode = clean(input.audit_code).toUpperCase();
  const title = clean(input.title);
  if (!cycleId) return invalid("Kitaran audit wajib dipilih.");
  if (!auditCode) return invalid("Kod audit wajib diisi.");
  if (!title) return invalid("Tajuk audit wajib diisi.");
  return valid({
    id: clean(input.id),
    institution_id: clean(input.institution_id),
    cycle_id: cycleId,
    audit_code: auditCode,
    title,
    scope: clean(input.scope),
    objective: clean(input.objective),
    lead_auditor_user_id: clean(input.lead_auditor_user_id),
    start_date: clean(input.start_date),
    end_date: clean(input.end_date),
    status: normalizeChoice(input.status, AUDIT_STATUSES, "open")
  });
}

export function validateFindingDraft(input = {}) {
  const cycleId = clean(input.cycle_id);
  const categoryId = clean(input.category_id);
  const title = clean(input.title || input.finding_title);
  const issue = clean(input.issue_description || input.message);
  const likelihood = normalizeScale(input.likelihood);
  const impact = normalizeScale(input.impact);
  if (!cycleId) return invalid("Kitaran audit wajib dipilih.");
  if (!categoryId) return invalid("Kategori risiko wajib dipilih.");
  if (!title) return invalid("Tajuk isu wajib diisi.");
  if (!issue) return invalid("Huraian isu wajib diisi.");
  if (!likelihood || !impact) return invalid("Kebarangkalian dan impak mesti antara 1 hingga 4.");
  return valid({
    id: clean(input.id),
    institution_id: clean(input.institution_id),
    cycle_id: cycleId,
    audit_id: clean(input.audit_id),
    category_id: categoryId,
    unit_ids: normalizeUnitIds(input.unit_ids || input.unit_id || input.org_unit),
    finding_no: clean(input.finding_no),
    title,
    issue_description: issue,
    detailed_justification: clean(input.detailed_justification || issue),
    root_cause: clean(input.root_cause),
    impact_description: clean(input.impact_description),
    audit_evidence: clean(input.audit_evidence),
    recommendation: clean(input.recommendation),
    likelihood,
    impact,
    workflow_status: normalizeChoice(input.workflow_status, FINDING_STATUSES, "draft")
  });
}

export function validateCorrectiveActionDraft(input = {}) {
  const findingId = clean(input.finding_id);
  const actionText = clean(input.action_text);
  if (!findingId) return invalid("ID penemuan wajib dipilih.");
  if (!actionText) return invalid("Tindakan pembetulan wajib diisi.");
  return valid({
    id: clean(input.id),
    institution_id: clean(input.institution_id),
    finding_id: findingId,
    action_text: actionText,
    owner_user_id: clean(input.owner_user_id),
    owner_name: clean(input.owner_name),
    owner_unit_id: clean(input.owner_unit_id),
    target_date: clean(input.target_date),
    status: normalizeChoice(input.status, ACTION_STATUSES, "open"),
    progress_percent: clampInteger(input.progress_percent, 0, 100, 0),
    progress_note: clean(input.progress_note),
    completion_evidence: clean(input.completion_evidence),
    verification_note: clean(input.verification_note)
  });
}

export function getFindingWorkflowActions(record = {}, role = "viewer") {
  const status = clean(record.workflow_status || "draft").toLowerCase();
  const normalizedRole = clean(role).toLowerCase();
  if (!EDIT_ROLES.has(normalizedRole) && !REVIEW_ROLES.has(normalizedRole)) return [];
  if (["draft", "returned"].includes(status)) {
    return [{ action: "findings.submit", label: "Hantar semakan", icon: "fa-paper-plane", type: "info" }];
  }
  if (status === "submitted" && REVIEW_ROLES.has(normalizedRole)) {
    return [
      { action: "findings.approve", label: "Lulus", icon: "fa-circle-check", type: "success" },
      { action: "findings.return", label: "Pulangkan", icon: "fa-rotate-left", type: "warning" },
      { action: "findings.overrideLevel", label: "Override tahap", icon: "fa-sliders", type: "info" }
    ];
  }
  return [];
}

export function getCorrectiveActionWorkflowActions(record = {}, role = "viewer") {
  const status = clean(record.status || "open").toLowerCase();
  const normalizedRole = clean(role).toLowerCase();
  if (["open", "in_progress", "returned"].includes(status) && EDIT_ROLES.has(normalizedRole)) {
    return [{ action: "correctiveActions.submitForVerification", label: "Hantar pengesahan", icon: "fa-paper-plane", type: "info" }];
  }
  if (status === "awaiting_verification" && REVIEW_ROLES.has(normalizedRole)) {
    return [
      { action: "correctiveActions.verify", label: "Sahkan", icon: "fa-circle-check", type: "success" },
      { action: "correctiveActions.return", label: "Pulangkan", icon: "fa-rotate-left", type: "warning" }
    ];
  }
  return [];
}

export function getWorkflowStatusLabel(status) {
  const labels = {
    draft: "Draf",
    submitted: "Dihantar",
    returned: "Dipulangkan",
    approved: "Diluluskan",
    action_monitoring: "Pemantauan tindakan",
    closed: "Ditutup",
    open: "Terbuka",
    in_progress: "Sedang berjalan",
    awaiting_verification: "Menunggu pengesahan",
    verified: "Disahkan",
    finalized: "Dimuktamadkan",
    archived: "Arkib"
  };
  return labels[clean(status).toLowerCase()] || "Tidak diketahui";
}

export function buildReportCsv(report = {}) {
  const rows = [["Jenis", "No Rujukan", "Tajuk", "Status", "Skor", "Tahap", "Cadangan/Tindakan", "Tarikh Sasaran"]];
  (report.findings || []).forEach(finding => {
    rows.push([
      "Penemuan",
      finding.finding_no || finding.id || "",
      finding.title || "",
      getWorkflowStatusLabel(finding.workflow_status),
      finding.calculated_score || "",
      finding.final_level_label || finding.final_level || finding.level_label || finding.calculated_level_id || "",
      finding.recommendation || "",
      ""
    ]);
  });
  (report.actions || report.corrective_actions || []).forEach(action => {
    rows.push([
      "Tindakan",
      action.finding_id || action.id || "",
      action.action_text || "",
      getWorkflowStatusLabel(action.status),
      "",
      "",
      action.action_text || "",
      action.target_date || ""
    ]);
  });
  return rows.map(row => row.map(escapeCsv).join(",")).join("\n");
}

export function normalizeUnitIds(value) {
  const raw = Array.isArray(value) ? value : String(value || "").split(",");
  return [...new Set(raw.map(clean).filter(Boolean))];
}

function valid(data) {
  return { ok: true, data };
}

function invalid(error) {
  return { ok: false, error };
}

function clean(value) {
  return String(value ?? "").trim();
}

function normalizeChoice(value, allowed, fallback) {
  const normalized = clean(value).toLowerCase() || fallback;
  return allowed.has(normalized) ? normalized : fallback;
}

function normalizeScale(value) {
  const number = Number.parseInt(value, 10);
  return Number.isInteger(number) && number >= 1 && number <= 4 ? number : 0;
}

function clampInteger(value, min, max, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}
