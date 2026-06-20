/*
 * File Path: tests/storage-validators.test.mjs
 * File Version: SPRAD v2.8-production | metadata-header.1
 * Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildScopedCacheKey,
  clearSpradStorage,
  readJsonStorage,
  writeJsonStorage
} from "../assets/js/core/storage.js";
import {
  validateEmail,
  validateRequiredFields,
  validateRiskScale
} from "../assets/js/core/validators.js";

function createMemoryStorage(seed = {}) {
  const data = new Map(Object.entries(seed));
  return {
    get length() {
      return data.size;
    },
    key(index) {
      return [...data.keys()][index];
    },
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    }
  };
}

test("builds user and institution scoped cache keys", () => {
  assert.equal(
    buildScopedCacheKey({ userId: "u1", institutionId: "inst_a", resource: "findings" }),
    "sprad:u1:inst_a:findings"
  );
});

test("reads and writes JSON storage safely", () => {
  const storage = createMemoryStorage();
  writeJsonStorage(storage, "sprad:test", { ok: true });
  assert.deepEqual(readJsonStorage(storage, "sprad:test"), { ok: true });
  storage.setItem("sprad:bad", "{");
  assert.deepEqual(readJsonStorage(storage, "sprad:bad", []), []);
  assert.equal(storage.getItem("sprad:bad"), null);
});

test("clears SPRAD storage keys only", () => {
  const storage = createMemoryStorage({
    token: "abc",
    role: "auditor",
    spradUsername: "akmal4244",
    "sprad:u1:inst_a:findings": "[]",
    otherApp: "keep"
  });
  clearSpradStorage(storage);
  assert.equal(storage.getItem("token"), null);
  assert.equal(storage.getItem("spradUsername"), null);
  assert.equal(storage.getItem("otherApp"), "keep");
});

test("validates email, risk scale and required fields", () => {
  assert.equal(validateEmail("user@example.com"), "user@example.com");
  assert.throws(() => validateEmail("bad"), /E-mel tidak sah/);
  assert.equal(validateRiskScale("4", "Kesan"), 4);
  assert.throws(() => validateRiskScale("5", "Kesan"), /Kesan mesti antara 1 hingga 4/);
  assert.deepEqual(validateRequiredFields({ name: "A", email: "" }, ["name", "email"]), {
    ok: false,
    errors: { email: "REQUIRED" }
  });
});
