/*
 * File Path: tests/permissions.test.mjs
 * File Version: SPRAD v2.8-production | metadata-header.1
 * Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  canAccessInstitution,
  canManageFinding,
  getVisibleNavLinks,
  hasPermission,
  hasRoleAtLeast,
  normalizeRole
} from "../assets/js/core/permissions.js";

test("maps legacy roles into SPRAD V2 roles", () => {
  assert.equal(normalizeRole("pentadbir"), "institution_admin");
  assert.equal(normalizeRole("pengguna"), "auditor");
  assert.equal(normalizeRole("reviewer"), "reviewer");
});

test("checks role permissions and rank hierarchy", () => {
  assert.equal(hasPermission("institution_admin", "users.manage"), true);
  assert.equal(hasPermission("auditor", "users.manage"), false);
  assert.equal(hasRoleAtLeast("reviewer", "auditor"), true);
  assert.equal(hasRoleAtLeast("auditor", "reviewer"), false);
});

test("enforces institution scope except for super admin", () => {
  assert.equal(canAccessInstitution({
    role: "super_admin",
    institution_id: "inst_a"
  }, "inst_b"), true);
  assert.equal(canAccessInstitution({
    role: "auditor",
    institution_id: "inst_a"
  }, "inst_b"), false);
});

test("allows auditor to manage only own draft or returned findings", () => {
  const auditor = { id: "user_1", role: "auditor", institution_id: "inst_a" };
  assert.equal(canManageFinding(auditor, {
    institution_id: "inst_a",
    created_by: "user_1",
    workflow_status: "draft"
  }), true);
  assert.equal(canManageFinding(auditor, {
    institution_id: "inst_a",
    created_by: "user_1",
    workflow_status: "approved"
  }), false);
  assert.equal(canManageFinding(auditor, {
    institution_id: "inst_a",
    created_by: "user_2",
    workflow_status: "draft"
  }), false);
});

test("filters sidebar navigation by role permissions", () => {
  const auditorRoutes = getVisibleNavLinks("auditor").map(link => link.route);
  assert.deepEqual(auditorRoutes, [
    "dashboard",
    "form",
    "ai-intake",
    "findings",
    "corrective-actions",
    "reports"
  ]);

  const viewerRoutes = getVisibleNavLinks("viewer").map(link => link.route);
  assert.deepEqual(viewerRoutes, ["dashboard", "reports"]);

  const adminRoutes = getVisibleNavLinks("institution_admin").map(link => link.route);
  assert.equal(adminRoutes.includes("form"), true);
  assert.equal(adminRoutes.includes("ai-intake"), true);
  assert.equal(adminRoutes.includes("users"), true);
  assert.equal(adminRoutes.includes("settings"), true);
  assert.equal(adminRoutes.includes("system-health"), true);
  assert.equal(adminRoutes.includes("institutions"), false);
});
