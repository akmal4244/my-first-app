/*
 * File Path: assets/js/pages/data-master-page.js
 * File Version: SPRAD v2.8-production | malay-localization.1
 * Update Info: 2026-06-20 - Seragamkan teks UI kepada Bahasa Melayu.
 */
import {
  setupLogoutButton,
  setupSidebar,
  normalizeCleanUrl,
  requireSession,
  showToast,
  statusBadge
} from "../components/app-shell.js";
import {
  filterRecords,
  getRecordStatusLabel,
  getRoleLabel,
  paginateRecords,
  validateInstitutionDraft,
  validateOrgUnitDraft,
  validateRiskCategoryDraft,
  validateRiskLevelDraft,
  validateUserDraft
} from "../core/data-master-utils.js";
import { isActionCancelled } from "../core/action-confirmation.js";
import { escapeHtml, formatDateTime } from "../core/formatters.js";
import { buildScopedCacheKey, readJsonStorage, writeJsonStorage } from "../core/storage.js";
import {
  getRiskMatrix,
  listDataMaster,
  submitDataMasterMutation
} from "../services/data-master-service.js";

const PAGE_SIZE = 5;

const CRUD_PAGES = {
  institutions: {
    route: "institutions",
    resource: "institutions",
    cacheResource: "institutionsCache",
    title: "Institusi",
    eyebrow: "Data induk",
    description: "Urus profil institusi, metadata laporan, logo dan status operasi.",
    formTitle: "Profil institusi",
    formHelp: "Super admin boleh cipta, kemaskini, arkib dan restore institusi.",
    permissions: ["institutions.manage"],
    createAction: "institutions.create",
    updateAction: "institutions.update",
    deleteAction: "institutions.delete",
    restoreAction: "institutions.restore",
    validator: validateInstitutionDraft,
    searchFields: ["code", "name", "short_name", "ministry", "report_title"],
    fields: [
      { name: "id", type: "hidden" },
      { name: "code", label: "Kod institusi", required: true, placeholder: "Contoh: UNIMAP" },
      { name: "name", label: "Nama institusi", required: true },
      { name: "short_name", label: "Nama ringkas" },
      { name: "ministry", label: "Kementerian / agensi" },
      { name: "address", label: "Alamat", type: "textarea", rows: 3 },
      { name: "logo_url", label: "URL logo" },
      { name: "report_title", label: "Tajuk laporan" },
      { name: "status", label: "Status", type: "select", options: statusOptions() }
    ],
    columns: [
      { label: "Kod", render: record => `<strong>${escapeHtml(record.code)}</strong><small>${escapeHtml(record.short_name || "-")}</small>` },
      { label: "Nama", render: record => `<strong>${escapeHtml(record.name)}</strong><small>${escapeHtml(record.ministry || "-")}</small>` },
      { label: "Butiran", render: record => `<span>${escapeHtml(record.report_title || "-")}</span><small>${escapeHtml(record.address || "-")}</small>` },
      { label: "Status", render: record => statusBadge(readStatus(record)) }
    ]
  },
  "org-units": {
    route: "org-units",
    resource: "orgUnits",
    cacheResource: "orgUnitsCache",
    title: "PTJ / Unit",
    eyebrow: "Data induk",
    description: "Urus fakulti, jabatan, pusat, unit dan struktur parent-child institusi.",
    formTitle: "PTJ / unit",
    formHelp: "Pentadbir institusi boleh mengurus PTJ mengikut institusi sendiri.",
    permissions: ["masters.manage"],
    createAction: "orgUnits.create",
    updateAction: "orgUnits.update",
    deleteAction: "orgUnits.delete",
    restoreAction: "orgUnits.restore",
    validator: validateOrgUnitDraft,
    searchFields: ["code", "name", "unit_type", "parent_unit_id"],
    fields: [
      { name: "id", type: "hidden" },
      { name: "institution_id", label: "ID institusi", superAdminOnly: true, placeholder: "Contoh: inst_default" },
      { name: "code", label: "Kod PTJ / unit", required: true },
      { name: "name", label: "Nama PTJ / unit", required: true },
      { name: "unit_type", label: "Jenis", type: "select", options: unitTypeOptions() },
      { name: "parent_unit_id", label: "Parent unit ID", placeholder: "Kosongkan jika tiada" },
      { name: "status", label: "Status", type: "select", options: statusOptions() }
    ],
    columns: [
      { label: "Kod", render: record => `<strong>${escapeHtml(record.code)}</strong><small>${escapeHtml(record.unit_type || "Unit")}</small>` },
      { label: "Nama", render: record => `<strong>${escapeHtml(record.name)}</strong><small>Institusi: ${escapeHtml(record.institution_id || "-")}</small>` },
      { label: "Struktur", render: record => `<span>Parent: ${escapeHtml(record.parent_unit_id || "-")}</span><small>Dikemaskini: ${escapeHtml(formatDateTime(record.updated_at || record.created_at))}</small>` },
      { label: "Status", render: record => statusBadge(readStatus(record)) }
    ]
  },
  users: {
    route: "users",
    resource: "users",
    cacheResource: "usersCache",
    title: "Pengguna",
    eyebrow: "Kawalan akses",
    description: "Urus akaun, peranan V2 dan akses mengikut institusi.",
    formTitle: "Akaun pengguna",
    formHelp: "Kata laluan wajib semasa cipta akaun. Biarkan kosong semasa edit jika tidak mahu tukar.",
    permissions: ["users.manage"],
    createAction: "users.create",
    updateAction: "users.update",
    deleteAction: "users.deactivate",
    restoreAction: "users.restore",
    validator: validateUserDraft,
    searchFields: ["username", "display_name", "email", "role"],
    fields: [
      { name: "id", type: "hidden" },
      { name: "institution_id", label: "ID institusi", superAdminOnly: true, placeholder: "Contoh: inst_default" },
      { name: "username", label: "Nama pengguna", required: true, autocomplete: "username" },
      { name: "display_name", label: "Nama paparan" },
      { name: "email", label: "E-mel", type: "email", autocomplete: "email" },
      { name: "password", label: "Kata laluan baharu", type: "password", autocomplete: "new-password" },
      { name: "role", label: "Peranan", type: "select", options: roleOptions() },
      { name: "status", label: "Status", type: "select", options: statusOptions() }
    ],
    columns: [
      { label: "Pengguna", render: record => `<strong>${escapeHtml(record.display_name || record.username)}</strong><small>${escapeHtml(record.username)}</small>` },
      { label: "Peranan", render: record => `<strong>${escapeHtml(getRoleLabel(record.role))}</strong><small>${escapeHtml(record.email || "-")}</small>` },
      { label: "Institusi", render: record => `<span>${escapeHtml(record.institution_id || "-")}</span><small>Dicipta: ${escapeHtml(formatDateTime(record.created_at))}</small>` },
      { label: "Status", render: record => statusBadge(readStatus(record)) }
    ]
  }
};

