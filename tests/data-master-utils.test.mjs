/*
 * File Path: tests/data-master-utils.test.mjs
 * File Version: SPRAD v2.8-production | metadata-header.1
 * Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDataMasterMutation,
  filterRecords,
  getRecordStatusLabel,
  normalizeListResponse,
  paginateRecords,
  validateInstitutionDraft,
  validateOrgUnitDraft,
  validateRiskCategoryDraft,
  validateRiskLevelDraft,
  validateUserDraft
} from "../assets/js/core/data-master-utils.js";

test("normalizes Apps Script list responses from named and generic keys", () => {
  assert.deepEqual(
    normalizeListResponse({ data: { institutions: [{ id: "inst-1" }] } }, "institutions"),
    [{ id: "inst-1" }]
  );
  assert.deepEqual(
    normalizeListResponse({ data: { records: [{ id: "unit-1" }] } }, "org_units"),
    [{ id: "unit-1" }]
  );
  assert.deepEqual(normalizeListResponse({ ok: true }, "users"), []);
});

test("filters records across selected fields using case-insensitive text", () => {
  const records = [
    { name: "Audit Dalaman", code: "AUD", email: "audit@example.com" },
    { name: "Kewangan", code: "FIN", email: "finance@example.com" }
  ];

  assert.deepEqual(filterRecords(records, "audit", ["name", "email"]), [records[0]]);
  assert.deepEqual(filterRecords(records, "fin", ["code"]), [records[1]]);
  assert.deepEqual(filterRecords(records, "", ["name"]), records);
});

test("paginates records with stable metadata", () => {
  const records = Array.from({ length: 12 }, (_, index) => ({ id: index + 1 }));
  const page = paginateRecords(records, 3, 5);

  assert.equal(page.currentPage, 3);
  assert.equal(page.totalPages, 3);
  assert.equal(page.start, 11);
  assert.equal(page.end, 12);
  assert.deepEqual(page.items, [{ id: 11 }, { id: 12 }]);
});

test("validates institution drafts", () => {
  assert.equal(validateInstitutionDraft({ code: "", name: "SPRAD" }).ok, false);
  assert.deepEqual(
    validateInstitutionDraft({
      id: "inst-1",
      code: "sprad",
      name: "Sistem Penilaian Risiko Audit Dalam",
      short_name: "SPRAD",
      ministry: "KPM",
      address: "Putrajaya",
      status: "active"
    }),
    {
      ok: true,
      data: {
        id: "inst-1",
        code: "SPRAD",
        name: "Sistem Penilaian Risiko Audit Dalam",
        short_name: "SPRAD",
        ministry: "KPM",
        address: "Putrajaya",
        logo_url: "",
        report_title: "Sistem Penilaian Risiko Audit Dalam",
        status: "active"
      }
    }
  );
});

test("validates org unit drafts", () => {
  assert.equal(validateOrgUnitDraft({ code: "AUD" }).ok, false);
  assert.deepEqual(
    validateOrgUnitDraft({
      code: " audit ",
      name: "Unit Audit Dalam",
      unit_type: "Unit",
      parent_unit_id: "",
      status: "active"
    }).data,
    {
      id: "",
      institution_id: "",
      code: "AUDIT",
      name: "Unit Audit Dalam",
      unit_type: "Unit",
      parent_unit_id: "",
      status: "active"
    }
  );
});

test("validates user drafts and strips password when editing without one", () => {
  assert.equal(validateUserDraft({ username: "akmal", password: "short", role: "auditor" }).ok, false);
  assert.deepEqual(
    validateUserDraft({
      id: "user-1",
      username: "akmal4244",
      password: "",
      role: "institution_admin",
      status: "active"
    }).data,
    {
      id: "user-1",
      institution_id: "",
      username: "akmal4244",
      display_name: "",
      email: "",
      role: "institution_admin",
      status: "active"
    }
  );
});

test("validates risk category and risk level drafts", () => {
  assert.equal(validateRiskCategoryDraft({ code: "K01" }).ok, false);
  assert.equal(validateRiskLevelDraft({ label: "Tinggi", min_score: 12, max_score: 9 }).ok, false);
  assert.deepEqual(
    validateRiskCategoryDraft({
      code: "k01",
      name: "Kawalan",
      description: "Kawalan dalaman",
      sort_order: "2"
    }).data,
    {
      id: "",
      institution_id: "",
      code: "K01",
      name: "Kawalan",
      description: "Kawalan dalaman",
      sort_order: 2,
      status: "active"
    }
  );
  assert.deepEqual(
    validateRiskLevelDraft({
      id: "rl-high",
      label: "Tinggi",
      rank: "3",
      min_score: "9",
      max_score: "12",
      color_hex: "#b91c1c",
      default_due_days: "30"
    }).data,
    {
      id: "rl-high",
      label: "Tinggi",
      rank: 3,
      min_score: 9,
      max_score: 12,
      color_hex: "#b91c1c",
      description: "",
      default_due_days: 30,
      status: "active"
    }
  );
});

test("builds data master mutation envelope and status labels", () => {
  assert.deepEqual(
    buildDataMasterMutation("institutions.update", "token-1", { id: "inst-1" }, () => "req-1"),
    {
      action: "institutions.update",
      request_id: "req-1",
      requestId: "req-1",
      token: "token-1",
      payload: { id: "inst-1" }
    }
  );
  assert.equal(getRecordStatusLabel("active"), "Aktif");
  assert.equal(getRecordStatusLabel("inactive"), "Tidak aktif");
  assert.equal(getRecordStatusLabel("archived"), "Arkib");
});
