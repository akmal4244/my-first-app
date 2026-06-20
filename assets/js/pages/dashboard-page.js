/*
 * File Path: assets/js/pages/dashboard-page.js
 * File Version: SPRAD v2.8-production | qa-fix.1
 * Update Info: 2026-06-20 - Pulihkan identifier teknikal dashboard selepas lokalisasi Bahasa Melayu.
 */
import { STORAGE_KEYS } from "../config.js";
import {
  normalizeCleanUrl,
  requireSession,
  setupLogoutButton,
  setupSidebar,
  showToast
} from "../components/app-shell.js";
import { getDashboardSummary } from "../services/audit-service.js";

normalizeCleanUrl("dashboard");
ensureShell();
const session = requireSession({ permissions: ["reports.view"], fallback: "form" });
if (session) init();

async function init() {
  setupLogoutButton();
  setupSidebar("dashboard", session);
  document.querySelector("#refreshBtn")?.addEventListener("click", () => loadSummary({ force: true }));
  await loadSummary();
}

async function loadSummary({ force = false } = {}) {
  const cached = readCache();
  if (cached && !force) render(cached, "Cache tempatan");
  else renderLoading();

  try {
    const summary = await getDashboardSummary(session.token);
    writeCache(summary);
    render(summary, "Dikemaskini");
  } catch (err) {
    showToast("Ralat dashboard", err.message || "Papan Pemuka tidak dapat dimuatkan.", "error");
    if (!cached) renderError();
  }
}

function render(summary = {}, statusText = "-") {
  setText("cacheStatus", statusText);
  setText("totalFindings", summary.total_findings || 0);
  setText("overallLevel", summary.overall_level || "Rendah");
  setText("highCritical", `${summary.high_critical_percent || 0}%`);
  setText("overdueActions", summary.overdue_actions || 0);
  renderLevelBars(summary.counts || {});
  renderCategories(summary.categories || []);
  renderUrgent(summary);
}

function renderLevelBars(counts) {
  const order = ["Kritikal", "Tinggi", "Sederhana", "Rendah"];
  const max = Math.max(1, ...order.map(label => Number(counts[label] || 0)));
  document.querySelector("#levelBars").innerHTML = order.map(label => {
    const value = Number(counts[label] || 0);
    const width = Math.max(8, Math.round((value / max) * 100));
    const color = label === "Kritikal" || label === "Tinggi" ? "bg-red-600" : label === "Sederhana" ? "bg-amber-500" : "bg-emerald-600";
    return `<div class="grid gap-2"><div class="flex items-center justify-between text-xs font-extrabold text-slate-500"><span>${label}</span><span>${value}</span></div><div class="h-3 overflow-hidden rounded-full bg-slate-100"><div class="h-full ${color}" style="width:${width}%"></div></div></div>`;
  }).join("");
}

function renderCategories(categories) {
  const list = document.querySelector("#categoryList");
  if (!categories.length) {
    list.innerHTML = `<p class="text-sm font-bold text-slate-500">Tiada kategori untuk dipaparkan.</p>`;
    return;
  }
  list.innerHTML = categories.slice(0, 5).map(item => `
    <li class="rounded-xl border border-slate-200 bg-white p-4">
      <div class="flex items-start justify-between gap-3"><div><p class="font-extrabold text-slate-900">${escapeHtml(item.category)}</p><p class="mt-1 text-xs font-bold text-slate-500">${item.issue_count} isu · ${item.percent_total}% daripada jumlah</p></div><span class="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-extrabold uppercase text-blue-700">${escapeHtml(item.category_level)}</span></div>
    </li>
  `).join("");
}

function renderUrgent(summary) {
  document.querySelector("#urgentList").innerHTML = `
    <li class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"><span class="text-sm font-bold text-slate-600">Belum disemak</span><strong class="text-xl text-slate-900">${summary.unreviewed || 0}</strong></li>
    <li class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"><span class="text-sm font-bold text-slate-600">Menunggu pengesahan</span><strong class="text-xl text-blue-700">${summary.awaiting_verification || 0}</strong></li>
    <li class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"><span class="text-sm font-bold text-slate-600">Tindakan lewat</span><strong class="text-xl text-red-700">${summary.overdue_actions || 0}</strong></li>
  `;
}

