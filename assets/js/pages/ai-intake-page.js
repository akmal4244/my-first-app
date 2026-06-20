/*
 * File Path: assets/js/pages/ai-intake-page.js
 * File Version: SPRAD v2.8-production | metadata-header.1
 * Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
 */
import { STORAGE_KEYS } from "../config.js";
import {
  normalizeCleanUrl,
  requireSession,
  setupLogoutButton,
  setupSidebar,
  showToast
} from "../components/app-shell.js";
import { isActionCancelled } from "../core/action-confirmation.js";
import { buildMutationRequest } from "../core/mutation-utils.js";
import {
  AI_UPLOAD_MAX_BYTES,
  buildAiIntakeMutation,
  flagLabel,
  normalizeAiDraft,
  normalizeAiJob,
  validateAiUploadDraft
} from "../core/ai-intake-utils.js";
import { listAiDrafts, listAiJobs, submitAiMutation } from "../services/ai-intake-service.js";

normalizeCleanUrl("ai-intake");
ensureShell();
const session = requireSession({ permissions: ["findings.create", "findings.manage"], fallback: "dashboard" });
if (session) init();

let selectedFile;
let selectedBase64 = "";
let jobs = [];
let drafts = [];

async function init() {
  setupLogoutButton();
  setupSidebar("ai-intake", session);
  bindEvents();
  await refreshData();
}

function bindEvents() {
  const fileInput = document.querySelector("#fileInput");
  const dropZone = document.querySelector("#dropZone");
  document.querySelector("#uploadForm")?.addEventListener("submit", submitUpload);
  document.querySelector("#refreshBtn")?.addEventListener("click", refreshData);
  document.querySelector("#draftList")?.addEventListener("click", handleDraftAction);
  fileInput?.addEventListener("change", () => setSelectedFile(fileInput.files?.[0]));
  dropZone?.addEventListener("dragover", event => {
    event.preventDefault();
    dropZone.classList.add("border-blue-400", "bg-blue-50");
  });
  dropZone?.addEventListener("dragleave", () => {
    dropZone.classList.remove("border-blue-400", "bg-blue-50");
  });
  dropZone?.addEventListener("drop", event => {
    event.preventDefault();
    dropZone.classList.remove("border-blue-400", "bg-blue-50");
    setSelectedFile(event.dataTransfer?.files?.[0]);
  });
}

async function setSelectedFile(file) {
  selectedFile = file || null;
  selectedBase64 = "";
  if (!selectedFile) return renderSelectedFile();
  const validation = validateAiUploadDraft({
    fileName: selectedFile.name,
    mimeType: selectedFile.type,
    size: selectedFile.size
  });
  if (!validation.ok) {
    showToast("Fail tidak sah", validation.error, "error");
    selectedFile = null;
    return renderSelectedFile();
  }
  selectedBase64 = await readFileAsBase64(selectedFile);
  renderSelectedFile();
}

async function submitUpload(event) {
  event.preventDefault();
  if (!selectedFile || !selectedBase64) {
    showToast("Pilih fail dahulu", "Seret atau pilih laporan audit untuk dianalisis.", "warning");
    return;
  }

  const submitBtn = document.querySelector("#submitBtn");
  const sourceTitle = document.querySelector("#sourceTitle").value;
  setLoading(submitBtn, true, "Menganalisis...");

  try {
    const request = buildAiIntakeMutation({
      token: session.token,
      sourceTitle,
      file: {
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        size: selectedFile.size,
        base64: selectedBase64
      }
    });
    const receipt = await submitAiMutation(request, {
      confirmation: {
        subject: sourceTitle || selectedFile.name || "dokumen audit"
      }
    });
    if (isActionCancelled(receipt)) {
      showToast("Dibatalkan", "Analisis AI tidak diteruskan.", "info");
      return;
    }
    showToast("Analisis selesai", "Draft penemuan AI sudah tersedia untuk semakan auditor.", "success");
    document.querySelector("#uploadForm").reset();
    selectedFile = null;
    selectedBase64 = "";
    renderSelectedFile();
    await refreshData();
  } catch (error) {
    showToast("Analisis gagal", error.message || "Gemini tidak dapat memproses dokumen.", "error");
  } finally {
    setLoading(submitBtn, false, "Analisis dokumen");
  }
}

