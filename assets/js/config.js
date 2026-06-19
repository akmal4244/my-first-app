export const APP_CONFIG = Object.freeze({
  appName: "Sistem Penilaian Risiko Audit Dalam",
  shortName: "SPRAD",
  schemaVersion: "2.0-foundation",
  customDomain: "akmal4244.github.io/sprad",
  apiUrl: "https://script.google.com/macros/s/AKfycbyvO77bqueo45EPyAKW6jUK8R5AEIVvFLjqGhlK1Sv5s8N6ay7anY9QhGLSZaIznApkiQ/exec",
  logoUrl: "https://www.akm.gov.my/templates/yootheme/cache/91/JATA%20NEGARA%20AI-01-91eac591.webp"
});

export const STORAGE_KEYS = Object.freeze({
  token: "token",
  role: "role",
  rememberMe: "spradRememberMe",
  username: "spradUsername",
  contactsCache: "spradContactsCache"
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
