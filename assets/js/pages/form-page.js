import { getApiUrl, STORAGE_KEYS } from "../config.js";
import { getRoleLabel } from "../core/data-master-utils.js";
import { getVisibleNavLinks, normalizeRole } from "../core/permissions.js";
import { calculateRisk } from "../core/risk-engine.js";
import { buildMutationRequest, pollMutationReceipt } from "../core/mutation-utils.js";
import {
  buildBulkFindingPayload,
  createEmptyFindingIssue
} from "../core/bulk-finding-utils.js";

const URL = getApiUrl();
const form = document.querySelector("#contactForm");
const msg = document.querySelector("#msg");
const issueList = document.querySelector("#issueList");
const addIssueBtn = document.querySelector("#addIssueBtn");
const issueCount = document.querySelector("#issueCount");
const logout = document.querySelector("#logout");
const submitBtn = document.querySelector("#submitBtn");
const submitIcon = document.querySelector("#submitIcon");
const submitLabel = document.querySelector("#submitLabel");
const sidebarRole = document.querySelector("#sidebarRole");

const state = {
  issues: [createEmptyFindingIssue()],
  institutions: fallbackInstitutions(),
  orgUnits: fallbackOrgUnits(),
  auditCycles: fallbackAuditCycles(),
  riskCategories: fallbackRiskCategories(),
  lookupsReady: false
};

let toastTimer;

if (!localStorage.getItem(STORAGE_KEYS.token)) {
  window.location.href = "login";
} else {
  init();
}

async function init() {
  normalizeCleanUrl("form");
  setupSidebar();
  bindEvents();
  renderIssues();
  await loadLookups();
  renderCommonSelects();
  renderIssues();
}

function bindEvents() {
  logout?.addEventListener("click", logoutToLogin);
  addIssueBtn?.addEventListener("click", () => {
    syncIssuesFromDom();
    state.issues.push(createEmptyFindingIssue());
    renderIssues();
  });
  issueList?.addEventListener("input", handleIssueInput);
  issueList?.addEventListener("change", handleIssueInput);
  issueList?.addEventListener("click", handleIssueClick);
  document.querySelector("#institution_id")?.addEventListener("change", () => {
    renderDependentSelects();
  });
  form?.addEventListener("submit", submitForm);
}

async function loadLookups() {
  const token = localStorage.getItem(STORAGE_KEYS.token);
  try {
    const [institutions, orgUnits, auditCycles, riskCategories] = await Promise.all([
      listResource("institutions.list", "institutions", token),
      listResource("orgUnits.list", "records", token),
      listResource("auditCycles.list", "records", token),
      listResource("riskCategories.list", "records", token)
    ]);
    state.institutions = institutions.length ? institutions : fallbackInstitutions();
    state.orgUnits = orgUnits.length ? orgUnits : fallbackOrgUnits();
    state.auditCycles = auditCycles.length ? auditCycles : fallbackAuditCycles();
    state.riskCategories = riskCategories.length ? riskCategories : fallbackRiskCategories();
    state.lookupsReady = true;
    showToast("Data rujukan dimuatkan", "Pilihan institusi dan item audit telah dikemaskini.", "success");
  } catch (error) {
    state.institutions = fallbackInstitutions();
    state.orgUnits = fallbackOrgUnits();
    state.auditCycles = fallbackAuditCycles();
    state.riskCategories = fallbackRiskCategories();
    showToast("Guna data demo", "Backend V2 belum dapat dicapai. Pilihan demo dipaparkan.", "info");
  }
}

