/*
 * File Path: tests/mutation-utils.test.mjs
 * File Version: SPRAD v2.8-production | malay-localization.1
 * Update Info: 2026-06-20 - Kemas kini jangkaan mesej pengesahan kepada Bahasa Melayu.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMutationRequest,
  pollMutationReceipt
} from "../assets/js/core/mutation-utils.js";

test("builds mutation request with a stable request id and nested payload", () => {
  const request = buildMutationRequest("findings.create", "token-123", {
    title: "Isu audit"
  }, () => "req-123");

  assert.deepEqual(request, {
    action: "findings.create",
    request_id: "req-123",
    requestId: "req-123",
    token: "token-123",
    payload: {
      title: "Isu audit"
    }
  });
});

test("polls mutation receipts until success", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    return {
      async json() {
        return calls.length === 1
          ? { ok: false, error: "receipt not found" }
          : { ok: true, receipt: { status: "success", entity_id: "finding-1" } };
      }
    };
  };

  const receipt = await pollMutationReceipt({
    url: "https://script.google.com/macros/s/demo/exec",
    token: "token-123",
    requestId: "req-123",
    attempts: 3,
    delayMs: 1,
    sleep: async () => {},
    fetchImpl
  });

  assert.equal(receipt.status, "success");
  assert.equal(receipt.entity_id, "finding-1");
  assert.equal(calls.length, 2);
  assert.match(calls[0], /action=mutations\.status/);
  assert.match(calls[0], /requestId=req-123/);
});

test("polls mutation receipts when Apps Script returns Malay pending text", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    return {
      async json() {
        return calls.length === 1
          ? { ok: false, error: "Resit simpanan belum ditemui." }
          : { ok: true, receipt: { status: "success", entity_id: "finding-2" } };
      }
    };
  };

  const receipt = await pollMutationReceipt({
    url: "https://script.google.com/macros/s/demo/exec",
    token: "token-123",
    requestId: "req-124",
    attempts: 3,
    delayMs: 1,
    sleep: async () => {},
    fetchImpl
  });

  assert.equal(receipt.status, "success");
  assert.equal(receipt.entity_id, "finding-2");
  assert.equal(calls.length, 2);
});

test("does not report success when receipt polling times out", async () => {
  const receipt = await pollMutationReceipt({
    url: "https://script.google.com/macros/s/demo/exec",
    token: "token-123",
    requestId: "missing",
    attempts: 2,
    delayMs: 1,
    sleep: async () => {},
    fetchImpl: async () => ({
      async json() {
        return { ok: false, error: "receipt not found" };
      }
    })
  });

  assert.deepEqual(receipt, {
    status: "timeout",
    error: "Status simpanan belum dapat disahkan."
  });
});

test("throws when mutation receipt returns an error status", async () => {
  await assert.rejects(
    pollMutationReceipt({
      url: "https://script.google.com/macros/s/demo/exec",
      token: "token-123",
      requestId: "req-error",
      attempts: 1,
      delayMs: 1,
      sleep: async () => {},
      fetchImpl: async () => ({
        async json() {
          return {
            ok: true,
            receipt: {
              status: "error",
              error_message: "invalid token"
            }
          };
        }
      })
    }),
    /invalid token/
  );
});

test("throws immediately for non-pending polling errors", async () => {
  await assert.rejects(
    pollMutationReceipt({
      url: "https://script.google.com/macros/s/demo/exec",
      token: "bad-token",
      requestId: "req-invalid",
      attempts: 3,
      delayMs: 1,
      sleep: async () => {},
      fetchImpl: async () => ({
        async json() {
          return { ok: false, error: "invalid token" };
        }
      })
    }),
    /invalid token/
  );
});

test("reports unsupported receipt polling when Apps Script returns Malay unknown action", async () => {
  const receipt = await pollMutationReceipt({
    url: "https://script.google.com/macros/s/demo/exec",
    token: "token-123",
    requestId: "req-malay-legacy",
    attempts: 3,
    delayMs: 1,
    sleep: async () => {},
    fetchImpl: async () => ({
      async json() {
        return { ok: false, error: "Tindakan tidak diketahui." };
      }
    })
  });

  assert.deepEqual(receipt, {
    status: "unsupported",
    error: "Pelayan belakang belum dikemaskini untuk pengesahan automatik. Sila kemaskini Apps Script dan deploy semula Aplikasi Web."
  });
});

test("reports unsupported receipt polling for older Apps Script deployments", async () => {
  const receipt = await pollMutationReceipt({
    url: "https://script.google.com/macros/s/demo/exec",
    token: "token-123",
    requestId: "req-legacy",
    attempts: 3,
    delayMs: 1,
    sleep: async () => {},
    fetchImpl: async () => ({
      async json() {
        return { ok: false, error: "unknown action" };
      }
    })
  });

  assert.deepEqual(receipt, {
    status: "unsupported",
    error: "Pelayan belakang belum dikemaskini untuk pengesahan automatik. Sila kemaskini Apps Script dan deploy semula Aplikasi Web."
  });
});