const state = {
  page: "",
  definition: null,
  session: null,
  records: [],
  pageNumber: 1,
  query: "",
  editingId: ""
};

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page || "";
  if (page === "settings") {
    initSettingsPage();
    return;
  }
  initCrudPage(page);
});

function initCrudPage(page) {
  const definition = CRUD_PAGES[page];
  if (!definition) return;
  const session = requireSession({
    permissions: definition.permissions || ["masters.manage"],
    fallback: "dashboard"
  });
  if (!session) return;

  state.page = page;
  state.definition = definition;
  state.session = session;
  normalizeCleanUrl(definition.route);
  setupLogoutButton();
  setupSidebar(definition.route, session);
  setPageText(definition);
  renderForm(definition);
  resetForm();
  bindCrudEvents();
  loadCrudRecords();
}

function setPageText(definition) {
  setText("#pageEyebrow", definition.eyebrow);
  setText("#pageTitle", definition.title);
  setText("#pageDescription", definition.description);
  setText("#editorTitle", definition.formTitle);
  setText("#editorHelp", definition.formHelp);
  document.title = `SPRAD | ${definition.title}`;
}

function bindCrudEvents() {
  document.querySelector("#search")?.addEventListener("input", (event) => {
    state.query = event.target.value;
    state.pageNumber = 1;
    renderCrudTable();
  });
  document.querySelector("#refreshBtn")?.addEventListener("click", () => loadCrudRecords({ skipCache: true }));
  document.querySelector("#newBtn")?.addEventListener("click", () => resetForm());
  document.querySelector("#cancelBtn")?.addEventListener("click", () => resetForm());
  document.querySelector("#prevPage")?.addEventListener("click", () => {
    state.pageNumber -= 1;
    renderCrudTable();
  });
  document.querySelector("#nextPage")?.addEventListener("click", () => {
    state.pageNumber += 1;
    renderCrudTable();
  });
  document.querySelector("#editorForm")?.addEventListener("submit", submitCrudForm);
  document.querySelector("#recordList")?.addEventListener("click", handleCrudTableClick);
}

