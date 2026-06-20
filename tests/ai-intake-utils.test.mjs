/*
 * File Path: tests/ai-intake-utils.test.mjs
 * File Version: SPRAD v2.8-production | metadata-header.1
 * Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  AI_UPLOAD_MAX_BYTES,
  buildAiIntakeMutation,
  summarizeAiReview,
  validateAiUploadDraft
} from "../assets/js/core/ai-intake-utils.js";

test("validates AI intake upload files before sending to Apps Script", () => {
  assert.equal(validateAiUploadDraft({ fileName: "", mimeType: "application/pdf", size: 100 }).ok, false);
  assert.equal(validateAiUploadDraft({ fileName: "audit.exe", mimeType: "application/x-msdownload", size: 100 }).ok, false);
  assert.equal(validateAiUploadDraft({ fileName: "besar.pdf", mimeType: "application/pdf", size: AI_UPLOAD_MAX_BYTES + 1 }).ok, false);
  assert.deepEqual(
    validateAiUploadDraft({ fileName: "laporan.pdf", mimeType: "application/pdf", size: 1024 }),
    {
      ok: true,
      data: {
        file_name: "laporan.pdf",
        mime_type: "application/pdf",
        file_size: 1024
      }
    }
  );
});

test("builds a no-cors mutation payload for Gemini document intake", () => {
  const mutation = buildAiIntakeMutation({
    token: "token-1",
    requestIdFactory: () => "req-ai-1",
    sourceTitle: "Laporan Audit Universiti",
    file: {
      fileName: "laporan.pdf",
      mimeType: "application/pdf",
      size: 2048,
      base64: "JVBERi0x"
    }
  });

  assert.equal(mutation.action, "aiIntake.create");
  assert.equal(mutation.request_id, "req-ai-1");
  assert.equal(mutation.token, "token-1");
  assert.equal(mutation.payload.file_name, "laporan.pdf");
  assert.equal(mutation.payload.file_base64, "JVBERi0x");
  assert.equal(mutation.payload.source_title, "Laporan Audit Universiti");
});

test("summarizes automatic review flags for AI-generated finding drafts", () => {
  const review = summarizeAiReview({
    title: "",
    issue_description: "Kawalan tidak lengkap.",
    root_cause: "",
    impact_description: "Risiko ketidakpatuhan.",
    recommendation: "",
    confidence: 0.62,
    likelihood: 4,
    impact: 4
  });

  assert.equal(review.status, "perlu_semakan");
  assert.equal(review.score, 55);
  assert.deepEqual(review.flags, [
    "missing_title",
    "missing_root_cause",
    "missing_recommendation",
    "low_confidence",
    "high_risk"
  ]);
});
