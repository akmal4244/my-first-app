/*
 * File Path: tests/action-confirmation.test.mjs
 * File Version: SPRAD v2.8-production | metadata-header.1
 * Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  actionRequiresConfirmation,
  confirmationCopyForAction,
  isActionCancelled,
  runConfirmedAction
} from "../assets/js/core/action-confirmation.js";

test("mutating SPRAD actions require user confirmation", () => {
  [
    "institutions.create",
    "institutions.update",
    "institutions.delete",
    "institutions.restore",
    "auditCycles.finalize",
    "findings.approve",
    "correctiveActions.verify",
    "aiIntake.create",
    "aiDrafts.promote",
    "auth.logout",
    "register",
    "findings.bulkCreate.legacy"
  ].forEach(action => assert.equal(actionRequiresConfirmation(action), true, action));
});

test("read-only actions do not require confirmation", () => {
  [
    "institutions.list",
    "dashboard.summary",
    "reports.dataset",
    "mutations.status",
    "system.health",
    "auth.me",
    "login"
  ].forEach(action => assert.equal(actionRequiresConfirmation(action), false, action));
});

test("confirmation copy is Malay and action-aware", () => {
  assert.deepEqual(confirmationCopyForAction("users.deactivate"), {
    title: "Sahkan nyahaktif",
    message: "Tindakan ini akan nyahaktif rekod pengguna. Teruskan?",
    confirmLabel: "Ya, nyahaktif",
    cancelLabel: "Batal",
    tone: "danger"
  });

  assert.equal(
    confirmationCopyForAction("aiIntake.create", { subject: "laporan audit UniMAP" }).message,
    "Tindakan ini akan mula analisis AI untuk laporan audit UniMAP. Teruskan?"
  );
});

test("runConfirmedAction blocks handler when user cancels", async () => {
  let calls = 0;
  const result = await runConfirmedAction(
    "findings.delete",
    async () => {
      calls += 1;
      return "done";
    },
    { confirm: async () => false }
  );

  assert.equal(calls, 0);
  assert.equal(result.cancelled, true);
  assert.equal(isActionCancelled(result), true);
});

test("runConfirmedAction executes handler after user confirms", async () => {
  const result = await runConfirmedAction(
    "findings.approve",
    async () => ({ status: "success" }),
    { confirm: async copy => copy.confirmLabel === "Ya, luluskan" }
  );

  assert.deepEqual(result, { status: "success" });
  assert.equal(isActionCancelled(result), false);
});
