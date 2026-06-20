/*
 * File Path: assets/js/config.js
 * File Version: SPRAD v2.8-production | metadata-header.1
 * Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
 */
export const APP_CONFIG = Object.freeze({
  appName: "Sistem Penilaian Risiko Audit Dalam",
  shortName: "SPRAD",
  schemaVersion: "2.8-production",
  customDomain: "akmal4244.github.io/sprad",
  apiUrl: "https://script.google.com/macros/s/AKfycbyvO77bqueo45EPyAKW6jUK8R5AEIVvFLjqGhlK1Sv5s8N6ay7anY9QhGLSZaIznApkiQ/exec",
  logoUrl: "https://www.akm.gov.my/templates/yootheme/cache/91/JATA%20NEGARA%20AI-01-91eac591.webp"
});

export const STORAGE_KEYS = Object.freeze({
  token: "token",
  role: "role",
  v2Role: "spradV2Role",
  userId: "spradUserId",
  institutionId: "spradInstitutionId",
  rememberMe: "spradRememberMe",
  username: "spradUsername",
  contactsCache: "spradContactsCache",
  institutionsCache: "spradInstitutionsCache",
  orgUnitsCache: "spradOrgUnitsCache",
  usersCache: "spradUsersCache",
  settingsCache: "spradSettingsCache",
  auditCyclesCache: "spradAuditCyclesCacheV26",
  auditsCache: "spradAuditsCacheV26",
  findingsCache: "spradFindingsCacheV26",
  correctiveActionsCache: "spradCorrectiveActionsCacheV26",
  auditLogsCache: "spradAuditLogsCacheV26",
  dashboardCache: "spradDashboardCacheV26",
  reportsCache: "spradReportsCacheV26"
});

export const LEGACY_ROLES = Object.freeze({
  admin: "pentadbir",
  user: "pengguna"
});

export const V2_ROLES = Object.freeze({
  superAdmin: "super_admin",
  institutionAdmin: "institution_admin",
  auditor: "auditor",
  reviewer: "reviewer",
  viewer: "viewer"
});

export function getApiUrl() {
  return APP_CONFIG.apiUrl;
}
