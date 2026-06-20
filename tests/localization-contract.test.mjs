/*
 * File Path: tests/localization-contract.test.mjs
 * File Version: SPRAD v2.8-production | malay-localization.1
 * Update Info: 2026-06-20 - Tambah kontrak supaya teks UI SPRAD kekal dalam Bahasa Melayu.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = filePath => fs.readFileSync(path.join(rootDir, filePath), "utf8");

const userFacingFiles = [
  "index.html",
  "login.html",
  "register.html",
  "view.html",
  "form.html",
  "dashboard.html",
  "reports.html",
  "system-health.html",
  "audit-cycles.html",
  "audits.html",
  "findings.html",
  "corrective-actions.html",
  "audit-logs.html",
  "institutions.html",
  "org-units.html",
  "users.html",
  "settings.html",
  "ai-intake.html",
  "actions.html",
  "assets/js/components/app-shell.js",
  "assets/js/core/data-master-utils.js",
  "assets/js/core/mutation-utils.js",
  "assets/js/core/permissions.js",
  "assets/js/pages/ai-intake-page.js",
  "assets/js/pages/audit-workspace-page.js",
  "assets/js/pages/dashboard-page.js",
  "assets/js/pages/data-master-page.js",
  "assets/js/pages/reports-page.js",
  "assets/js/pages/system-health-page.js"
];

const userFacingSource = userFacingFiles
  .map(file => `\n/* ${file} */\n${read(file)}`)
  .join("\n");
const appsScriptSource = read("apps-script/Code.gs");

test("SPRAD visible interface copy is localized to Bahasa Melayu", () => {
  [
    ">Dashboard<",
    "\"Dashboard\"",
    "Dashboard SPRAD",
    ">Refresh<",
    "Refresh</button>",
    ">Reset<",
    "Upload dokumen",
    "Draft AI",
    "% confidence",
    "Super Admin",
    "Institution admin",
    "Request ID",
    "Mutation gagal",
    "Fetch tidak tersedia",
    "AI Intake",
    "draft penemuan",
    "semakan auditor",
    "auditor sahkan",
    "disahkan auditor"
  ].forEach(englishText => {
    assert.equal(
      userFacingSource.includes(englishText),
      false,
      `Teks UI belum Bahasa Melayu sepenuhnya: ${englishText}`
    );
  });
});

test("Apps Script API messages exposed to the browser are localized to Bahasa Melayu", () => {
  [
    "\"server error\"",
    "\"invalid token\"",
    "\"unknown action\"",
    "\"missing fields\"",
    "\"username exists\"",
    "\"missing credentials\"",
    "\"forbidden\"",
    "\"missing id\"",
    "\"contact not found\"",
    "\"missing requestId\"",
    "\"receipt not found\"",
    "\"Missing POST body\"",
    "Draft demo",
    "Draft AI",
    "Huraian draft",
    "draft penemuan",
    "semakan auditor",
    "auditor sahkan",
    "disahkan auditor",
    "perlu semakan auditor"
  ].forEach(englishText => {
    assert.equal(
      appsScriptSource.includes(englishText),
      false,
      `Mesej API belum Bahasa Melayu sepenuhnya: ${englishText}`
    );
  });
});
