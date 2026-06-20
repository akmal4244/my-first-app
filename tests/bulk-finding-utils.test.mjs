/*
 * File Path: tests/bulk-finding-utils.test.mjs
 * File Version: SPRAD v2.8-production | metadata-header.1
 * Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildBulkFindingPayload,
  createEmptyFindingIssue
} from "../assets/js/core/bulk-finding-utils.js";

test("creates an empty issue draft with safe defaults", () => {
  assert.deepEqual(createEmptyFindingIssue(), {
    risk_category: "",
    finding_title: "",
    likelihood: "1",
    impact: "1",
    issue_description: "",
    root_cause: "",
    impact_description: "",
    recommendation: "",
    audit_evidence: ""
  });
});

test("builds a bulk legacy payload with shared institution context and multiple issues", () => {
  const payload = buildBulkFindingPayload(
    {
      name: "Akmal",
      email: "akmal@example.com",
      institution_id: "inst_a",
      institution_name: "Universiti Contoh",
      org_unit: "unit_audit",
      org_unit_name: "Unit Audit Dalam",
      audit_cycle: "cycle_2026",
      audit_cycle_name: "Audit Dalam 2026"
    },
    [
      {
        risk_category: "rc_negligence",
        risk_category_name: "Kecuaian",
        finding_title: "Dokumen tidak lengkap",
        likelihood: "3",
        impact: "3",
        issue_description: "Fail sokongan tidak lengkap.",
        root_cause: "Semakan manual tidak dibuat.",
        impact_description: "Risiko ketidakpatuhan.",
        recommendation: "Wujudkan senarai semak."
      },
      {
        risk_category: "rc_waste",
        risk_category_name: "Pembaziran",
        finding_title: "Pembelian lewat digunakan",
        likelihood: "4",
        impact: "4",
        issue_description: "Aset tidak digunakan selepas pembelian.",
        root_cause: "Perancangan lemah.",
        impact_description: "Kos tidak memberi nilai.",
        recommendation: "Semak keperluan sebelum beli."
      }
    ]
  );

  assert.equal(payload.institution_id, "inst_a");
  assert.equal(payload.items.length, 2);
  assert.equal(payload.items[0].risk_score, 9);
  assert.equal(payload.items[0].risk_level, "Tinggi");
  assert.equal(payload.items[1].risk_score, 16);
  assert.equal(payload.items[1].risk_level, "Kritikal");
  assert.match(payload.items[0].message, /Institusi: Universiti Contoh/);
  assert.match(payload.items[0].message, /PTJ \/ Unit: Unit Audit Dalam/);
  assert.match(payload.items[0].message, /Tajuk isu: Dokumen tidak lengkap/);
});

test("rejects bulk payloads without at least one complete issue", () => {
  assert.throws(
    () => buildBulkFindingPayload({ name: "Akmal", email: "akmal@example.com" }, []),
    /Sekurang-kurangnya satu isu audit/
  );

  assert.throws(
    () => buildBulkFindingPayload({ name: "Akmal", email: "akmal@example.com" }, [{ finding_title: "" }]),
    /Tajuk isu audit wajib diisi/
  );
});