async function listResource(action, key, token) {
  const params = new URLSearchParams({ action, token, include_archived: "" });
  const response = await fetch(`${URL}?${params.toString()}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || "Tidak dapat memuatkan data.");
  const source = data.data || data;
  return Array.isArray(source[key]) ? source[key] : [];
}

function renderCommonSelects() {
  const institutionSelect = document.querySelector("#institution_id");
  if (institutionSelect) {
    institutionSelect.innerHTML = state.institutions
      .map(institution => optionHtml(institution.id, institution.name || institution.short_name || institution.code || institution.id))
      .join("");
  }
  renderDependentSelects();
}

function renderDependentSelects() {
  const institutionId = document.querySelector("#institution_id")?.value || localStorage.getItem(STORAGE_KEYS.institutionId) || "inst_default";
  const orgUnitSelect = document.querySelector("#org_unit");
  const cycleSelect = document.querySelector("#audit_cycle");
  const orgUnits = filterByInstitution(state.orgUnits, institutionId);
  const cycles = filterByInstitution(state.auditCycles, institutionId);

  if (orgUnitSelect) {
    orgUnitSelect.innerHTML = orgUnits
      .map(unit => optionHtml(unit.id, `${unit.code || unit.id} - ${unit.name || unit.id}`))
      .join("");
  }
  if (cycleSelect) {
    cycleSelect.innerHTML = cycles
      .map(cycle => optionHtml(cycle.id, `${cycle.audit_year || "-"} - ${cycle.title || cycle.id}`))
      .join("");
  }
}

function renderIssues() {
  if (!issueList) return;
  issueCount.textContent = String(state.issues.length);
  issueList.innerHTML = state.issues.map(renderIssueCard).join("");
  state.issues.forEach((_, index) => updateIssuePreview(index));
}

function renderIssueCard(issue, index) {
  const number = index + 1;
  const canRemove = state.issues.length > 1;
  return `
    <section data-issue-card data-index="${index}" class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-[11px] font-extrabold uppercase tracking-widest text-blue-600">Item isu audit</p>
          <h2 class="mt-1 text-lg font-extrabold text-slate-900">Isu ${number}</h2>
        </div>
        <button type="button" data-remove-issue="${index}" class="${canRemove ? "" : "hidden"} rounded-full border border-red-100 bg-white px-4 py-2 text-xs font-extrabold text-red-600 transition hover:bg-red-50">
          <i class="fa-solid fa-trash-can mr-2"></i>Buang
        </button>
      </div>

      <div class="grid gap-3 lg:grid-cols-2">
        ${fieldInput("finding_title", "Tajuk isu audit", issue.finding_title, "Ringkasan isu audit", true)}
        ${categorySelect(issue.risk_category)}
      </div>

      <div class="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr_220px]">
        ${scaleSelect("likelihood", "Kemungkinan", issue.likelihood)}
        ${scaleSelect("impact", "Kesan", issue.impact)}
        <div class="rounded-xl border border-slate-200 bg-white p-4">
          <p class="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Pratonton risiko</p>
          <div class="mt-2 flex items-end justify-between gap-3">
            <p data-risk-score class="text-4xl font-extrabold text-slate-900">1</p>
            <span data-risk-level class="rounded-full px-3 py-1 text-xs font-extrabold text-white">Rendah</span>
          </div>
          <p data-risk-formula class="mt-2 text-xs font-bold text-slate-500">K1 x I1</p>
        </div>
      </div>

      <div class="mt-3 grid gap-3">
        ${fieldTextarea("issue_description", "Huraian isu audit", issue.issue_description, true)}
        <div class="grid gap-3 lg:grid-cols-2">
          ${fieldTextarea("root_cause", "Punca utama", issue.root_cause, true)}
          ${fieldTextarea("impact_description", "Kesan / implikasi", issue.impact_description, true)}
        </div>
        ${fieldTextarea("recommendation", "Syor audit / tindakan dicadangkan", issue.recommendation, true)}
        ${fieldInput("audit_evidence", "URL bukti audit", issue.audit_evidence, "https://drive.google.com/...", false)}
      </div>
    </section>
  `;
}

function fieldInput(name, label, value, placeholder, required) {
  return `
    <label class="block">
      <span class="text-xs font-extrabold uppercase tracking-wide text-slate-500">${label}${required ? " *" : ""}</span>
      <input data-field="${name}" value="${escapeAttr(value)}" placeholder="${escapeAttr(placeholder)}" ${required ? "required" : ""} class="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100">
    </label>
  `;
}

function fieldTextarea(name, label, value, required) {
  return `
    <label class="block">
      <span class="text-xs font-extrabold uppercase tracking-wide text-slate-500">${label}${required ? " *" : ""}</span>
      <textarea data-field="${name}" rows="3" ${required ? "required" : ""} class="mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100">${escapeHtml(value)}</textarea>
    </label>
  `;
}

function categorySelect(value) {
  const options = state.riskCategories
    .map(category => optionHtml(category.id || category.name, `${category.code || "-"} - ${category.name || category.id}`, value))
    .join("");
  return `
    <label class="block">
      <span class="text-xs font-extrabold uppercase tracking-wide text-slate-500">Kategori risiko *</span>
      <select data-field="risk_category" required class="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-extrabold text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100">
        ${options}
      </select>
    </label>
  `;
}

function scaleSelect(name, label, value) {
  const choices = [
    ["1", "1 - Rendah"],
    ["2", "2 - Sederhana"],
    ["3", "3 - Tinggi"],
    ["4", "4 - Sangat Tinggi"]
  ];
  return `
    <label class="block">
      <span class="text-xs font-extrabold uppercase tracking-wide text-slate-500">${label} *</span>
      <select data-field="${name}" required class="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-extrabold text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100">
        ${choices.map(([choiceValue, labelText]) => optionHtml(choiceValue, labelText, value)).join("")}
      </select>
    </label>
  `;
}

function handleIssueInput(event) {
  const card = event.target.closest("[data-issue-card]");
  if (!card) return;
  const index = Number(card.dataset.index);
  const field = event.target.dataset.field;
  if (field) state.issues[index][field] = event.target.value;
  updateIssuePreview(index);
}

function handleIssueClick(event) {
  const button = event.target.closest("[data-remove-issue]");
  if (!button) return;
  syncIssuesFromDom();
  state.issues.splice(Number(button.dataset.removeIssue), 1);
  if (!state.issues.length) state.issues.push(createEmptyFindingIssue());
  renderIssues();
}

function updateIssuePreview(index) {
  const card = issueList?.querySelector(`[data-index="${index}"]`);
  if (!card) return;
  const likelihood = card.querySelector('[data-field="likelihood"]')?.value || "1";
  const impact = card.querySelector('[data-field="impact"]')?.value || "1";
  const risk = calculateRisk(likelihood, impact);
  card.querySelector("[data-risk-score]").textContent = risk.score;
  card.querySelector("[data-risk-level]").textContent = risk.level;
  card.querySelector("[data-risk-level]").style.backgroundColor = risk.color;
  card.querySelector("[data-risk-formula]").textContent = `K${risk.likelihood} x I${risk.impact}`;
}

function syncIssuesFromDom() {
  state.issues = Array.from(issueList.querySelectorAll("[data-issue-card]")).map(card => {
    const next = createEmptyFindingIssue();
    card.querySelectorAll("[data-field]").forEach(control => {
      next[control.dataset.field] = control.value;
    });
    return next;
  });
}

async function submitForm(event) {
  event.preventDefault();
  syncIssuesFromDom();
  msg.textContent = "";

  try {
    const common = commonFromForm();
    const payload = buildBulkFindingPayload(common, state.issues.map(withCategoryLabel));
    const hasMultiple = payload.items.length > 1;
    const action = hasMultiple ? "findings.bulkCreate.legacy" : "findings.create.legacy";
    const bodyPayload = hasMultiple ? payload : { ...payload, ...payload.items[0] };
    const request = {
      ...buildMutationRequest(action, localStorage.getItem(STORAGE_KEYS.token), bodyPayload, () => crypto.randomUUID()),
      ...bodyPayload
    };

    setLoading(true);
    await postData(request);
    msg.textContent = `Sedang mengesahkan ${payload.items.length} isu audit...`;
    const receipt = await pollMutationReceipt({
      url: URL,
      token: request.token,
      requestId: request.request_id
    });

    if (receipt.status !== "success") {
      msg.textContent = receipt.error;
      showToast("Belum disahkan", receipt.error, "info");
      setLoading(false);
      return;
    }

    msg.textContent = `${payload.items.length} isu audit berjaya dihantar.`;
    showToast("Berjaya", msg.textContent, "success");
    form.reset();
    state.issues = [createEmptyFindingIssue()];
    renderCommonSelects();
    renderIssues();
    setLoading(false);
  } catch (error) {
    msg.textContent = error.message || "Penilaian tidak dapat dihantar. Sila cuba lagi.";
    showToast("Ralat", msg.textContent, "error");
    setLoading(false);
  }
}

function commonFromForm() {
  const institution = selectedOption("#institution_id");
  const orgUnit = selectedOption("#org_unit");
  const auditCycle = selectedOption("#audit_cycle");
  return {
    name: form.name.value,
    email: form.email.value,
    institution_id: institution.value,
    institution_name: institution.label,
    org_unit: orgUnit.value,
    org_unit_name: orgUnit.label,
    audit_cycle: auditCycle.value,
    audit_cycle_name: auditCycle.label
  };
}

function withCategoryLabel(issue) {
  const category = state.riskCategories.find(item => String(item.id || item.name) === String(issue.risk_category));
  return {
    ...issue,
    risk_category_name: category?.name || issue.risk_category
  };
}

async function postData(data) {
  await fetch(URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify(data)
  });
}

function setLoading(isLoading, text = "Sedang menghantar...") {
  submitBtn.disabled = isLoading;
  submitIcon.className = isLoading ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-paper-plane";
  submitLabel.textContent = isLoading ? text : "Hantar penilaian";
}

function setupSidebar() {
  const role = normalizeRole(localStorage.getItem(STORAGE_KEYS.v2Role) || localStorage.getItem(STORAGE_KEYS.role) || "viewer");
  const isAdmin = role === "super_admin" || role === "institution_admin";
  sidebarRole.textContent = getRoleLabel(role);
  sidebarRole.className = isAdmin
    ? "rounded-full bg-blue-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-blue-700"
    : "rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-emerald-700";

  const navContainer = document.querySelector("aside .mt-4.space-y-2");
  if (!navContainer) return;
  navContainer.innerHTML = getVisibleNavLinks(role)
    .map(({ route, icon, label }) => {
      const active = route === "form";
      const className = active
        ? "flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-sm font-extrabold text-blue-600"
        : "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900";
      return `<a href="${route}" data-nav-route="${route}" class="${className}"><i class="fa-solid ${icon} w-4"></i>${label}</a>`;
    })
    .join("");
}

function logoutToLogin() {
  clearCredentialsIfNotRemembered();
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.role);
  localStorage.removeItem(STORAGE_KEYS.v2Role);
  localStorage.removeItem(STORAGE_KEYS.userId);
  localStorage.removeItem(STORAGE_KEYS.institutionId);
  window.location.href = "login";
}

function clearCredentialsIfNotRemembered() {
  localStorage.removeItem("spradPassword");
  if (localStorage.getItem(STORAGE_KEYS.rememberMe) === "true") return;
  localStorage.removeItem(STORAGE_KEYS.username);
}

function showToast(title, text, type = "info") {
  const toast = document.querySelector("#toast");
  const toastTitle = document.querySelector("#toastTitle");
  const toastText = document.querySelector("#toastText");
  const toastIcon = document.querySelector("#toastIcon");
  const styles = {
    success: ["bg-emerald-50 text-emerald-600", "fa-solid fa-circle-check"],
    error: ["bg-red-50 text-red-600", "fa-solid fa-circle-exclamation"],
    info: ["bg-blue-50 text-blue-600", "fa-solid fa-circle-info"]
  };
  const [iconClass, iconName] = styles[type] || styles.info;
  toastTitle.textContent = title;
  toastText.textContent = text;
  toastIcon.className = "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg " + iconClass;
  toastIcon.innerHTML = `<i class="${iconName}"></i>`;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 3800);
}

function normalizeCleanUrl(route) {
  const storedPath = sessionStorage.getItem("spradCleanPath");
  sessionStorage.removeItem("spradCleanPath");
  const cleanPath = window.location.pathname.replace(/\/[^/]*\.html$/, `/${route}`);
  const targetPath = storedPath || cleanPath;
  if (targetPath && `${window.location.pathname}${window.location.search}${window.location.hash}` !== targetPath) {
    history.replaceState(null, "", targetPath);
  }
}

function selectedOption(selector) {
  const select = document.querySelector(selector);
  const option = select?.selectedOptions?.[0];
  return {
    value: select?.value || "",
    label: option?.textContent?.trim() || select?.value || ""
  };
}

function filterByInstitution(records, institutionId) {
  const filtered = records.filter(record => !record.institution_id || record.institution_id === institutionId);
  return filtered.length ? filtered : records;
}

function optionHtml(value, label, selectedValue = "") {
  return `<option value="${escapeAttr(value)}" ${String(value) === String(selectedValue) ? "selected" : ""}>${escapeHtml(label)}</option>`;
}

function fallbackInstitutions() {
  return [{
    id: localStorage.getItem(STORAGE_KEYS.institutionId) || "inst_default",
    name: "Institusi Default"
  }];
}

function fallbackOrgUnits() {
  return [{ id: "unit_demo_01", institution_id: "inst_default", code: "UAD", name: "Unit Audit Dalam" }];
}

function fallbackAuditCycles() {
  return [{ id: "cycle_demo_01", institution_id: "inst_default", audit_year: "2026", title: "Audit Dalam 2026" }];
}

function fallbackRiskCategories() {
  return [
    { id: "rc_mandate", code: "K01", name: "Tiada Mandat" },
    { id: "rc_technical", code: "K02", name: "Kesilapan Isu Teknikal" },
    { id: "rc_negligence", code: "K03", name: "Kecuaian" },
    { id: "rc_waste", code: "K04", name: "Pembaziran" },
    { id: "rc_leakage", code: "K05", name: "Penyelewengan / Ketirisan" }
  ];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}
