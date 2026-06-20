/*
 * File Path: assets/js/core/permissions.js
 * File Version: SPRAD v2.8-production | metadata-header.1
 * Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
 */
export const LEGACY_ROLE_MAP = Object.freeze({
  pentadbir: "institution_admin",
  pengguna: "auditor"
});

export const ROLE_RANK = Object.freeze({
  viewer: 1,
  auditor: 2,
  reviewer: 3,
  institution_admin: 4,
  super_admin: 5
});

export const ROLE_PERMISSIONS = Object.freeze({
  super_admin: [
    "institutions.manage",
    "institution_scope.all",
    "masters.manage",
    "users.manage",
    "audit.manage",
    "findings.manage",
    "findings.review",
    "actions.verify",
    "reports.view"
  ],
  institution_admin: [
    "masters.manage",
    "users.manage",
    "audit.manage",
    "findings.manage",
    "findings.review",
    "actions.verify",
    "reports.view"
  ],
  reviewer: [
    "findings.review",
    "actions.verify",
    "reports.view"
  ],
  auditor: [
    "findings.create",
    "findings.edit_own",
    "actions.update_own",
    "reports.view"
  ],
  viewer: [
    "reports.view"
  ]
});

export const NAV_LINKS = Object.freeze([
  { route: "dashboard", icon: "fa-chart-line", label: "Dashboard", permissions: ["reports.view"] },
  { route: "form", icon: "fa-clipboard-list", label: "Penilaian risiko", permissions: ["findings.create", "findings.manage"] },
  { route: "ai-intake", icon: "fa-wand-magic-sparkles", label: "AI Intake", permissions: ["findings.create", "findings.manage"] },
  { route: "audit-cycles", icon: "fa-calendar-days", label: "Kitaran audit", permissions: ["audit.manage"] },
  { route: "audits", icon: "fa-file-signature", label: "Audit", permissions: ["audit.manage"] },
  { route: "findings", icon: "fa-triangle-exclamation", label: "Penemuan", permissions: ["findings.create", "findings.review", "findings.manage"] },
  { route: "corrective-actions", icon: "fa-list-check", label: "Tindakan", permissions: ["findings.create", "findings.review", "actions.verify"] },
  { route: "reports", icon: "fa-print", label: "Laporan", permissions: ["reports.view"] },
  { route: "audit-logs", icon: "fa-shield-halved", label: "Log audit", permissions: ["findings.review", "users.manage"] },
  { route: "institutions", icon: "fa-building-columns", label: "Institusi", permissions: ["institutions.manage"] },
  { route: "org-units", icon: "fa-sitemap", label: "PTJ / Unit", permissions: ["masters.manage"] },
  { route: "users", icon: "fa-users-gear", label: "Pengguna", permissions: ["users.manage"] },
  { route: "settings", icon: "fa-sliders", label: "Tetapan", permissions: ["masters.manage"] },
  { route: "system-health", icon: "fa-heart-pulse", label: "Status sistem", permissions: ["users.manage"] }
]);

export function normalizeRole(role) {
  const normalized = String(role || "").trim().toLowerCase();
  return LEGACY_ROLE_MAP[normalized] || normalized || "viewer";
}

export function hasPermission(role, permission) {
  return (ROLE_PERMISSIONS[normalizeRole(role)] || []).includes(permission);
}

export function hasRoleAtLeast(role, minimumRole) {
  const currentRank = ROLE_RANK[normalizeRole(role)] || 0;
  const minimumRank = ROLE_RANK[normalizeRole(minimumRole)] || 0;
  return currentRank >= minimumRank;
}

export function getVisibleNavLinks(role) {
  const normalizedRole = normalizeRole(role);
  return NAV_LINKS.filter(link =>
    !link.permissions?.length ||
    link.permissions.some(permission => hasPermission(normalizedRole, permission))
  );
}

export function canAccessInstitution(user, institutionId) {
  const role = normalizeRole(user?.role);
  if (role === "super_admin") return true;
  return String(user?.institution_id || "") === String(institutionId || "");
}

export function canManageFinding(user, finding) {
  const role = normalizeRole(user?.role);
  if (!canAccessInstitution(user, finding?.institution_id)) return false;
  if (["super_admin", "institution_admin", "reviewer"].includes(role)) return true;
  if (role !== "auditor") return false;
  const workflowStatus = String(finding?.workflow_status || "draft").toLowerCase();
  const ownFinding = String(finding?.created_by || "") === String(user?.id || "");
  return ownFinding && ["draft", "returned"].includes(workflowStatus);
}