async function refreshData() {
  renderLoading();
  try {
    const [jobRecords, draftRecords] = await Promise.all([
      listAiJobs(session.token),
      listAiDrafts(session.token)
    ]);
    jobs = jobRecords.map(normalizeAiJob);
    drafts = draftRecords.map(normalizeAiDraft);
    render();
  } catch (error) {
    showToast("Ralat AI Intake", error.message || "Data AI tidak dapat dimuatkan.", "error");
    renderError();
  }
}

async function handleDraftAction(event) {
  const button = event.target.closest("[data-promote-draft]");
  if (!button) return;
  const id = button.dataset.promoteDraft;
  setLoading(button, true, "Mengesahkan...");
  try {
    const request = buildMutationRequest("aiDrafts.promote", session.token, { id });
    const receipt = await submitAiMutation(request);
    if (isActionCancelled(receipt)) {
      showToast("Dibatalkan", "Draft AI tidak disahkan.", "info");
      return;
    }
    showToast("Draft disahkan", "Draft AI telah dimasukkan sebagai penemuan audit.", "success");
    await refreshData();
  } catch (error) {
    showToast("Gagal sahkan", error.message || "Draft tidak dapat disahkan.", "error");
  } finally {
    setLoading(button, false, "Sahkan ke Penemuan");
  }
}

function render() {
  const totalDrafts = drafts.length;
  const ready = drafts.filter(draft => draft.reviewStatus === "lengkap").length;
  const needReview = drafts.filter(draft => draft.reviewStatus !== "lengkap").length;
  setText("jobCount", jobs.length);
  setText("draftCount", totalDrafts);
  setText("readyCount", ready);
  setText("reviewCount", needReview);
  renderJobs();
  renderDrafts();
}

function renderJobs() {
  const list = document.querySelector("#jobList");
  if (!jobs.length) {
    list.innerHTML = emptyState("Belum ada dokumen dianalisis.");
    return;
  }
  list.innerHTML = jobs.slice(0, 8).map(job => `
    <li class="rounded-xl border border-slate-200 bg-white p-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="font-extrabold text-slate-900">${escapeHtml(job.sourceTitle || job.fileName)}</p>
          <p class="mt-1 text-xs font-bold text-slate-500">${escapeHtml(job.fileName)} · ${escapeHtml(job.createdAt || "-")}</p>
        </div>
        ${statusBadge(job.status)}
      </div>
      <div class="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-500">
        <span class="rounded-lg bg-slate-50 p-2"><strong class="block text-lg text-slate-900">${job.draftCount}</strong>Draft</span>
        <span class="rounded-lg bg-slate-50 p-2"><strong class="block text-lg text-blue-700">${job.reviewScore}%</strong>Skor</span>
        <span class="rounded-lg bg-slate-50 p-2"><strong class="block text-lg text-slate-900">${escapeHtml(job.status)}</strong>Status</span>
      </div>
      ${job.errorMessage ? `<p class="mt-3 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-700">${escapeHtml(job.errorMessage)}</p>` : ""}
    </li>
  `).join("");
}