function renderLoading() {
  setText("cacheStatus", "Memuat...");
  ["levelBars", "categoryList", "urgentList"].forEach(id => {
    document.querySelector(`#${id}`).innerHTML = `<div class="h-20 animate-pulse rounded-xl bg-slate-100"></div>`;
  });
}

function renderError() {
  setText("cacheStatus", "Ralat");
  document.querySelector("#categoryList").innerHTML = `<p class="text-sm font-bold text-red-600">Papan Pemuka tidak dapat dimuatkan.</p>`;
}

function readCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.dashboardCache);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(summary) {
  localStorage.setItem(STORAGE_KEYS.dashboardCache, JSON.stringify(summary));
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
        <div class="brand-cover rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p class="text-xs font-extrabold uppercase tracking-widest text-blue-600">Fasa 7</p><h1 class="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Papan Pemuka Analitik</h1><p class="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-500">Ringkasan risiko, status semakan dan tindakan pembetulan untuk bacaan pantas pengurusan.</p></div><button id="refreshBtn" class="rounded-full bg-blue-600 px-4 py-3 text-xs font-extrabold text-white"><i class="fa-solid fa-rotate-right mr-2"></i>Muat semula</button></div></div>
        <div class="admin-dashboard-grid"><card data-primary="true"><p>Jumlah Penemuan</p><strong id="totalFindings">0</strong></card><card><p>Tahap Keseluruhan</p><strong id="overallLevel">-</strong></card><card><p>Tinggi/Kritikal</p><strong id="highCritical">0%</strong></card><card><p>Tindakan Lewat</p><strong id="overdueActions">0</strong><small id="cacheStatus">-</small></card></div>
        <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]"><div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 class="text-lg font-extrabold text-slate-900">Taburan Tahap Risiko</h2><div id="levelBars" class="mt-5 grid gap-4"></div></div><div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 class="text-lg font-extrabold text-slate-900">Perlu Perhatian</h2><ul id="urgentList" class="mt-5 grid gap-3"></ul></div></div>
        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 class="text-lg font-extrabold text-slate-900">Kategori Risiko Teratas</h2><ul id="categoryList" class="mt-5 grid gap-3 md:grid-cols-2"></ul></div>
      </section>
    </main>`;
  document.querySelectorAll("card").forEach(card => {
    const primary = card.dataset.primary === "true" ? " admin-stat-card--primary" : "";
    card.outerHTML = `<article class="admin-stat-card${primary}"><div class="admin-stat-topline"><p class="admin-stat-label">${card.querySelector("p")?.textContent || ""}</p><div class="admin-stat-icon"><i class="fa-solid fa-chart-simple"></i></div></div><div><h3 class="admin-stat-value">${card.querySelector("strong")?.outerHTML || ""}</h3>${card.querySelector("small")?.outerHTML || ""}</div></article>`;
  });
}

function sidebar() {
  return `<aside class="sprad-sidebar self-start lg:sticky lg:top-16"><div class="flex items-center justify-between gap-3"><p class="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Ruang kerja</p><span id="sidebarRole" class="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-blue-700">SPRAD</span></div><div class="mt-4 space-y-2">${navLinks()}</div></aside>`;
}

function navLinks() {
  return [
    ["dashboard", "fa-chart-line", "Papan Pemuka"],
    ["form", "fa-clipboard-list", "Penilaian risiko"],
    ["ai-intake", "fa-wand-magic-sparkles", "Input AI"],
    ["audit-cycles", "fa-calendar-days", "Kitaran audit"],
    ["audits", "fa-file-signature", "Audit"],
    ["findings", "fa-triangle-exclamation", "Penemuan"],
    ["corrective-actions", "fa-list-check", "Tindakan"],
    ["reports", "fa-print", "Laporan"],
    ["audit-logs", "fa-shield-halved", "Log audit"],
    ["institutions", "fa-building-columns", "Institusi"],
    ["org-units", "fa-sitemap", "PTJ / Unit"],
    ["users", "fa-users-gear", "Pengguna"],
    ["settings", "fa-sliders", "Tetapan"]
  ].map(([route, icon, label]) => `<a href="${route}" data-nav-route="${route}" class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-slate-500"><i class="fa-solid ${icon} w-4"></i>${label}</a>`).join("");
}
