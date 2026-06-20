/*
 * File Path: assets/js/services/audit-service.js
 * File Version: SPRAD v2.8-production | metadata-header.1
 * Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
 */
import { getApiUrl } from "../config.js";
import { getJson } from "../core/api.js";
import { runConfirmedAction } from "../core/action-confirmation.js";
import { buildAuditMutation } from "../core/audit-workflow-utils.js";
import { normalizeListResponse } from "../core/data-master-utils.js";
import { postOpaqueMutation } from "../core/mutation.js";
import { pollMutationReceipt } from "../core/mutation-utils.js";

const LIST_ACTIONS = {
  auditCycles: ["auditCycles.list", "records"],
  audits: ["audits.list", "records"],
  findings: ["findings.list", "findings"],
  correctiveActions: ["correctiveActions.list", "corrective_actions"],
  auditLogs: ["auditLogs.list", "audit_logs"],
  institutions: ["institutions.list", "institutions"],
  orgUnits: ["orgUnits.list", "records"],
  riskCategories: ["riskCategories.list", "records"],
  riskLevels: ["riskLevels.list", "records"],
  users: ["users.list", "users"]
};

export async function listAuditResource(resource, token, options = {}) {
  const entry = LIST_ACTIONS[resource];
  if (!entry) throw new Error("Sumber audit tidak sah.");
  const [action, key] = entry;
  const response = await getJson({
    action,
    token,
    include_archived: options.includeArchived ? "1" : "",
    status: options.status || "",
    workflow_status: options.workflowStatus || "",
    cycle_id: options.cycleId || "",
    audit_id: options.auditId || "",
    category_id: options.categoryId || "",
    unit_id: options.unitId || "",
    audit_year: options.auditYear || ""
  });
  return normalizeListResponse(response, key);
}

export async function getDashboardSummary(token, options = {}) {
  const response = await getJson({
    action: "dashboard.summary",
    token,
    cycle_id: options.cycleId || "",
    audit_id: options.auditId || "",
    category_id: options.categoryId || "",
    unit_id: options.unitId || "",
    audit_year: options.auditYear || ""
  });
  return response.data?.summary || {};
}

export async function getReportDataset(token, options = {}) {
  const response = await getJson({
    action: "reports.dataset",
    token,
    cycle_id: options.cycleId || "",
    audit_id: options.auditId || "",
    category_id: options.categoryId || "",
    unit_id: options.unitId || "",
    audit_year: options.auditYear || "",
    include_draft: options.includeDraft ? "true" : ""
  });
  return response.data?.report || {};
}

export async function submitAuditMutation({ action, token, payload, url = getApiUrl(), confirmation = {} }) {
  return runConfirmedAction(action, async () => {
    const request = buildAuditMutation(action, token, payload);
    await postOpaqueMutation(url, request);
    const receipt = await pollMutationReceipt({
      url,
      token,
      requestId: request.request_id,
      attempts: 12,
      delayMs: 1200
    });
    if (receipt.status !== "success") throw new Error(receipt.error || "Simpanan belum dapat disahkan.");
    return receipt;
  }, confirmation);
}