async function loadCrudRecords(options = {}) {
  const cacheKey = getCacheKey(state.definition.cacheResource);
  const cached = options.skipCache ? null : readJsonStorage(localStorage, cacheKey, null);
  if (cached) {
    state.records = cached;
    renderCrudTable();
    setText("#cacheStatus", "Cache");
  } else {
    renderLoadingRows();
    setText("#cacheStatus", "Memuat");
  }

  try {
    const records = await listDataMaster(state.definition.resource, state.session.token, { includeArchived: true });
    state.records = records;
    writeJsonStorage(localStorage, cacheKey, records);
    renderCrudTable();
    setText("#cacheStatus", "Terkini");
  } catch (error) {
    if (cached) {
      showToast("Data cache dipaparkan", "Sambungan Google Sheets lambat atau gagal. Data lama masih boleh dibaca.", "info");
      return;
    }
    renderMessage("Backend V2 belum tersedia atau sambungan gagal. Kemas kini Code.gs dan redeploy Apps Script.");
    showToast("Tidak dapat memuatkan", readError(error), "error");
    setText("#cacheStatus", "Gagal");
  }
}

function renderCrudTable() {
  const filtered = filterRecords(state.records, state.query, state.definition.searchFields);
  const page = paginateRecords(filtered, state.pageNumber, PAGE_SIZE);
  state.pageNumber = page.currentPage;
  renderSummary(filtered);
  renderRows(page.items);
  updatePagination(page);
}

function renderSummary(records) {
  setText("#totalCount", records.length);
  setText("#activeCount", records.filter(record => readStatus(record) === "active").length);
  setText("#archivedCount", records.filter(record => readStatus(record) !== "active").length);
}

function renderRows(records) {
  const list = document.querySelector("#recordList");
  if (!list) return;
  list.innerHTML = "";
  if (!records.length) {
    renderMessage(state.query ? "Tiada rekod sepadan dengan carian." : "Tiada rekod untuk dipaparkan.");
    return;
  }

  records.forEach((record) => {
    const row = document.createElement("tr");
    row.className = "align-top transition hover:bg-slate-50";
    row.dataset.id = record.id || "";
    state.definition.columns.forEach((column) => {
      const cell = document.createElement("td");
      cell.dataset.label = column.label;
      cell.className = "px-4 py-4 text-sm font-semibold leading-6 text-slate-700";
      cell.innerHTML = `<div class="sprad-cell-stack">${column.render(record)}</div>`;
      row.append(cell);
    });
    const actionCell = document.createElement("td");
    actionCell.dataset.label = "Tindakan";
    actionCell.className = "px-4 py-4 text-right";
    actionCell.append(renderActionGroup(record));
    row.append(actionCell);
    list.append(row);
  });
}

function renderActionGroup(record) {
  const archived = readStatus(record) !== "active";
  const group = document.createElement("div");
  group.className = "flex flex-wrap justify-end gap-2";
  const edit = actionButton("Ubah", "edit", "primary");
  group.append(edit);
  if (archived) {
    group.append(actionButton("Restore", "restore", "success"));
  } else {
    group.append(actionButton(state.definition.resource === "users" ? "Nyahaktif" : "Arkib", "delete", "danger"));
  }
  return group;
}

