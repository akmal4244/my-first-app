/*
 * File Path: assets/js/core/api.js
 * File Version: SPRAD v2.8-production | metadata-header.1
 * Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
 */
import { getApiUrl } from "../config.js";

export function buildApiUrl(params, baseUrl = getApiUrl()) {
  return `${baseUrl}?${new URLSearchParams(params).toString()}`;
}

export function buildLogoutUrl(token, baseUrl = getApiUrl()) {
  return buildApiUrl({ action: "auth.logout", token }, baseUrl);
}

export async function getJson(params, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutMs = Number(options.timeoutMs || 15000);
  const timer = controller && timeoutMs > 0
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;
  try {
    const response = await fetchImpl(buildApiUrl(params, options.baseUrl), controller ? { signal: controller.signal } : undefined);
    const data = await response.json();
    if (!data.ok) {
      const error = data.error?.message || data.error || "Permintaan API gagal.";
      throw new Error(error);
    }
    return data;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function revokeSession(token, options = {}) {
  if (!token) return false;
  const fetchImpl = options.fetchImpl || fetch;
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutMs = Number(options.timeoutMs || 1500);
  const timer = controller && timeoutMs > 0
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;
  try {
    await fetchImpl(buildLogoutUrl(token, options.baseUrl), {
      keepalive: true,
      ...(controller ? { signal: controller.signal } : {})
    });
    return true;
  } catch {
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function unwrapData(response, fallback = null) {
  if (response?.data !== undefined) return response.data;
  return response ?? fallback;
}
