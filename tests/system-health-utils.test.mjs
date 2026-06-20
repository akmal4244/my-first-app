/*
 * File Path: tests/system-health-utils.test.mjs
 * File Version: SPRAD v2.8-production | metadata-header.1
 * Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  healthTone,
  normalizeHealthResponse
} from "../assets/js/core/system-health-utils.js";

test("normalizes production health responses with sheet and check summaries", () => {
  const health = normalizeHealthResponse({
    data: {
      health: {
        status: "ready",
        schema_version: "2.8-production",
        checks: [
          { key: "password_pepper", label: "Password pepper", ok: true },
          { key: "gemini_api_key", label: "Gemini API", ok: false }
        ],
        sheets: [
          { name: "users", ok: true, rows: 3, missing_headers: [] },
          { name: "sessions", ok: false, rows: 0, missing_headers: ["token_hash"] }
        ]
      }
    }
  });

  assert.equal(health.status, "attention");
  assert.equal(health.schemaVersion, "2.8-production");
  assert.equal(health.okChecks, 1);
  assert.equal(health.totalChecks, 2);
  assert.equal(health.okSheets, 1);
  assert.equal(health.totalSheets, 2);
});

test("maps health status to stable UI tones", () => {
  assert.equal(healthTone("ready").label, "Sedia");
  assert.equal(healthTone("attention").label, "Perlu perhatian");
  assert.equal(healthTone("unknown").label, "Tidak diketahui");
});