async function handleCrudTableClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const row = button.closest("tr[data-id]");
  const id = row?.dataset.id;
  const record = state.records.find(item => String(item.id) === String(id));
  if (!record) return;

  if (button.dataset.action === "edit") {
    populateForm(record);
    return;
  }

  const action = button.dataset.action === "restore" ? state.definition.restoreAction : state.definition.deleteAction;

  setRowBusy(row, true);
  try {
    const receipt = await submitDataMasterMutation({
      action,
      token: state.session.token,
      payload: { id }
    });
    if (isActionCancelled(receipt)) {
      setRowBusy(row, false);
      showToast("Dibatalkan", "Tindakan tidak diteruskan.", "info");
      return;
    }
    showToast("Berjaya", "Rekod telah dikemaskini.", "success");
    resetForm();
    localStorage.removeItem(getCacheKey(state.definition.cacheResource));
    await loadCrudRecords({ skipCache: true });
  } catch (error) {
    setRowBusy(row, false);
    showToast("Tidak berjaya", readError(error), "error");
  }
}

async function submitCrudForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form));
  const validation = state.definition.validator(values);
  if (!validation.ok) {
    showToast("Semak semula", validation.error, "error");
    return;
  }

  const id = validation.data.id;
  const action = id ? state.definition.updateAction : state.definition.createAction;
  setFormBusy(true);
  try {
    const receipt = await submitDataMasterMutation({
      action,
      token: state.session.token,
      payload: validation.data
    });
    if (isActionCancelled(receipt)) {
      showToast("Dibatalkan", "Simpanan tidak diteruskan.", "info");
      return;
    }
    showToast("Disimpan", "Rekod data induk telah disahkan oleh Apps Script.", "success");
    resetForm();
    localStorage.removeItem(getCacheKey(state.definition.cacheResource));
    await loadCrudRecords({ skipCache: true });
  } catch (error) {
    showToast("Tidak berjaya", readError(error), "error");
  } finally {
    setFormBusy(false);
  }
}

function renderForm(definition, target = "#editorForm") {
  const form = document.querySelector(target);
  if (!form) return;
  form.innerHTML = definition.fields.map(renderField).join("");
  const actions = document.createElement("div");
  actions.className = "sprad-form-row flex flex-col gap-2 pt-2 sm:flex-row";
  actions.innerHTML = `
    <button id="submitBtn" type="submit" class="flex flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70">
      <i id="submitIcon" class="fa-solid fa-floppy-disk"></i>
      <span id="submitLabel">Simpan</span>
    </button>
    <button id="cancelBtn" type="button" class="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-600 transition hover:bg-slate-100">Tetap semula</button>
  `;
  form.append(actions);
}

function renderField(field) {
  if (field.superAdminOnly && state.session?.v2Role !== "super_admin") {
    return `<input name="${field.name}" type="hidden">`;
  }
  if (field.type === "hidden") return `<input name="${field.name}" type="hidden">`;
  const label = `<span class="text-xs font-extrabold uppercase tracking-wide text-slate-500">${field.label}</span>`;
  const base = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100";
  if (field.type === "textarea") {
    return `<label class="sprad-form-row block">${label}<textarea name="${field.name}" rows="${field.rows || 3}" ${field.required ? "required" : ""} class="${base}"></textarea></label>`;
  }
  if (field.type === "select") {
    const options = field.name === "role" && state.session?.v2Role !== "super_admin"
      ? field.options.filter(option => option.value !== "super_admin")
      : field.options;
    return `<label class="sprad-form-row block">${label}<select name="${field.name}" ${field.required ? "required" : ""} class="${base}">${options.map(option => `<option value="${option.value}">${option.label}</option>`).join("")}</select></label>`;
  }
  return `<label class="sprad-form-row block">${label}<input name="${field.name}" type="${field.type || "text"}" ${field.required ? "required" : ""} ${field.autocomplete ? `autocomplete="${field.autocomplete}"` : ""} placeholder="${escapeHtml(field.placeholder || "")}" class="${base}"></label>`;
}

