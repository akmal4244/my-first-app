/*
 * File Path: tests/ujianme-style-contract.test.mjs
 * File Version: SPRAD v2.8-production | metadata-header.1
 * Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = filePath => fs.readFileSync(path.join(rootDir, filePath), "utf8");

const brandCss = read("brand.css");
const appShellSource = read("assets/js/components/app-shell.js");

test("SPRAD global style follows UjianMe shell tokens", () => {
  [
    ".menu-item",
    ".menu-active",
    ".menu-section",
    ".toast-enter",
    ".loader",
    ".admin-dashboard-grid",
    ".admin-stat-card",
    ".admin-stat-card--primary",
    ".custom-scrollbar"
  ].forEach(selector => assert.match(brandCss, new RegExp(escapeRegex(selector)), `${selector} missing`));

  assert.match(brandCss, /--sprad-blue:\s*#2563eb;/, "accent blue must match UjianMe");
  assert.match(brandCss, /background-color:\s*#f8fafc;/, "body background must match UjianMe");
  assert.doesNotMatch(brandCss, /body::before/, "SPRAD-specific top stripe must be removed");
  assert.doesNotMatch(brandCss, /content:\s*"SPRAD"/, "SPRAD watermark must be removed");
});

test("sidebar navigation uses UjianMe menu item classes", () => {
  assert.match(appShellSource, /menu-item/, "shared sidebar must render UjianMe menu-item class");
  assert.match(appShellSource, /menu-active/, "shared sidebar must render UjianMe active class");
  assert.doesNotMatch(appShellSource, /rounded-lg bg-blue-50 px-4 py-3 text-sm font-extrabold text-blue-600/, "old custom active nav class should not remain");
});

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
