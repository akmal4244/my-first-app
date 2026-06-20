/*
 * File Path: assets/js/pages/reports-page.js
 * File Version: SPRAD v2.8-production | malay-localization.1
 * Update Info: 2026-06-20 - Seragamkan teks UI kepada Bahasa Melayu.
 */
import { STORAGE_KEYS } from "../config.js";
import {
  normalizeCleanUrl,
  requireSession,
  setupLogoutButton,
  setupSidebar,
  showToast
} from "../components/app-shell.js";
import { buildReportCsv, getWorkflowStatusLabel } from "../core/audit-workflow-utils.js";
import { getReportDataset } from "../services/audit-service.js";

normalizeCleanUrl("reports");
ensureShell();
const session = requireSession({ permissions: ["reports.view"], fallback: "form" });
let currentReport = null;
if (session) init();

async function init() {
  setupLogoutButton();
  setupSidebar("reports", session);
  document.querySelector("#refreshBtn")?.addEventListener("click", () => loadReport({ force: true }));
  document.querySelector("#printBtn")?.addEventListener("click", () => window.print());
  document.querySelector("#csvBtn")?.addEventListener("click", downloadCsv);
  document.querySelector("#includeDraft")?.addEventListener("change", () => loadReport({ force: true }));
  await loadReport();
}

async function loadReport({ force = false } = {}) {
  const cached = readCache();
  if (cached && !force) render(cached, "Cache tempatan");
  else renderLoading();

  try {
    const includeDraft = document.querySelector("#includeDraft")?.checked || false;
    const report = await getReportDataset(session.token, { includeDraft });
    writeCache(report);
    render(report, "Dikemaskini");
  } catch (err) {
    showToast("Ralat laporan", err.message || "Laporan tidak dapat dimuatkan.", "error");
    if (!cached) renderError();
  }
}

function render(report = {}, statusText = "-") {
  currentReport = report;
  const overall = report.overall || {};
  setText("cacheStatus", statusText);
  setText("reportTitle", report.institution?.report_title || "Analisis Penilaian Risiko Audit Dalam");
  setText("generatedAt", formatDate(report.generated_at));
  setText("totalFindings", overall.total_findings || 0);
  setText("overallLevel", overall.overall_level || "Rendah");
  setText("overdueActions", overall.overdue_actions || 0);
  setText("awaitingVerification", overall.awaiting_verification || 0);
  renderFindings(report.findings || []);
  renderActions(report.actions || []);
  renderCategories(report.categories || []);
}

function renderFindings(findings) {
  const list = document.querySelector("#findingList");
  if (!findings.length) {
    list.innerHTML = `<p class="text-sm font-bold text-slate-500">Tiada penemuan untuk laporan ini.</p>`;
    return;
  }
  list.innerHTML = findings.slice(0, 5).map(finding => `
    <li class="rounded-xl border border-slate-200 bg-white p-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div><p class="text-xs font-extrabold uppercase tracking-widest text-blue-600">${escapeHtml(finding.finding_no || finding.id)}</p><h3 class="mt-1 font-extrabold text-slate-900">${escapeHtml(finding.title)}</h3><p class="mt-2 text-sm font-semibold leading-6 text-slate-500">${escapeHtml(finding.issue_description || "-")}</p></div>
        <span class="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-extrabold uppercase text-blue-700">${escapeHtml(getWorkflowStatusLabel(finding.workflow_status))}</span>
      </div>
    </li>
  `).join("");
}

function renderActions(actions) {
  const list = document.querySelector("#actionList");
  if (!actions.length) {
    list.innerHTML = `<p class="text-sm font-bold text-slate-500">Tiada tindakan pembetulan direkodkan.</p>`;
    return;
  }
  list.innerHTML = actions.slice(0, 5).map(action => `
    <li class="rounded-xl border border-slate-200 bg-white p-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div><h3 class="font-extrabold text-slate-900">${escapeHtml(action.action_text)}</h3><p class="mt-2 text-sm font-semibold text-slate-500">${escapeHtml(action.owner_name || "Tiada pemilik")} · Sasaran ${escapeHtml(action.target_date || "-")}</p></div>
        <span class="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-extrabold uppercase text-emerald-700">${escapeHtml(getWorkflowStatusLabel(action.status))}</span>
      </div>
    </li>
  `).join("");
}

