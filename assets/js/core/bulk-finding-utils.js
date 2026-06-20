/*
 * File Path: assets/js/core/bulk-finding-utils.js
 * File Version: SPRAD v2.8-production | metadata-header.1
 * Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
 */
import { calculateRisk } from "./risk-engine.js";

export function createEmptyFindingIssue() {
  return {
    risk_category: "",
    finding_title: "",
    likelihood: "1",
    impact: "1",
    issue_description: "",
    root_cause: "",
    impact_description: "",
    recommendation: "",
    audit_evidence: ""
  };
}

export function buildBulkFindingPayload(commonInput = {}, issueInputs = []) {
  const common = normalizeCommonFields(commonInput);
  if (!Array.isArray(issueInputs) || !issueInputs.length) {
    throw new Error("Sekurang-kurangnya satu isu audit perlu ditambah.");
  }

  const items = issueInputs.map((input, index) => normalizeFindingItem(input, common, index + 1));
  return {
    ...common,
    items
  };
}

export function normalizeCommonFields(input = {}) {
  const common = {
    name: clean(input.name),
    email: clean(input.email),
    institution_id: clean(input.institution_id),
    institution_name: clean(input.institution_name),
    org_unit: clean(input.org_unit),
    org_unit_name: clean(input.org_unit_name),
    audit_cycle: clean(input.audit_cycle),
    audit_cycle_name: clean(input.audit_cycle_name)
  };
  if (!common.name) throw new Error("Nama pelapor wajib diisi.");
  if (!common.email) throw new Error("E-mel pelapor wajib diisi.");
  return common;
}

export function normalizeFindingItem(input = {}, common = {}, index = 1) {
  const issue = {
    risk_category: clean(input.risk_category),
    risk_category_name: clean(input.risk_category_name || input.risk_category),
    finding_title: clean(input.finding_title),
    likelihood: clean(input.likelihood || "1"),
    impact: clean(input.impact || "1"),
    issue_description: clean(input.issue_description || input.message),
    root_cause: clean(input.root_cause),
    impact_description: clean(input.impact_description),
    recommendation: clean(input.recommendation),
    audit_evidence: clean(input.audit_evidence)
  };

  if (!issue.finding_title) throw new Error(`Item ${index}: Tajuk isu audit wajib diisi.`);
  if (!issue.risk_category) throw new Error(`Item ${index}: Kategori risiko wajib dipilih.`);
  if (!issue.issue_description) throw new Error(`Item ${index}: Huraian isu audit wajib diisi.`);
  if (!issue.root_cause) throw new Error(`Item ${index}: Punca utama wajib diisi.`);
  if (!issue.impact_description) throw new Error(`Item ${index}: Kesan / implikasi wajib diisi.`);
  if (!issue.recommendation) throw new Error(`Item ${index}: Syor audit wajib diisi.`);

  const risk = calculateRisk(issue.likelihood, issue.impact);
  return {
    ...issue,
    likelihood: risk.likelihood,
    impact: risk.impact,
    risk_score: risk.score,
    risk_level: risk.level,
    message: buildLegacyIssueMessage(common, issue, risk)
  };
}

export function buildLegacyIssueMessage(common = {}, issue = {}, risk = {}) {
  return [
    `Tajuk isu: ${clean(issue.finding_title)}`,
    `Institusi: ${clean(common.institution_name || common.institution_id || "Tidak dinyatakan")}`,
    `PTJ / Unit: ${clean(common.org_unit_name || common.org_unit || "Tidak dinyatakan")}`,
    `Kitaran audit: ${clean(common.audit_cycle_name || common.audit_cycle || "Tidak dinyatakan")}`,
    `Kategori risiko: ${clean(issue.risk_category_name || issue.risk_category)}`,
    `Kemungkinan: ${risk.likelihood}`,
    `Kesan: ${risk.impact}`,
    `Skor risiko: ${risk.score}`,
    `Tahap risiko: ${risk.level}`,
    "",
    "Huraian isu audit:",
    clean(issue.issue_description),
    "",
    "Punca utama:",
    clean(issue.root_cause),
    "",
    "Kesan / implikasi:",
    clean(issue.impact_description),
    "",
    "Syor audit / tindakan dicadangkan:",
    clean(issue.recommendation)
  ].join("\n");
}

function clean(value) {
  return String(value ?? "").trim();
}
