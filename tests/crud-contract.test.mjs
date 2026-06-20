import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = filePath => fs.readFileSync(path.join(rootDir, filePath), "utf8");

const codeGs = read("apps-script/Code.gs");
const frontendCrudSources = [
  read("assets/js/pages/audit-workspace-page.js"),
  read("assets/js/pages/data-master-page.js"),
  read("assets/js/core/audit-workflow-utils.js"),
  read("assets/js/services/audit-service.js"),
  read("assets/js/services/data-master-service.js")
].join("\n");
const auditWorkspaceSource = read("assets/js/pages/audit-workspace-page.js");
const dataMasterPageSource = read("assets/js/pages/data-master-page.js");

const mutationActions = [
  "institutions.create",
  "institutions.update",
  "institutions.delete",
  "institutions.restore",
  "orgUnits.create",
  "orgUnits.update",
  "orgUnits.delete",
  "orgUnits.restore",
  "riskCategories.create",
  "riskCategories.update",
  "riskCategories.delete",
  "riskCategories.restore",
  "riskLevels.update",
  "auditCycles.create",
  "auditCycles.update",
  "auditCycles.finalize",
  "auditCycles.delete",
  "auditCycles.restore",
  "audits.create",
  "audits.update",
  "audits.delete",
  "audits.restore",
  "findings.create",
  "findings.update",
  "findings.delete",
  "findings.restore",
  "findings.submit",
  "findings.return",
  "findings.approve",
  "findings.overrideLevel",
  "correctiveActions.create",
  "correctiveActions.update",
  "correctiveActions.delete",
  "correctiveActions.restore",
  "correctiveActions.submitForVerification",
  "correctiveActions.verify",
  "correctiveActions.return",
  "users.create",
  "users.update",
  "users.deactivate",
  "users.restore"
];

const getActions = [
  "institutions.list",
  "orgUnits.list",
  "users.list",
  "auditCycles.list",
  "audits.list",
  "riskCategories.list",
  "riskLevels.list",
  "findings.list",
  "correctiveActions.list",
  "auditLogs.list",
  "dashboard.summary",
  "reports.dataset",
  "riskMatrix.get",
  "mutations.status"
];

test("frontend CRUD mutation actions are accepted by Apps Script", () => {
  for (const action of mutationActions) {
    assert.match(frontendCrudSources, quotedAction(action), `${action} is missing from frontend CRUD sources`);
    assert.match(codeGs, quotedAction(action), `${action} is missing from Apps Script mutation allow-list`);
  }
});

test("frontend read actions are routed by Apps Script", () => {
  for (const action of getActions) {
    assert.match(frontendCrudSources + codeGs, quotedAction(action), `${action} is not referenced`);
    assert.match(codeGs, quotedAction(action), `${action} is missing from Apps Script GET routes`);
  }
});

test("restore keeps workflow resources in valid operational statuses", () => {
  assert.match(codeGs, /function restoreStatusForSheet_/, "restore status helper must exist");
  assert.match(codeGs, /SHEET_AUDIT_CYCLES[\s\S]+return "open"/, "audit cycle restore should reopen the cycle");
  assert.match(codeGs, /SHEET_AUDITS[\s\S]+return "open"/, "audit restore should reopen the audit");
  assert.match(codeGs, /SHEET_CORRECTIVE_ACTIONS[\s\S]+return "open"/, "corrective action restore should reopen the action");
});

test("backend blocks inactive users from login and token validation", () => {
  assert.match(codeGs, /function isUserActive_/, "Apps Script must centralize active-user checks");
  assert.match(codeGs, /login[\s\S]+isUserActive_/, "login must reject inactive users");
  assert.match(codeGs, /findUserById_[\s\S]+isUserActive_/, "token validation must not return inactive users");
});

test("backend scopes settings updates and avoids setup overwrites", () => {
  assert.match(codeGs, /function settingScopeId_/, "settings need a deterministic scope id");
  assert.match(codeGs, /function findSettingRow_/, "settings update must match key and scope");
  assert.match(codeGs, /mutateSetting_[\s\S]+findSettingRow_/, "settings.update must use scoped row lookup");
  assert.match(codeGs, /setSettingIfMissing_/, "setup defaults must not overwrite changed settings");
});

test("backend validates mutable status payloads and locks finalized cycles", () => {
  assert.match(codeGs, /function normalizeSheetStatus_/, "status writes should use an allowlist helper");
  assert.doesNotMatch(codeGs, /status:\s*clean_\(payload\.status/, "status payloads must not be written directly");
  assert.match(codeGs, /mutateAuditCycle_[\s\S]+ensureCycleIsEditable_\(before\.id\)/, "finalized cycles must be locked for update/delete/restore");
});

test("frontend hides disallowed CRUD controls before backend rejection", () => {
  assert.match(auditWorkspaceSource, /function canCreateRecord_/, "audit workspace must decide create permission");
  assert.match(auditWorkspaceSource, /function canEditRecord_/, "audit workspace must decide per-record edit permission");
  assert.match(auditWorkspaceSource, /function canRestoreRecord_/, "audit workspace must decide restore permission");
  assert.match(auditWorkspaceSource, /function canRunWorkflowAction_/, "audit workspace must filter workflow actions per record");
  assert.doesNotMatch(auditWorkspaceSource, /name: "workflow_status"/, "finding status must not be a direct edit field");
  assert.match(dataMasterPageSource, /permissions:\s*\["institutions\.manage"\]/, "institution page must be super-admin only");
  assert.match(dataMasterPageSource, /requireSession\(\{\s*permissions: definition\.permissions/, "data master pages must use page-level permissions");
});

function quotedAction(action) {
  return new RegExp(`["']${escapeRegex(action)}["']`);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