function renderCategories(categories) {
  const list = document.querySelector("#categoryList");
  if (!categories.length) {
    list.innerHTML = `<p class="text-sm font-bold text-slate-500">Tiada kategori risiko.</p>`;
    return;
  }
  list.innerHTML = categories.slice(0, 5).map(item => `
    <li class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
      <div><p class="font-extrabold text-slate-900">${escapeHtml(item.category)}</p><p class="mt-1 text-xs font-bold text-slate-500">${item.issue_count} isu · ${item.percent_total}%</p></div>
      <span class="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-extrabold uppercase text-blue-700">${escapeHtml(item.category_level)}</span>
    </li>
  `).join("");
}

function renderLoading() {
  setText("cacheStatus", "Memuat...");
  ["findingList", "actionList", "categoryList"].forEach(id => {
    document.querySelector(`#${id}`).innerHTML = `<div class="h-20 animate-pulse rounded-xl bg-slate-100"></div>`;
  });
}

function renderError() {
  setText("cacheStatus", "Ralat");
  document.querySelector("#findingList").innerHTML = `<p class="text-sm font-bold text-red-600">Laporan tidak dapat dimuatkan.</p>`;
}

function downloadCsv() {
  if (!currentReport) return;
  const csv = buildReportCsv(currentReport);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `sprad-laporan-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function readCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.reportsCache);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(report) {
  localStorage.setItem(STORAGE_KEYS.reportsCache, JSON.stringify(report));
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("ms-MY");
}

function setText(id, value) {
  const element = document.querySelector(`#${id}`);
  if (element) element.textContent = value;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function ensureShell() {
  document.body.className = "min-h-screen bg-slate-50 text-slate-800 antialiased";
  document.body.innerHTML = `
    <div id="toast" class="fixed right-4 top-20 z-[100] hidden w-[calc(100%-2rem)] max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80"><div class="flex gap-3"><div id="toastIcon" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><i class="fa-solid fa-circle-info"></i></div><div><p id="toastTitle" class="text-sm font-extrabold text-slate-900"></p><p id="toastText" class="mt-1 text-xs font-semibold leading-5 text-slate-500"></p></div></div></div>
    <header class="sticky top-0 z-50 h-16 border-b border-gray-100 bg-white shadow-sm"><div class="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"><a href="./" class="flex items-center gap-3"><img src="https://www.akm.gov.my/templates/yootheme/cache/91/JATA%20NEGARA%20AI-01-91eac591.webp" alt="Jata Negara" class="h-10 w-10 object-contain"><div><p class="text-base font-extrabold tracking-tight text-slate-800">SPRAD</p><p class="text-[9px] font-semibold uppercase tracking-widest text-slate-500">Sistem Penilaian Risiko Audit Dalam</p></div></a><button id="logout" type="button" class="rounded-full bg-slate-900 px-4 py-2 text-xs font-extrabold text-white">Log keluar</button></div></header>
    <main class="sprad-shell mx-auto grid w-full max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:px-8">
      ${sidebar()}
      <section class="sprad-content grid content-start gap-5">
        <div class="brand-cover rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p class="text-xs font-extrabold uppercase tracking-widest text-blue-600">Fasa 7</p><h1 id="reportTitle" class="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Analisis Penilaian Risiko Audit Dalam</h1><p class="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-500">Laporan ringkas boleh cetak dan dieksport untuk semakan pengurusan.</p></div><div class="flex flex-wrap gap-2"><button id="refreshBtn" class="rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-extrabold text-slate-600"><i class="fa-solid fa-rotate-right mr-2"></i>Muat semula</button><button id="printBtn" class="rounded-full bg-slate-900 px-4 py-3 text-xs font-extrabold text-white"><i class="fa-solid fa-print mr-2"></i>Cetak</button><button id="csvBtn" class="rounded-full bg-blue-600 px-4 py-3 text-xs font-extrabold text-white"><i class="fa-solid fa-file-csv mr-2"></i>CSV</button></div></div></div>
        <div class="admin-dashboard-grid"><article class="admin-stat-card"><div class="admin-stat-topline"><p class="admin-stat-label">Dijana</p><div class="admin-stat-icon"><i class="fa-solid fa-clock"></i></div></div><div><h3 id="generatedAt" class="admin-stat-note">-</h3></div></article><article class="admin-stat-card admin-stat-card--primary"><div class="admin-stat-topline"><p class="admin-stat-label">Penemuan</p><div class="admin-stat-icon"><i class="fa-solid fa-triangle-exclamation"></i></div></div><div><h3 id="totalFindings" class="admin-stat-value">0</h3></div></article><article class="admin-stat-card"><div class="admin-stat-topline"><p class="admin-stat-label">Tahap</p><div class="admin-stat-icon"><i class="fa-solid fa-layer-group"></i></div></div><div><h3 id="overallLevel" class="admin-stat-value">-</h3></div></article><article class="admin-stat-card"><div class="admin-stat-topline"><p class="admin-stat-label">Lewat</p><div class="admin-stat-icon"><i class="fa-solid fa-hourglass-half"></i></div></div><div><h3 id="overdueActions" class="admin-stat-value">0</h3></div></article><article class="admin-stat-card"><div class="admin-stat-topline"><p class="admin-stat-label">Pengesahan</p><span class="admin-stat-badge admin-stat-badge--warning">Semakan</span></div><div><h3 id="awaitingVerification" class="admin-stat-value">0</h3><p id="cacheStatus" class="admin-stat-note">-</p></div></article></div>
        <label class="inline-flex max-w-max items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-extrabold text-slate-600"><input id="includeDraft" type="checkbox" class="h-4 w-4">Masukkan draf dalam laporan</label>
        <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]"><div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 class="text-lg font-extrabold text-slate-900">Penemuan Utama (5 rekod pertama)</h2><ul id="findingList" class="mt-5 grid gap-3"></ul></div><div class="grid gap-4"><div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 class="text-lg font-extrabold text-slate-900">Kategori</h2><ul id="categoryList" class="mt-5 grid gap-3"></ul></div><div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 class="text-lg font-extrabold text-slate-900">Tindakan</h2><ul id="actionList" class="mt-5 grid gap-3"></ul></div></div></div>
      </section>
    </main>`;
}

function sidebar() {
  return `<aside class="sprad-sidebar self-start lg:sticky lg:top-16"><div class="flex items-center justify-between gap-3"><p class="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Ruang kerja</p><span id="sidebarRole" class="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-blue-700">SPRAD</span></div><div class="mt-4 space-y-2">${[
    ["dashboard", "fa-chart-line", "Papan Pemuka"], ["form", "fa-clipboard-list", "Penilaian risiko"], ["ai-intake", "fa-wand-magic-sparkles", "Input AI"], ["audit-cycles", "fa-calendar-days", "Kitaran audit"], ["audits", "fa-file-signature", "Audit"], ["findings", "fa-triangle-exclamation", "Penemuan"], ["corrective-actions", "fa-list-check", "Tindakan"], ["reports", "fa-print", "Laporan"], ["audit-logs", "fa-shield-halved", "Log audit"], ["institutions", "fa-building-columns", "Institusi"], ["org-units", "fa-sitemap", "PTJ / Unit"], ["users", "fa-users-gear", "Pengguna"], ["settings", "fa-sliders", "Tetapan"]
  ].map(([route, icon, label]) => `<a href="${route}" data-nav-route="${route}" class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-slate-500"><i class="fa-solid ${icon} w-4"></i>${label}</a>`).join("")}</div></aside>`;
}
