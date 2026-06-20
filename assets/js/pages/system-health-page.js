/*
 * File Path: assets/js/pages/system-health-page.js
 * File Version: SPRAD v2.8-production | sidebar-panel.1
 * Update Info: 2026-06-20 - Asingkan side menu daripada card kandungan.
 */
import {
  normalizeCleanUrl,
  requireSession,
  setupLogoutButton,
  setupSidebar,
  showToast
} from "../components/app-shell.js";
import { healthTone } from "../core/system-health-utils.js";
import { getSystemHealth } from "../services/system-service.js";

normalizeCleanUrl("system-health");
ensureShell();
const session = requireSession({ permissions: ["users.manage"], fallback: "dashboard" });
if (session) init();

async function init() {
  setupLogoutButton();
  setupSidebar("system-health", session);
  document.querySelector("#refreshBtn")?.addEventListener("click", loadHealth);
  await loadHealth();
}

async function loadHealth() {
  renderLoading();
  try {
    render(await getSystemHealth(session.token));
  } catch (error) {
    showToast("Ralat status", error.message || "Status sistem tidak dapat dimuatkan.", "error");
    renderError(error.message);
  }
}

function render(health) {
  const tone = healthTone(health.status);
  document.querySelector("#statusBadge").className = `inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${tone.badge}`;
  document.querySelector("#statusBadge").innerHTML = `<i class="fa-solid ${tone.icon}"></i>${tone.label}`;
  setText("schemaVersion", health.schemaVersion || "-");
  setText("completedPhases", health.completedPhases || "-");
  setText("generatedAt", formatDate(health.generatedAt));
  setText("checkSummary", `${health.okChecks}/${health.totalChecks}`);
  setText("sheetSummary", `${health.okSheets}/${health.totalSheets}`);

  document.querySelector("#checkList").innerHTML = health.checks.map(renderCheck).join("");
  document.querySelector("#sheetList").innerHTML = health.sheets.map(renderSheet).join("");
}

function renderCheck(check) {
  const tone = healthTone(check.ok ? "ready" : "attention");
  return `
    <li class="rounded-xl border ${tone.card} p-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-sm font-extrabold text-slate-900">${escapeHtml(check.label || check.key)}</p>
          <p class="mt-1 text-xs font-bold text-slate-500">${escapeHtml(check.description || "")}</p>
        </div>
        <span class="rounded-full px-3 py-1 text-[11px] font-extrabold uppercase ${tone.badge}">${tone.label}</span>
      </div>
    </li>
  `;
}

function renderSheet(sheet) {
  const tone = healthTone(sheet.ok ? "ready" : "attention");
  const missing = Array.isArray(sheet.missing_headers) && sheet.missing_headers.length
    ? `Kolum hilang: ${sheet.missing_headers.join(", ")}`
    : "Schema lengkap";
  return `
    <li class="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <p class="text-sm font-extrabold text-slate-900">${escapeHtml(sheet.name)}</p>
        <p class="mt-1 text-xs font-bold text-slate-500">${escapeHtml(missing)}</p>
      </div>
      <div class="flex items-center gap-2 sm:justify-end">
        <span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-extrabold text-slate-600">${Number(sheet.rows || 0)} rekod</span>
        <span class="rounded-full px-3 py-1 text-[11px] font-extrabold uppercase ${tone.badge}">${tone.label}</span>
      </div>
    </li>
  `;
}

function renderLoading() {
  ["checkList", "sheetList"].forEach(id => {
    document.querySelector(`#${id}`).innerHTML = Array.from({ length: 4 }, () =>
      `<div class="h-20 animate-pulse rounded-xl bg-slate-100"></div>`
    ).join("");
  });
  setText("schemaVersion", "Memuat...");
  setText("completedPhases", "Memuat...");
  setText("generatedAt", "Memuat...");
  setText("checkSummary", "-");
  setText("sheetSummary", "-");
}

function renderError(message) {
  const text = escapeHtml(message || "Status sistem tidak dapat dimuatkan.");
  document.querySelector("#checkList").innerHTML = `<li class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">${text}</li>`;
  document.querySelector("#sheetList").innerHTML = "";
}

function ensureShell() {
  document.body.className = "min-h-screen bg-slate-50 text-slate-800 antialiased";
  document.body.innerHTML = `
    <div id="toast" class="fixed right-4 top-20 z-[100] hidden w-[calc(100%-2rem)] max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80"><div class="flex gap-3"><div id="toastIcon" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><i class="fa-solid fa-circle-info"></i></div><div><p id="toastTitle" class="text-sm font-extrabold text-slate-900"></p><p id="toastText" class="mt-1 text-xs font-semibold leading-5 text-slate-500"></p></div></div></div>
    <header class="sticky top-0 z-50 h-16 border-b border-gray-100 bg-white shadow-sm"><div class="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"><a href="./" class="flex items-center gap-3"><img src="https://www.akm.gov.my/templates/yootheme/cache/91/JATA%20NEGARA%20AI-01-91eac591.webp" alt="Jata Negara" class="h-10 w-10 object-contain"><div><p class="text-base font-extrabold tracking-tight text-slate-800">SPRAD</p><p class="text-[9px] font-semibold uppercase tracking-widest text-slate-500">Sistem Penilaian Risiko Audit Dalam</p></div></a><button id="logout" type="button" class="rounded-full bg-slate-900 px-4 py-2 text-xs font-extrabold text-white">Log keluar</button></div></header>
    <main class="sprad-shell mx-auto grid w-full max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:px-8">
      <aside class="sprad-sidebar self-start lg:sticky lg:top-16"><div class="flex items-center justify-between gap-3"><p class="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Ruang kerja</p><span id="sidebarRole" class="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-blue-700">SPRAD</span></div><div class="mt-4 space-y-2"></div></aside>
      <section class="sprad-content grid content-start gap-5">
        <div class="brand-cover rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div><p class="text-xs font-extrabold uppercase tracking-widest text-blue-600">Kesediaan produksi</p><h1 class="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Status Sistem</h1><p class="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-500">Semakan deployment, konfigurasi Apps Script dan schema Google Sheets.</p></div>
            <div class="flex items-center gap-3"><span id="statusBadge" class="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-slate-600">Memuat...</span><button id="refreshBtn" class="rounded-full bg-blue-600 px-4 py-3 text-xs font-extrabold text-white"><i class="fa-solid fa-rotate-right mr-2"></i>Muat semula</button></div>
          </div>
        </div>
        <div class="admin-dashboard-grid">
          ${metric("Schema", "schemaVersion")}
          ${metric("Fasa", "completedPhases")}
          ${metric("Konfigurasi", "checkSummary")}
          ${metric("Sheets", "sheetSummary")}
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div class="flex items-center justify-between gap-3"><h2 class="text-lg font-extrabold text-slate-900">Konfigurasi produksi</h2><span id="generatedAt" class="text-xs font-bold text-slate-400">-</span></div><ul id="checkList" class="mt-5 grid gap-3 md:grid-cols-2"></ul></div>
        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 class="text-lg font-extrabold text-slate-900">Google Sheets</h2><ul id="sheetList" class="mt-5 grid gap-3"></ul></div>
      </section>
    </main>
  `;
}

function metric(label, id) {
  return `<article class="admin-stat-card"><div class="admin-stat-topline"><p class="admin-stat-label">${label}</p><div class="admin-stat-icon"><i class="fa-solid fa-chart-simple"></i></div></div><div><h3 id="${id}" class="admin-stat-value">-</h3></div></article>`;
}

function setText(id, value) {
  const element = document.querySelector(`#${id}`);
  if (element) element.textContent = value;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("ms-MY");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
