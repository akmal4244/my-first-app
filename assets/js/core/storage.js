/*
 * File Path: assets/js/core/storage.js
 * File Version: SPRAD v2.8-production | metadata-header.1
 * Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
 */
export function buildScopedCacheKey({ userId, institutionId, resource }) {
  const safeUserId = String(userId || "anonymous").trim() || "anonymous";
  const safeInstitutionId = String(institutionId || "global").trim() || "global";
  const safeResource = String(resource || "cache").trim() || "cache";
  return `sprad:${safeUserId}:${safeInstitutionId}:${safeResource}`;
}

export function readJsonStorage(storage, key, fallback = null) {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    storage?.removeItem(key);
    return fallback;
  }
}

export function writeJsonStorage(storage, key, value) {
  storage?.setItem(key, JSON.stringify(value));
}

export function clearSpradStorage(storage) {
  if (!storage) return;
  const keys = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key) keys.push(key);
  }
  keys
    .filter(key => key === "token" || key === "role" || key.startsWith("sprad") || key.startsWith("sprad:"))
    .forEach(key => storage.removeItem(key));
}
