/*
 * File Path: tests/api.test.mjs
 * File Version: SPRAD v2.8-production | metadata-header.1
 * Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildApiUrl,
  buildLogoutUrl,
  getJson,
  revokeSession
} from "../assets/js/core/api.js";

test("builds encoded Apps Script GET urls", () => {
  assert.equal(
    buildApiUrl({ action: "auth.logout", token: "abc 123" }, "https://example.test/exec"),
    "https://example.test/exec?action=auth.logout&token=abc+123"
  );
  assert.equal(
    buildLogoutUrl("secret token", "https://example.test/exec"),
    "https://example.test/exec?action=auth.logout&token=secret+token"
  );
});

test("getJson supports injected fetch and structured API errors", async () => {
  const ok = await getJson({ action: "config.get" }, {
    baseUrl: "https://example.test/exec",
    fetchImpl: async url => ({
      json: async () => ({ ok: true, data: { url } })
    })
  });
  assert.equal(ok.data.url, "https://example.test/exec?action=config.get");

  await assert.rejects(
    () => getJson({ action: "bad" }, {
      baseUrl: "https://example.test/exec",
      fetchImpl: async () => ({
        json: async () => ({ ok: false, error: { message: "Tidak dibenarkan." } })
      })
    }),
    /Tidak dibenarkan/
  );
});

test("revokes session through auth.logout without throwing on network failure", async () => {
  const calls = [];
  const result = await revokeSession("token-1", {
    baseUrl: "https://example.test/exec",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return { json: async () => ({ ok: true }) };
    }
  });
  assert.equal(result, true);
  assert.equal(calls[0].url, "https://example.test/exec?action=auth.logout&token=token-1");
  assert.equal(calls[0].options.keepalive, true);

  const failed = await revokeSession("token-2", {
    fetchImpl: async () => {
      throw new Error("offline");
    }
  });
  assert.equal(failed, false);
  assert.equal(await revokeSession(""), false);
});
