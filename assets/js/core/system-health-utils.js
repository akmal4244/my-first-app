/*
 * File Path: assets/js/core/system-health-utils.js
 * File Version: SPRAD v2.8-production | metadata-header.1
 * Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
 */
export function normalizeHealthResponse(response = {}) {
  const health = response.data?.health || response.health || {};
  const checks = normalizeItems(health.checks);
  const sheets = normalizeItems(health.sheets);
  const okChecks = checks.filter(item => item.ok).length;
  const okSheets = sheets.filter(item => item.ok).length;
  const hasAttention = okChecks < checks.length || okSheets < sheets.length;

  return {
    status: hasAttention ? "attention" : clean(health.status) || "ready",
    schemaVersion: clean(health.schema_version || health.schemaVersion),
    completedPhases: clean(health.completed_phases || health.completedPhases),
    generatedAt: clean(health.generated_at || health.generatedAt),
    checks,
    sheets,
    okChecks,
    totalChecks: checks.length,
    okSheets,
    totalSheets: sheets.length
  };
}

export function healthTone(status) {
  const normalized = clean(status).toLowerCase();
  const tones = {
    ready: {
      label: "Sedia",
      badge: "bg-emerald-50 text-emerald-700",
      icon: "fa-circle-check",
      card: "border-emerald-200 bg-emerald-50"
    },
    attention: {
      label: "Perlu perhatian",
      badge: "bg-amber-50 text-amber-700",
      icon: "fa-triangle-exclamation",
      card: "border-amber-200 bg-amber-50"
    }
  };
  return tones[normalized] || {
    label: "Tidak diketahui",
    badge: "bg-slate-100 text-slate-600",
    icon: "fa-circle-question",
    card: "border-slate-200 bg-slate-50"
  };
}

function normalizeItems(items) {
  return Array.isArray(items)
    ? items.map(item => ({ ...item, ok: Boolean(item.ok) }))
    : [];
}

function clean(value) {
  return String(value ?? "").trim();
}