function renderDrafts() {
  const list = document.querySelector("#draftList");
  if (!drafts.length) {
    list.innerHTML = emptyState("Draft AI akan dipaparkan di sini selepas dokumen dianalisis.");
    return;
  }
  list.innerHTML = drafts.map(draft => `
    <article class="rounded-xl border border-slate-200 bg-white p-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-[11px] font-extrabold uppercase tracking-widest text-blue-600">Draft AI · ${Math.round(draft.confidence * 100)}% confidence</p>
          <h2 class="mt-1 text-lg font-extrabold text-slate-900">${escapeHtml(draft.title || "Tajuk belum lengkap")}</h2>
          <p class="mt-2 text-sm font-semibold leading-6 text-slate-600">${escapeHtml(draft.issueDescription || "-")}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          ${reviewBadge(draft.reviewStatus)}
          ${draft.status === "promoted" ? `<span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">Telah disahkan</span>` : ""}
        </div>
      </div>
      <div class="mt-4 grid gap-3 md:grid-cols-3">
        <div class="rounded-lg bg-slate-50 p-3"><p class="text-xs font-extrabold text-slate-400">Punca</p><p class="mt-1 text-sm font-semibold text-slate-700">${escapeHtml(draft.rootCause || "-")}</p></div>
        <div class="rounded-lg bg-slate-50 p-3"><p class="text-xs font-extrabold text-slate-400">Impak</p><p class="mt-1 text-sm font-semibold text-slate-700">${escapeHtml(draft.impactDescription || "-")}</p></div>
        <div class="rounded-lg bg-slate-50 p-3"><p class="text-xs font-extrabold text-slate-400">Syor</p><p class="mt-1 text-sm font-semibold text-slate-700">${escapeHtml(draft.recommendation || "-")}</p></div>
      </div>
      <div class="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-wrap gap-2">${draft.reviewFlags.map(flag => `<span class="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-extrabold text-amber-700">${escapeHtml(flagLabel(flag))}</span>`).join("") || `<span class="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-extrabold text-emerald-700">Semakan automatik lengkap</span>`}</div>
        <button data-promote-draft="${escapeHtml(draft.id)}" ${draft.status === "promoted" ? "disabled" : ""} class="rounded-full bg-blue-600 px-4 py-2 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
          Sahkan ke Penemuan
        </button>
      </div>
    </article>
  `).join("");
}

function renderSelectedFile() {
  const target = document.querySelector("#selectedFile");
  if (!target) return;
  target.innerHTML = selectedFile
    ? `<strong>${escapeHtml(selectedFile.name)}</strong><span>${formatBytes(selectedFile.size)} · ${escapeHtml(selectedFile.type)}</span>`
    : `<strong>Tiada fail dipilih</strong><span>Had ${Math.round(AI_UPLOAD_MAX_BYTES / 1024 / 1024)}MB setiap fail.</span>`;
}

function renderLoading() {
  document.querySelector("#jobList").innerHTML = `<div class="h-32 animate-pulse rounded-xl bg-slate-100"></div>`;
  document.querySelector("#draftList").innerHTML = `<div class="h-40 animate-pulse rounded-xl bg-slate-100"></div>`;
}

function renderError() {
  document.querySelector("#jobList").innerHTML = emptyState("Data AI tidak dapat dimuatkan.");
  document.querySelector("#draftList").innerHTML = emptyState("Sila cuba refresh semula.");
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").split(",").pop() || "");
    reader.onerror = () => reject(new Error("Fail tidak dapat dibaca."));
    reader.readAsDataURL(file);
  });
}

function statusBadge(status) {
  const styles = {
    completed: "bg-emerald-50 text-emerald-700",
    processing: "bg-blue-50 text-blue-700",
    failed: "bg-red-50 text-red-700"
  };
  return `<span class="rounded-full px-3 py-1 text-xs font-extrabold ${styles[status] || "bg-slate-100 text-slate-600"}">${escapeHtml(status)}</span>`;
}

function reviewBadge(status) {
  return status === "lengkap"
    ? `<span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">Lengkap</span>`
    : `<span class="rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700">Perlu semakan</span>`;
}

function setLoading(button, isLoading, text) {
  if (!button) return;
  button.disabled = isLoading;
  button.textContent = text;
}

function setText(id, value) {
  const node = document.querySelector(`#${id}`);
  if (node) node.textContent = value;
}

function emptyState(text) {
  return `<div class="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm font-bold text-slate-500">${escapeHtml(text)}</div>`;
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(2)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function ensureShell() {
  document.body.innerHTML = `
    <div id="toast" class="fixed right-4 top-20 z-[100] hidden w-[calc(100%-2rem)] max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80"><div class="flex gap-3"><div id="toastIcon" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><i class="fa-solid fa-circle-info"></i></div><div><p id="toastTitle" class="text-sm font-extrabold text-slate-900"></p><p id="toastText" class="mt-1 text-xs font-semibold leading-5 text-slate-500"></p></div></div></div>
    <header class="sticky top-0 z-50 h-16 border-b border-gray-100 bg-white shadow-sm"><div class="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"><a href="./" class="flex items-center gap-3"><img src="https://www.akm.gov.my/templates/yootheme/cache/91/JATA%20NEGARA%20AI-01-91eac591.webp" alt="Jata Negara" class="h-10 w-10 object-contain"><div><p class="text-base font-extrabold tracking-tight text-slate-800">SPRAD</p><p class="text-[9px] font-semibold uppercase tracking-widest text-slate-500">Sistem Penilaian Risiko Audit Dalam</p></div></a><button id="logout" type="button" class="rounded-full bg-slate-900 px-4 py-2 text-xs font-extrabold text-white">Log keluar</button></div></header>
    <main class="mx-auto grid w-full max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:px-8">
      <aside class="self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-20"><div class="flex items-center justify-between gap-3"><p class="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Ruang kerja</p><span id="sidebarRole" class="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-blue-700">SPRAD</span></div><div class="mt-4 space-y-2"></div></aside>
      <section class="grid content-start gap-5">
        <div class="brand-cover rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p class="text-xs font-extrabold uppercase tracking-widest text-blue-600">Fasa 7 · AI Intake</p>
              <h1 class="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Analisis dokumen audit automatik</h1>
              <p class="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-500">Muat naik laporan audit universiti atau institusi. Gemini akan menukar kandungan kepada draft penemuan SPRAD, menjalankan semakan automatik dan menyediakan item untuk disahkan auditor.</p>
            </div>
            <button id="refreshBtn" class="rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-extrabold text-slate-600"><i class="fa-solid fa-rotate-right mr-2"></i>Refresh</button>
          </div>
        </div>
        <div class="admin-dashboard-grid">
          ${metric("jobCount", "Dokumen", "0")}
          ${metric("draftCount", "Draft AI", "0")}
          ${metric("readyCount", "Lengkap", "0")}
          ${metric("reviewCount", "Perlu Semakan", "0")}
        </div>
        <div class="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
          <form id="uploadForm" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-lg font-extrabold text-slate-900">Upload dokumen</h2>
            <label class="mt-4 block"><span class="text-xs font-extrabold uppercase tracking-wide text-slate-500">Tajuk sumber</span><input id="sourceTitle" class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" placeholder="Contoh: Laporan Audit Dalam UniMAP 2026"></label>
            <label id="dropZone" class="mt-4 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition">
              <i class="fa-solid fa-cloud-arrow-up text-3xl text-blue-600"></i>
              <strong class="mt-3 text-sm text-slate-900">Seret fail ke sini atau klik untuk pilih</strong>
              <span class="mt-2 text-xs font-semibold text-slate-500">PDF, TXT, PNG, JPG, WEBP · maksimum ${Math.round(AI_UPLOAD_MAX_BYTES / 1024 / 1024)}MB</span>
              <input id="fileInput" type="file" accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp,application/pdf,text/plain,text/markdown,image/png,image/jpeg,image/webp" class="hidden">
            </label>
            <div id="selectedFile" class="mt-4 grid gap-1 rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-500"><strong>Tiada fail dipilih</strong><span>Had ${Math.round(AI_UPLOAD_MAX_BYTES / 1024 / 1024)}MB setiap fail.</span></div>
            <button id="submitBtn" type="submit" class="mt-4 w-full rounded-full bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-100">Analisis dokumen</button>
          </form>
          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-lg font-extrabold text-slate-900">Queue analisis</h2>
            <ul id="jobList" class="mt-5 grid gap-3"></ul>
          </div>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Semakan auditor</p><h2 class="text-xl font-extrabold text-slate-900">Draft penemuan daripada AI</h2></div><p class="text-xs font-bold text-slate-500">AI cadangkan, auditor sahkan.</p></div>
          <div id="draftList" class="mt-5 grid gap-4"></div>
        </div>
      </section>
    </main>`;
}

function metric(id, label, value) {
  return `<article class="admin-stat-card"><div class="admin-stat-topline"><p class="admin-stat-label">${label}</p><div class="admin-stat-icon"><i class="fa-solid fa-chart-simple"></i></div></div><div><h3 id="${id}" class="admin-stat-value">${value}</h3></div></article>`;
}
