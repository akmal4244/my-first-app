/*
 * File Path: assets/js/services/system-service.js
 * File Version: SPRAD v2.8-production | metadata-header.1
 * Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
 */
import { getJson } from "../core/api.js";
import { normalizeHealthResponse } from "../core/system-health-utils.js";

export async function getSystemHealth(token) {
  const response = await getJson({ action: "system.health", token });
  return normalizeHealthResponse(response);
}