function populateForm(record) {
  const form = document.querySelector("#editorForm");
  if (!form) return;
  state.editingId = record.id || "";
  state.definition.fields.forEach((field) => {
    const control = form.elements[field.name];
    if (!control) return;
    if (field.name === "password") {
      control.value = "";
      return;
    }
    control.value = record[field.name] ?? "";
  });
  setText("#editorMode", "Mod ubah rekod");
  document.querySelector("#editorCard")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetForm() {
  const form = document.querySelector("#editorForm");
  if (!form) return;
  form.reset();
  state.editingId = "";
  if (form.elements.id) form.elements.id.value = "";
  if (form.elements.institution_id && state.session?.institutionId) {
    form.elements.institution_id.value = state.session.institutionId;
  }
  setText("#editorMode", "Rekod baharu");
}

function updatePagination(page) {
  setText("#paginationSummary", page.total ? `Memaparkan ${page.start}-${page.end} daripada ${page.total} rekod` : "0 rekod");
  const prev = document.querySelector("#prevPage");
  const next = document.querySelector("#nextPage");
  if (prev) prev.disabled = page.currentPage <= 1;
  if (next) next.disabled = page.currentPage >= page.totalPages;
}

function renderLoadingRows() {
  const list = document.querySelector("#recordList");
  if (!list) return;
  list.innerHTML = "";
  Array.from({ length: PAGE_SIZE }).forEach(() => {
    const row = document.createElement("tr");
    row.className = "animate-pulse";
    ["Kod", "Nama", "Butiran", "Status", "Tindakan"].forEach(label => {
      const cell = document.createElement("td");
      cell.dataset.label = label;
      cell.className = "px-4 py-4";
      cell.innerHTML = `<span class="block h-4 w-3/4 rounded bg-slate-100"></span>`;
      row.append(cell);
    });
    list.append(row);
  });
}

function renderMessage(message) {
  const list = document.querySelector("#recordList");
  if (!list) return;
  list.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-sm font-bold text-slate-500">${escapeHtml(message)}</td></tr>`;
}

async function initSettingsPage() {
  const session = requireSession({
    permissions: ["masters.manage"],
    fallback: "dashboard"
  });
  if (!session) return;
  state.page = "settings";
  state.session = session;
  normalizeCleanUrl("settings");
  setupLogoutButton();
  setupSidebar("settings", session);
  setText("#pageEyebrow", "Tetapan data induk");
  setText("#pageTitle", "Kategori dan matriks risiko");
  setText("#pageDescription", "Urus kategori risiko, julat tahap risiko dan tempoh tindakan default.");
  document.title = "SPRAD | Tetapan risiko";
  renderForm(settingsCategoryDefinition(), "#editorForm");
  resetForm();
  bindSettingsEvents();
  await loadSettings();
}

function bindSettingsEvents() {
  document.querySelector("#search")?.addEventListener("input", (event) => {
    state.query = event.target.value;
    state.pageNumber = 1;
    renderCategoryTable();
  });
  document.querySelector("#refreshBtn")?.addEventListener("click", () => loadSettings({ skipCache: true }));
  document.querySelector("#newBtn")?.addEventListener("click", resetForm);
  document.querySelector("#cancelBtn")?.addEventListener("click", resetForm);
  document.querySelector("#editorForm")?.addEventListener("submit", submitCategoryForm);
  document.querySelector("#recordList")?.addEventListener("click", handleCategoryAction);
  document.querySelector("#riskLevelList")?.addEventListener("click", handleRiskLevelSunting);
  document.querySelector("#riskLevelForm")?.addEventListener("submit", submitRiskLevelForm);
  document.querySelector("#riskLevelCancel")?.addEventListener("click", resetRiskLevelForm);
  document.querySelector("#prevPage")?.addEventListener("click", () => {
    state.pageNumber -= 1;
    renderCategoryTable();
  });
  document.querySelector("#nextPage")?.addEventListener("click", () => {
    state.pageNumber += 1;
    renderCategoryTable();
  });
}

async function loadSettings(options = {}) {
  const cacheKey = getCacheKey("settingsCache");
  const cached = options.skipCache ? null : readJsonStorage(localStorage, cacheKey, null);
  if (cached) {
    state.records = cached.categories || [];
    state.riskMatrix = cached.riskMatrix || {};
    renderSettings();
    setText("#cacheStatus", "Cache");
  } else {
    renderLoadingRows();
    setText("#cacheStatus", "Memuat");
  }

  try {
    const [categories, riskMatrix] = await Promise.all([
      listDataMaster("riskCategories", state.session.token, { includeArchived: true }),
      getRiskMatrix(state.session.token)
    ]);
    state.records = categories;
    state.riskMatrix = riskMatrix;
    writeJsonStorage(localStorage, cacheKey, { categories, riskMatrix });
    renderSettings();
    setText("#cacheStatus", "Terkini");
  } catch (error) {
    if (cached) {
      showToast("Data cache dipaparkan", "Tetapan lama dipaparkan sementara sambungan gagal.", "info");
      return;
    }
    renderMessage("Backend V2 belum tersedia atau sambungan gagal. Kemas kini Code.gs dan redeploy Apps Script.");
    showToast("Tidak dapat memuatkan", readError(error), "error");
    setText("#cacheStatus", "Gagal");
  }
}

function renderSettings() {
  renderSummary(state.records);
  setText("#riskLevelCount", state.riskMatrix?.risk_levels?.length || 0);
  renderCategoryTable();
  renderRiskLevels();
}

function renderCategoryTable() {
  const filtered = filterRecords(state.records, state.query, ["code", "name", "description"]);
  const page = paginateRecords(filtered, state.pageNumber, PAGE_SIZE);
  state.pageNumber = page.currentPage;
  renderRowsForDefinition(page.items, settingsCategoryDefinition());
  updatePagination(page);
}

function renderRowsForDefinition(records, definition) {
  const previous = state.definition;
  state.definition = definition;
  renderRows(records);
  state.definition = previous;
}

function settingsCategoryDefinition() {
  return {
    resource: "riskCategories",
    createAction: "riskCategories.create",
    updateAction: "riskCategories.update",
    deleteAction: "riskCategories.delete",
    restoreAction: "riskCategories.restore",
    validator: validateRiskCategoryDraft,
    fields: [
      { name: "id", type: "hidden" },
      { name: "institution_id", label: "ID institusi", superAdminOnly: true, placeholder: "Contoh: inst_default" },
      { name: "code", label: "Kod kategori", required: true },
      { name: "name", label: "Nama kategori", required: true },
      { name: "description", label: "Penerangan", type: "textarea", rows: 3 },
      { name: "sort_order", label: "Susunan", type: "number" },
      { name: "status", label: "Status", type: "select", options: statusOptions() }
    ],
    columns: [
      { label: "Kod", render: record => `<strong>${escapeHtml(record.code)}</strong><small>Susunan: ${escapeHtml(record.sort_order || "-")}</small>` },
      { label: "Kategori", render: record => `<strong>${escapeHtml(record.name)}</strong><small>${escapeHtml(record.description || "-")}</small>` },
      { label: "Institusi", render: record => `<span>${escapeHtml(record.institution_id || "-")}</span><small>Dikemaskini: ${escapeHtml(formatDateTime(record.updated_at || record.created_at))}</small>` },
      { label: "Status", render: record => statusBadge(readStatus(record)) }
    ]
  };
}

async function submitCategoryForm(event) {
  event.preventDefault();
  const definition = settingsCategoryDefinition();
  const validation = definition.validator(Object.fromEntries(new FormData(event.currentTarget)));
  if (!validation.ok) {
    showToast("Semak semula", validation.error, "error");
    return;
  }
  setFormBusy(true);
  try {
    const receipt = await submitDataMasterMutation({
      action: validation.data.id ? definition.updateAction : definition.createAction,
      token: state.session.token,
      payload: validation.data
    });
    if (isActionCancelled(receipt)) {
      showToast("Dibatalkan", "Simpanan tidak diteruskan.", "info");
      return;
    }
    showToast("Disimpan", "Kategori risiko telah dikemaskini.", "success");
    resetForm();
    localStorage.removeItem(getCacheKey("settingsCache"));
    await loadSettings({ skipCache: true });
  } catch (error) {
    showToast("Tidak berjaya", readError(error), "error");
  } finally {
    setFormBusy(false);
  }
}

async function handleCategoryAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const definition = settingsCategoryDefinition();
  const row = button.closest("tr[data-id]");
  const id = row?.dataset.id;
  const record = state.records.find(item => String(item.id) === String(id));
  if (!record) return;

  if (button.dataset.action === "edit") {
    const previous = state.definition;
    state.definition = definition;
    populateForm(record);
    state.definition = previous;
    return;
  }

  const action = button.dataset.action === "restore" ? definition.restoreAction : definition.deleteAction;

  setRowBusy(row, true);
  try {
    const receipt = await submitDataMasterMutation({
      action,
      token: state.session.token,
      payload: { id }
    });
    if (isActionCancelled(receipt)) {
      setRowBusy(row, false);
      showToast("Dibatalkan", "Tindakan tidak diteruskan.", "info");
      return;
    }
    showToast("Berjaya", "Kategori risiko telah dikemaskini.", "success");
    resetForm();
    localStorage.removeItem(getCacheKey("settingsCache"));
    await loadSettings({ skipCache: true });
  } catch (error) {
    setRowBusy(row, false);
    showToast("Tidak berjaya", readError(error), "error");
  }
}

