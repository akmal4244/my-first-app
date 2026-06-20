import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAuditMutation,
  buildReportCsv,
  getCorrectiveActionWorkflowActions,
  getFindingWorkflowActions,
  validateAuditCycleDraft,
  validateAuditDraft,
  validateCorrectiveActionDraft,
  validateFindingDraft
} from "../assets/js/core/audit-workflow-utils.js";

test("validates audit cycle drafts with normalized defaults", () => {
  assert.equal(validateAuditCycleDraft({ title: "", audit_year: "2026" }).ok, false);
  assert.deepEqual(
    validateAuditCycleDraft({
      id: "cycle-1",
      institution_id: "inst-1",
      title: " Audit Dalaman 2026 ",
      audit_year: "2026",
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      status: "open",
      report_reference: " SPRAD/2026 "
    }),
    {
      ok: true,
      data: {
        id: "cycle-1",
        institution_id: "inst-1",
        title: "Audit Dalaman 2026",
        audit_year: "2026",
        start_date: "2026-01-01",
        end_date: "2026-12-31",
        status: "open",
        report_reference: "SPRAD/2026"
      }
    }
  );
});

test("validates audit drafts with required cycle, code, and title", () => {
  assert.equal(validateAuditDraft({ audit_code: "AUD-1", title: "Audit" }).ok, false);
  assert.deepEqual(
    validateAuditDraft({
      id: "audit-1",
      cycle_id: "cycle-1",
      audit_code: " aud-01 ",
      title: "Audit Perolehan",
      scope: "Perolehan ICT",
      objective: "Menilai kawalan",
      lead_auditor_user_id: "user-1",
      status: "in_progress"
    }).data,
    {
      id: "audit-1",
      institution_id: "",
      cycle_id: "cycle-1",
      audit_code: "AUD-01",
      title: "Audit Perolehan",
      scope: "Perolehan ICT",
      objective: "Menilai kawalan",
      lead_auditor_user_id: "user-1",
      start_date: "",
      end_date: "",
      status: "in_progress"
    }
  );
});

test("validates finding drafts and normalizes PTJ arrays", () => {
  assert.equal(validateFindingDraft({ cycle_id: "cycle-1", title: "Isu" }).ok, false);
  assert.deepEqual(
    validateFindingDraft({
      id: "finding-1",
      cycle_id: "cycle-1",
      audit_id: "audit-1",
      category_id: "rc-1",
      unit_ids: "unit-1, unit-2, unit-1",
      finding_no: " SPRAD-1 ",
      title: "Kawalan tidak lengkap",
      issue_description: "Tiada bukti semakan",
      detailed_justification: "Borang tidak disimpan",
      root_cause: "Semakan manual",
      impact_description: "Risiko ketidakpatuhan",
      audit_evidence: "https://example.com/evidence",
      recommendation: "Wujudkan senarai semak",
      likelihood: "4",
      impact: "3"
    }).data,
    {
      id: "finding-1",
      institution_id: "",
      cycle_id: "cycle-1",
      audit_id: "audit-1",
      category_id: "rc-1",
      unit_ids: ["unit-1", "unit-2"],
      finding_no: "SPRAD-1",
      title: "Kawalan tidak lengkap",
      issue_description: "Tiada bukti semakan",
      detailed_justification: "Borang tidak disimpan",
      root_cause: "Semakan manual",
      impact_description: "Risiko ketidakpatuhan",
      audit_evidence: "https://example.com/evidence",
      recommendation: "Wujudkan senarai semak",
      likelihood: 4,
      impact: 3,
      workflow_status: "draft"
    }
  );
});

test("validates corrective action drafts with progress clamped to 0-100", () => {
  assert.equal(validateCorrectiveActionDraft({ action_text: "Baiki proses" }).ok, false);
  assert.deepEqual(
    validateCorrectiveActionDraft({
      id: "action-1",
      finding_id: "finding-1",
      action_text: "Baiki proses",
      owner_name: "Pemilik PTJ",
      target_date: "2026-07-01",
      status: "in_progress",
      progress_percent: "150"
    }).data,
    {
      id: "action-1",
      institution_id: "",
      finding_id: "finding-1",
      action_text: "Baiki proses",
      owner_user_id: "",
      owner_name: "Pemilik PTJ",
      owner_unit_id: "",
      target_date: "2026-07-01",
      status: "in_progress",
      progress_percent: 100,
      progress_note: "",
      completion_evidence: "",
      verification_note: ""
    }
  );
});

test("returns role-aware workflow actions for findings and corrective actions", () => {
  assert.deepEqual(getFindingWorkflowActions({ workflow_status: "draft" }, "auditor").map(action => action.action), ["findings.submit"]);
  assert.deepEqual(getFindingWorkflowActions({ workflow_status: "draft" }, "reviewer").map(action => action.action), ["findings.submit"]);
  assert.deepEqual(getFindingWorkflowActions({ workflow_status: "returned" }, "institution_admin").map(action => action.action), ["findings.submit"]);
  assert.deepEqual(getFindingWorkflowActions({ workflow_status: "submitted" }, "reviewer").map(action => action.action), ["findings.approve", "findings.return", "findings.overrideLevel"]);
  assert.deepEqual(getFindingWorkflowActions({ workflow_status: "approved" }, "auditor"), []);
  assert.deepEqual(getCorrectiveActionWorkflowActions({ status: "in_progress" }, "auditor").map(action => action.action), ["correctiveActions.submitForVerification"]);
  assert.deepEqual(getCorrectiveActionWorkflowActions({ status: "awaiting_verification" }, "reviewer").map(action => action.action), ["correctiveActions.verify", "correctiveActions.return"]);
});

test("builds audit mutation envelope and CSV report safely", () => {
  assert.deepEqual(
    buildAuditMutation("findings.update", "token-1", { id: "finding-1" }, () => "req-1"),
    {
      action: "findings.update",
      request_id: "req-1",
      requestId: "req-1",
      token: "token-1",
      payload: { id: "finding-1" }
    }
  );

  const csv = buildReportCsv({
    findings: [
      {
        finding_no: "SPRAD-1",
        title: "Isu, dengan koma",
        workflow_status: "approved",
        calculated_score: 12,
        final_level_label: "Tinggi",
        recommendation: "Baiki \"kawalan\""
      }
    ],
    actions: [{ finding_id: "finding-1", action_text: "Kemaskini SOP", status: "open", target_date: "2026-07-01" }]
  });

  assert.match(csv, /^Jenis,No Rujukan,Tajuk,Status,Skor,Tahap,Cadangan\/Tindakan,Tarikh Sasaran/m);
  assert.match(csv, /"Isu, dengan koma"/);
  assert.match(csv, /"Baiki ""kawalan"""/);
});
