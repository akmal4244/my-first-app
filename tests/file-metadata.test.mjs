/*
 * File Path: tests/file-metadata.test.mjs
 * File Version: SPRAD v2.8-production | metadata-header.1
 * Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname } from "node:path";
import test from "node:test";

const VERSION = "SPRAD v2.8-production | metadata-header.1";
const UPDATE_INFO = "2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.";

function trackedFiles() {
  const files = execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
  if (existsSync("tests/file-metadata.test.mjs") && !files.includes("tests/file-metadata.test.mjs")) {
    files.push("tests/file-metadata.test.mjs");
  }
  return files;
}

function hasTextMetadataHeader(file, source) {
  const headerWindow = source.slice(0, 500);
  return headerWindow.includes(`File Path: ${file}`)
    && headerWindow.includes(`File Version: ${VERSION}`)
    && headerWindow.includes(`Update Info: ${UPDATE_INFO}`);
}

function hasJsonMetadata(file, source) {
  const data = JSON.parse(source);
  return data._spradFileInfo?.filePath === file
    && data._spradFileInfo?.fileVersion === VERSION
    && data._spradFileInfo?.updateInfo === UPDATE_INFO;
}

test("all tracked project files declare path, version and update info at the top", () => {
  const missing = [];

  for (const file of trackedFiles()) {
    const source = readFileSync(file, "utf8");
    const extension = extname(file).toLowerCase();
    const ok = extension === ".json"
      ? hasJsonMetadata(file, source)
      : hasTextMetadataHeader(file, source);

    if (!ok) missing.push(file);
  }

  assert.deepEqual(missing, []);
});