function renderRiskLevels() {
  const list = document.querySelector("#riskLevelList");
  if (!list) return;
  list.innerHTML = "";
  const levels = state.riskMatrix?.risk_levels || [];
  if (!levels.length) {
    list.innerHTML = `<tr><td colspan="5" class="p-5 text-center text-sm font-bold text-slate-500">Matriks risiko belum tersedia.</td></tr>`;
    return;
  }
  levels
    .slice()
    .sort((a, b) => Number(a.rank || 0) - Number(b.rank || 0))
    .forEach((level) => {
      const row = document.createElement("tr");
      row.dataset.id = level.id;
      row.className = "align-top transition hover:bg-slate-50";
      row.innerHTML = `
        <td data-label="Tahap" class="px-4 py-4 text-sm font-bold text-slate-900">
          <span class="inline-flex rounded-full px-3 py-1 text-xs font-extrabold text-white" style="background:${escapeHtml(level.color_hex || "#1e40af")}">${escapeHtml(level.label)}</span>
        </td>
        <td data-label="Skor" class="px-4 py-4 text-sm font-semibold text-slate-700">${escapeHtml(level.min_score)}-${escapeHtml(level.max_score)}</td>
        <td data-label="Rank" class="px-4 py-4 text-sm font-semibold text-slate-700">${escapeHtml(level.rank)}</td>
        <td data-label="SLA" class="px-4 py-4 text-sm font-semibold text-slate-700">${escapeHtml(level.default_due_days || "-")} hari</td>
        <td data-label="Tindakan" class="px-4 py-4 text-right"></td>
      `;
      row.querySelector("td:last-child").append(actionButton("Ubah", "edit-level", "primary"));
      list.append(row);
    });
}

function handleRiskLevelSunting(event) {
  const button = event.target.closest("[data-action='edit-level']");
  if (!button) return;
  const id = button.closest("tr[data-id]")?.dataset.id;
  const level = (state.riskMatrix?.risk_levels || []).find(item => String(item.id) === String(id));
  if (!level) return;
  const form = document.querySelector("#riskLevelForm");
  ["id", "label", "rank", "min_score", "max_score", "color_hex", "description", "default_due_days", "status"].forEach((name) => {
    if (form.elements[name]) form.elements[name].value = level[name] ?? "";
  });
  document.querySelector("#riskLevelCard")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function submitRiskLevelForm(event) {
  event.preventDefault();
  const validation = validateRiskLevelDraft(Object.fromEntries(new FormData(event.currentTarget)));
  if (!validation.ok) {
    showToast("Semak semula", validation.error, "error");
    return;
  }
  setRiskLevelBusy(true);
  try {
    const receipt = await submitDataMasterMutation({
      action: "riskLevels.update",
      token: state.session.token,
      payload: validation.data
    });
    if (isActionCancelled(receipt)) {
      showToast("Dibatalkan", "Simpanan tidak diteruskan.", "info");
      return;
    }
    showToast("Disimpan", "Tahap risiko telah dikemaskini.", "success");
    localStorage.removeItem(getCacheKey("settingsCache"));
    resetRiskLevelForm();
    await loadSettings({ skipCache: true });
  } catch (error) {
    showToast("Tidak berjaya", readError(error), "error");
  } finally {
    setRiskLevelBusy(false);
  }
}

function resetRiskLevelForm() {
  document.querySelector("#riskLevelForm")?.reset();
}

function setFormBusy(isBusy) {
  document.querySelector("#editorForm")?.querySelectorAll("button, input, textarea, select").forEach(control => {
    control.disabled = isBusy;
  });
  const icon = document.querySelector("#submitIcon");
  const label = document.querySelector("#submitLabel");
  if (icon) icon.className = isBusy ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-floppy-disk";
  if (label) label.textContent = isBusy ? "Menyimpan..." : "Simpan";
}

function setRiskLevelBusy(isBusy) {
  document.querySelector("#riskLevelForm")?.querySelectorAll("button, input, textarea, select").forEach(control => {
    control.disabled = isBusy;
  });
}

function setRowBusy(row, isBusy) {
  row.querySelectorAll("button").forEach(button => {
    button.disabled = isBusy;
    button.classList.toggle("cursor-wait", isBusy);
    button.classList.toggle("opacity-60", isBusy);
  });
}

function actionButton(label, action, tone = "neutral") {
  const button = document.createElement("button");
  const styles = {
    neutral: "border-slate-200 bg-white text-slate-600 hover:bg-slate-100",
    primary: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    danger: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
  };
  button.type = "button";
  button.dataset.action = action;
  button.className = `rounded-full border px-3 py-1.5 text-[11px] font-extrabold transition ${styles[tone] || styles.neutral}`;
  button.textContent = label;
  return button;
}

function readStatus(record) {
  if (record.deactivated_at) return "inactive";
  if (record.deleted_at) return "archived";
  return String(record.status || "active").toLowerCase();
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function getCacheKey(resource) {
  return buildScopedCacheKey({
    userId: state.session?.userId,
    institutionId: state.session?.institutionId,
    resource
  });
}

function readError(error) {
  const message = error?.message || "Permintaan gagal.";
  const normalized = message.toLowerCase();
  if (normalized.includes("unknown action") || normalized.includes("tindakan tidak diketahui")) {
    return "Apps Script belum versi Fasa 2. Kemas kini Code.gs dan deploy semula Aplikasi Web.";
  }
  return message;
}

function statusOptions() {
  return [
    { value: "active", label: getRecordStatusLabel("active") },
    { value: "inactive", label: getRecordStatusLabel("inactive") }
  ];
}

function roleOptions() {
  return [
    { value: "institution_admin", label: "Pentadbir Institusi" },
    { value: "auditor", label: "Juruaudit" },
    { value: "reviewer", label: "Penyemak" },
    { value: "viewer", label: "Pembaca" },
    { value: "super_admin", label: "Pentadbir Utama" }
  ];
}

function unitTypeOptions() {
  return [
    { value: "Fakulti", label: "Fakulti" },
    { value: "Jabatan", label: "Jabatan" },
    { value: "Pusat", label: "Pusat" },
    { value: "Unit", label: "Unit" },
    { value: "Kampus", label: "Kampus" }
  ];
}
