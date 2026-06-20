import { STORAGE_KEYS } from "../config.js";
import {
  normalizeCleanUrl,
  requireSession,
  setupLogoutButton,
  setupSidebar,
  showToast,
  statusBadge
} from "../components/app-shell.js";
import {
  getCorrectiveActionWorkflowActions,
  getFindingWorkflowActions,
  getWorkflowStatusLabel,
  validateAuditCycleDraft,
  validateAuditDraft,
  validateCorrectiveActionDraft,
  validateFindingDraft
} from "../core/audit-workflow-utils.js";
import { filterRecords, paginateRecords } from "../core/data-master-utils.js";
import { hasPermission, normalizeRole } from "../core/permissions.js";
import { listAuditResource, submitAuditMutation } from "../services/audit-service.js";

const PAGE_SIZE = 5;

const PAGES = {
  "audit-cycles": {
    route: "audit-cycles",
    resource: "auditCycles",
    cacheKey: STORAGE_KEYS.auditCyclesCache,
    permissions: ["audit.manage"],
    title: "Kitaran Audit",
    eyebrow: "Fasa 3",
    description: "Urus tahun, tempoh, rujukan laporan dan status kitaran audit.",
    createAction: "auditCycles.create",
    updateAction: "auditCycles.update",
    deleteAction: "auditCycles.delete",
    restoreAction: "auditCycles.restore",
    searchFields: ["title", "audit_year", "report_reference", "status"],
    validator: validateAuditCycleDraft,
    canMutate: role => hasPermission(role, "audit.manage"),
    fields: [
      { name: "title", label: "Tajuk kitaran", required: true },
      { name: "audit_year", label: "Tahun audit", required: true },
      { name: "start_date", label: "Tarikh mula", type: "date" },
      { name: "end_date", label: "Tarikh tamat", type: "date" },
      { name: "status", label: "Status", type: "select", options: [["open", "Terbuka"], ["in_progress", "Sedang berjalan"], ["closed", "Ditutup"], ["finalized", "Dimuktamadkan"]] },
      { name: "report_reference", label: "Rujukan laporan" }
    ],
    cells: record => [
      stack(record.audit_year, record.report_reference || "Tiada rujukan"),
      stack(record.title, `Tempoh: ${display(record.start_date)} - ${display(record.end_date)}`),
      stack(getWorkflowStatusLabel(record.status), `Dikemaskini: ${display(record.updated_at)}`),
      statusBadge(record.deleted_at ? "archived" : record.status || "active")
    ],
    extraActions: record => record.status !== "finalized" && !record.deleted_at
      ? [{ action: "auditCycles.finalize", label: "Muktamad", icon: "fa-lock", type: "warning" }]
      : []
  },
  audits: {
    route: "audits",
    resource: "audits",
    cacheKey: STORAGE_KEYS.auditsCache,
    permissions: ["audit.manage"],
    title: "Audit",
    eyebrow: "Fasa 3",
    description: "Daftar audit, skop, objektif dan juruaudit utama mengikut kitaran.",
    createAction: "audits.create",
    updateAction: "audits.update",
    deleteAction: "audits.delete",
    restoreAction: "audits.restore",
    searchFields: ["audit_code", "title", "scope", "objective", "status"],
    validator: validateAuditDraft,
    canMutate: role => hasPermission(role, "audit.manage"),
    lookups: ["auditCycles", "users"],
    fields: [
      { name: "cycle_id", label: "Kitaran audit", type: "select", required: true, lookup: "auditCycles", optionLabel: item => `${item.audit_year || "-"} - ${item.title}` },
      { name: "audit_code", label: "Kod audit", required: true },
      { name: "title", label: "Tajuk audit", required: true },
      { name: "scope", label: "Skop", type: "textarea" },
      { name: "objective", label: "Objektif", type: "textarea" },
      { name: "lead_auditor_user_id", label: "Juruaudit utama", type: "select", lookup: "users", optionLabel: item => item.display_name || item.username },
      { name: "start_date", label: "Tarikh mula", type: "date" },
      { name: "end_date", label: "Tarikh tamat", type: "date" },
      { name: "status", label: "Status", type: "select", options: [["open", "Terbuka"], ["in_progress", "Sedang berjalan"], ["completed", "Selesai"], ["closed", "Ditutup"]] }
    ],
    cells: (record, lookups) => [
      stack(record.audit_code, lookupLabel(lookups.auditCycles, record.cycle_id, "title")),
      stack(record.title, record.scope || "Skop belum diisi"),
      stack(getWorkflowStatusLabel(record.status), record.objective || "Objektif belum diisi"),
      statusBadge(record.deleted_at ? "archived" : record.status || "active")
    ]
  },
  findings: {
    route: "findings",
    resource: "findings",
    cacheKey: STORAGE_KEYS.findingsCache,
    permissions: ["findings.create", "findings.review", "reports.view"],
    title: "Penemuan Audit",
    eyebrow: "Fasa 3 dan 4",
    description: "Urus penemuan, pengiraan risiko, semakan, kelulusan dan kaitan PTJ.",
    createAction: "findings.create",
    updateAction: "findings.update",
    deleteAction: "findings.delete",
    restoreAction: "findings.restore",
    searchFields: ["finding_no", "title", "issue_description", "recommendation", "workflow_status"],
    validator: validateFindingDraft,
    canMutate: role => hasPermission(role, "findings.create") || hasPermission(role, "findings.manage") || hasPermission(role, "findings.review"),
    lookups: ["auditCycles", "audits", "riskCategories", "orgUnits"],
    fields: [
      { name: "cycle_id", label: "Kitaran audit", type: "select", required: true, lookup: "auditCycles", optionLabel: item => `${item.audit_year || "-"} - ${item.title}` },
      { name: "audit_id", label: "Audit", type: "select", lookup: "audits", optionLabel: item => `${item.audit_code || "-"} - ${item.title}` },
      { name: "category_id", label: "Kategori risiko", type: "select", required: true, lookup: "riskCategories", optionLabel: item => `${item.code || "-"} - ${item.name}` },
      { name: "unit_ids", label: "PTJ terlibat", help: "Pisahkan lebih daripada satu ID PTJ dengan koma. Contoh: unit_demo_01, unit_demo_02" },
      { name: "finding_no", label: "No rujukan" },
      { name: "title", label: "Tajuk isu", required: true },
      { name: "issue_description", label: "Huraian isu", type: "textarea", required: true },
      { name: "detailed_justification", label: "Justifikasi terperinci", type: "textarea" },
      { name: "root_cause", label: "Punca akar", type: "textarea" },
      { name: "impact_description", label: "Impak", type: "textarea" },
      { name: "audit_evidence", label: "URL bukti" },
      { name: "recommendation", label: "Cadangan", type: "textarea" },
      { name: "likelihood", label: "Kebarangkalian (1-4)", type: "number", min: 1, max: 4, required: true },
      { name: "impact", label: "Impak (1-4)", type: "number", min: 1, max: 4, required: true }
    ],
    cells: (record, lookups) => [
      stack(record.finding_no || record.id, lookupLabel(lookups.riskCategories, record.category_id, "name")),
      stack(record.title, trimText(record.issue_description, 110)),
      stack(`${record.calculated_score || "-"} mata`, getWorkflowStatusLabel(record.workflow_status)),
      riskPill(record)
    ],
    workflowActions: (record, role) => getFindingWorkflowActions(record, role)
  },
  "corrective-actions": {
    route: "corrective-actions",
    resource: "correctiveActions",
    cacheKey: STORAGE_KEYS.correctiveActionsCache,
    permissions: ["findings.create", "findings.review", "actions.verify"],
    title: "Tindakan Pembetulan",
    eyebrow: "Fasa 4",
    description: "Pantau tindakan, tarikh sasaran, kemajuan, pengesahan dan kelewatan.",
    createAction: "correctiveActions.create",
    updateAction: "correctiveActions.update",
    deleteAction: "correctiveActions.delete",
    restoreAction: "correctiveActions.restore",
    searchFields: ["action_text", "owner_name", "status", "progress_note"],
    validator: validateCorrectiveActionDraft,
    canMutate: role => hasPermission(role, "findings.create") || hasPermission(role, "actions.verify") || hasPermission(role, "findings.review"),
    lookups: ["findings", "orgUnits", "users"],
    fields: [
      { name: "finding_id", label: "Penemuan", type: "select", required: true, lookup: "findings", optionLabel: item => `${item.finding_no || "-"} - ${item.title}` },
      { name: "action_text", label: "Tindakan", type: "textarea", required: true },
      { name: "owner_name", label: "Pemilik tindakan" },
      { name: "owner_user_id", label: "Akaun pemilik", type: "select", lookup: "users", optionLabel: item => item.display_name || item.username },
      { name: "owner_unit_id", label: "PTJ pemilik", type: "select", lookup: "orgUnits", optionLabel: item => `${item.code || "-"} - ${item.name}` },
      { name: "target_date", label: "Tarikh sasaran", type: "date" },
      { name: "status", label: "Status", type: "select", options: [["open", "Terbuka"], ["in_progress", "Sedang berjalan"], ["awaiting_verification", "Menunggu pengesahan"], ["verified", "Disahkan"], ["returned", "Dipulangkan"], ["closed", "Ditutup"]] },
      { name: "progress_percent", label: "Kemajuan %", type: "number", min: 0, max: 100 },
      { name: "progress_note", label: "Catatan kemajuan", type: "textarea" },
      { name: "completion_evidence", label: "URL bukti siap" },
      { name: "verification_note", label: "Catatan pengesahan", type: "textarea" }
    ],
    cells: (record, lookups) => [
      stack(record.owner_name || "Tiada pemilik", lookupLabel(lookups.findings, record.finding_id, "title")),
      stack(trimText(record.action_text, 90), `Sasaran: ${display(record.target_date)}`),
      stack(`${record.progress_percent || 0}%`, getWorkflowStatusLabel(record.status)),
      record.overdue ? badge("Lewat", "red") : badge("Dalam kawalan", "green")
    ],
    workflowActions: (record, role) => getCorrectiveActionWorkflowActions(record, role)
  },
  "audit-logs": {
    route: "audit-logs",
    resource: "auditLogs",
    cacheKey: STORAGE_KEYS.auditLogsCache,
    permissions: ["findings.review", "users.manage"],
    title: "Log Audit",
    eyebrow: "Fasa 6",
    description: "Jejak tindakan sistem untuk semakan kawalan, pematuhan dan troubleshooting.",
    readOnly: true,
    searchFields: ["action", "entity_type", "entity_id", "user_id", "request_id"],
    canMutate: () => false,
    cells: record => [
      stack(display(record.created_at), record.user_id || "system"),
      stack(record.action, record.entity_type),
      stack(record.entity_id || "-", record.request_id || "-"),
      badge("Direkod", "blue")
    ]
  }
};

const route = document.body.dataset.page;
const page = PAGES[route];
const state = {
  records: [],
  lookups: {},
  currentPage: 1,
  query: "",
  editing: null,
  includeArchived: false,
  loading: false
};

if (!page) throw new Error("Halaman audit tidak sah.");

ensureAuditShell();
normalizeCleanUrl(page.route);
const session = requireSession({ permissions: page.permissions, fallback: "form" });
if (session) init();

async function init() {
  setupLogoutButton();
  setupSidebar(page.route, session);
  setText("pageEyebrow", page.eyebrow);
  setText("pageTitle", page.title);
  setText("pageDescription", page.description);
  document.title = `SPRAD | ${page.title}`;

  document.querySelector("#search")?.addEventListener("input", event => {
    state.query = event.target.value;
    state.currentPage = 1;
    render();
  });
  document.querySelector("#includeArchived")?.addEventListener("change", event => {
    state.includeArchived = event.target.checked;
    state.currentPage = 1;
    loadData({ force: true });
  });
  document.querySelector("#refreshBtn")?.addEventListener("click", () => loadData({ force: true }));
  document.querySelector("#newBtn")?.addEventListener("click", () => startCreate());
  document.querySelector("#prevPage")?.addEventListener("click", () => {
    state.currentPage = Math.max(1, state.currentPage - 1);
    render();
  });
  document.querySelector("#nextPage")?.addEventListener("click", () => {
    state.currentPage += 1;
    render();
  });
  document.querySelector("#recordList")?.addEventListener("click", handleListClick);
  document.querySelector("#editorForm")?.addEventListener("submit", handleSubmit);

  if (page.readOnly) {
    document.querySelector("#editorCard")?.classList.add("hidden");
    document.querySelector("#newBtn")?.classList.add("hidden");
  }
  if (!canCreateRecord_()) {
    document.querySelector("#newBtn")?.classList.add("hidden");
    document.querySelector("#editorCard")?.classList.add("hidden");
  }

  renderForm();
  await loadLookups();
  await loadData();
}

async function loadLookups() {
  if (!page.lookups?.length) return;
  await Promise.all(page.lookups.map(async resource => {
    try {
      state.lookups[resource] = await listAuditResource(resource, session.token, { includeArchived: false });
    } catch (err) {
      state.lookups[resource] = [];
    }
  }));
  renderForm();
}

async function loadData({ force = false } = {}) {
  const cached = readCache();
  if (cached && !force) {
    state.records = cached;
    setText("cacheStatus", "Cache tempatan");
    render();
  } else {
    renderLoading();
  }

  state.loading = true;
  try {
    const records = await listAuditResource(page.resource, session.token, { includeArchived: state.includeArchived });
    state.records = records;
    writeCache(records);
    setText("cacheStatus", "Dikemaskini");
    render();
  } catch (err) {
    if (!cached) renderError(err.message);
    showToast("Ralat data", err.message || "Data tidak dapat dimuatkan.", "error");
  } finally {
    state.loading = false;
  }
}

function render() {
  const filtered = filterRecords(state.records, state.query, page.searchFields);
  const meta = paginateRecords(filtered, state.currentPage, PAGE_SIZE);
  state.currentPage = meta.currentPage;

  setText("totalCount", String(state.records.length));
  setText("activeCount", String(state.records.filter(record => !record.deleted_at && !["archived", "inactive"].includes(String(record.status || "").toLowerCase())).length));
  setText("archivedCount", String(state.records.filter(record => record.deleted_at || ["archived", "inactive"].includes(String(record.status || "").toLowerCase())).length));
  setText("paginationSummary", meta.total ? `${meta.start}-${meta.end} daripada ${meta.total} rekod` : "0 rekod");
  const prev = document.querySelector("#prevPage");
  const next = document.querySelector("#nextPage");
  if (prev) prev.disabled = meta.currentPage <= 1;
  if (next) next.disabled = meta.currentPage >= meta.totalPages;

  const body = document.querySelector("#recordList");
  if (!body) return;
  if (!meta.items.length) {
    body.innerHTML = `<tr><td colspan="5" class="px-5 py-10 text-center text-sm font-bold text-slate-500">Tiada rekod ditemui.</td></tr>`;
    return;
  }
  body.innerHTML = meta.items.map(record => renderRow(record)).join("");
}

function renderRow(record) {
  const cells = page.cells(record, state.lookups);
  return `
    <tr>
      <td data-label="Rujukan" class="px-4 py-4">${cells[0]}</td>
      <td data-label="Butiran" class="px-4 py-4">${cells[1]}</td>
      <td data-label="Status" class="px-4 py-4">${cells[2]}</td>
      <td data-label="Petunjuk" class="px-4 py-4">${cells[3]}</td>
      <td data-label="Tindakan" class="px-4 py-4">${renderActionButtons(record)}</td>
    </tr>
  `;
}

function renderActionButtons(record) {
  const role = currentRole_();
  const buttons = [];

  if (!page.readOnly && canEditRecord_(record)) {
    buttons.push(actionButton("edit", record.id, "Edit", "fa-pen", "blue"));
  }
  if (!page.readOnly && canRestoreRecord_(record)) {
    buttons.push(actionButton("restore", record.id, "Pulih", "fa-rotate-left", "green"));
  } else if (!page.readOnly && canDeleteRecord_(record)) {
    buttons.push(actionButton("delete", record.id, "Arkib", "fa-box-archive", "slate"));
  }

  (page.extraActions?.(record, role) || []).forEach(action => {
    if (canRunWorkflowAction_(action.action, record)) {
      buttons.push(actionButton("workflow", record.id, action.label, action.icon, action.type, action.action));
    }
  });
  (page.workflowActions?.(record, role) || []).forEach(action => {
    if (canRunWorkflowAction_(action.action, record)) {
      buttons.push(actionButton("workflow", record.id, action.label, action.icon, action.type, action.action));
    }
  });

  return buttons.length
    ? `<div class="flex flex-wrap gap-2">${buttons.join("")}</div>`
    : `<span class="text-xs font-bold text-slate-400">Tiada tindakan</span>`;
}

function renderForm(record = {}) {
  const form = document.querySelector("#editorForm");
  if (!form || page.readOnly) return;
  const allowed = state.editing ? canEditRecord_(state.editing) : canCreateRecord_();
  const editorCard = document.querySelector("#editorCard");
  if (!allowed) {
    editorCard?.classList.add("hidden");
    return;
  }
  editorCard?.classList.remove("hidden");
  setText("editorMode", state.editing ? "Kemaskini rekod" : "Rekod baharu");
  setText("editorTitle", state.editing ? "Edit butiran" : `Tambah ${page.title.toLowerCase()}`);
  setText("editorHelp", "Medan bertanda wajib perlu lengkap sebelum disimpan.");
  const fields = page.fields || [];
  form.innerHTML = `
    <input type="hidden" name="id" value="${escapeAttr(record.id || "")}">
    ${fields.map(field => renderField(field, record)).join("")}
    <div class="flex flex-col gap-2 md:col-span-2 xl:col-span-1">
      <button type="submit" class="rounded-full bg-blue-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-700"><i class="fa-solid fa-floppy-disk mr-2"></i>Simpan</button>
      <button id="cancelEdit" type="button" class="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-600 transition hover:bg-slate-100">Batal</button>
    </div>
  `;
  document.querySelector("#cancelEdit")?.addEventListener("click", startCreate);
}

function renderField(field, record) {
  const value = record[field.name] ?? "";
  const required = field.required ? "required" : "";
  const common = `id="field_${field.name}" name="${field.name}" ${required}`;
  const label = `<label for="field_${field.name}" class="text-xs font-extrabold uppercase tracking-widest text-slate-500">${field.label}${field.required ? " *" : ""}</label>`;
  let control = "";

  if (field.type === "textarea") {
    control = `<textarea ${common} rows="3" class="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold outline-none">${escapeHtml(value)}</textarea>`;
  } else if (field.type === "select") {
    const options = field.lookup ? lookupOptions(field) : field.options || [];
    control = `<select ${common} class="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold outline-none">
      <option value="">Pilih...</option>
      ${options.map(([optionValue, optionLabel]) => `<option value="${escapeAttr(optionValue)}" ${String(optionValue) === String(value) ? "selected" : ""}>${escapeHtml(optionLabel)}</option>`).join("")}
    </select>`;
  } else {
    const type = field.type || "text";
    const min = field.min !== undefined ? `min="${field.min}"` : "";
    const max = field.max !== undefined ? `max="${field.max}"` : "";
    control = `<input ${common} type="${type}" ${min} ${max} value="${escapeAttr(value)}" class="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold outline-none">`;
  }

  const help = field.help ? `<p class="text-[11px] font-semibold leading-5 text-slate-400">${escapeHtml(field.help)}</p>` : "";
  return `<div class="grid gap-2">${label}${control}${help}</div>`;
}

function lookupOptions(field) {
  return (state.lookups[field.lookup] || [])
    .filter(item => !item.deleted_at && item.status !== "archived")
    .map(item => [item.id, field.optionLabel ? field.optionLabel(item) : item.name || item.title || item.id]);
}

function currentRole_() {
  return normalizeRole(session.v2Role || session.legacyRole);
}

function currentUserId_() {
  return String(session.userId || "");
}

function isDeletedRecord_(record) {
  return Boolean(record?.deleted_at) || String(record?.status || "").toLowerCase() === "archived";
}

function canCreateRecord_() {
  return !page.readOnly && Boolean(page.canMutate?.(currentRole_()));
}

function canEditRecord_(record) {
  if (!record?.id || page.readOnly || isDeletedRecord_(record)) return false;
  const role = currentRole_();
  if (!page.canMutate?.(role)) return false;
  if (page.resource === "auditCycles") return hasPermission(role, "audit.manage") && record.status !== "finalized";
  if (page.resource === "audits") return hasPermission(role, "audit.manage");
  if (page.resource === "findings") return canManageFindingRecord_(record, role);
  if (page.resource === "correctiveActions") return canManageCorrectiveActionRecord_(record, role);
  return false;
}

function canDeleteRecord_(record) {
  return !isDeletedRecord_(record) && canEditRecord_(record);
}

function canRestoreRecord_(record) {
  if (!record?.id || page.readOnly || !isDeletedRecord_(record)) return false;
  const role = currentRole_();
  if (!["super_admin", "institution_admin"].includes(role)) return false;
  if (page.resource === "auditCycles") return hasPermission(role, "audit.manage") && record.status !== "finalized";
  if (page.resource === "audits") return hasPermission(role, "audit.manage");
  return ["findings", "correctiveActions"].includes(page.resource);
}

function canRunWorkflowAction_(action, record) {
  if (!action || !record?.id || isDeletedRecord_(record)) return false;
  const role = currentRole_();
  const status = String(record.workflow_status || record.status || "").toLowerCase();
  if (action === "auditCycles.finalize") return hasPermission(role, "audit.manage") && status !== "finalized";
  if (action === "findings.submit") return ["draft", "returned"].includes(status) && canManageFindingRecord_(record, role);
  if (action === "findings.approve" || action === "findings.return") return status === "submitted" && hasPermission(role, "findings.review");
  if (action === "findings.overrideLevel") return ["submitted", "approved"].includes(status) && hasPermission(role, "findings.review");
  if (action === "correctiveActions.submitForVerification") {
    return ["open", "in_progress", "returned"].includes(status) && canManageCorrectiveActionRecord_(record, role);
  }
  if (action === "correctiveActions.verify" || action === "correctiveActions.return") {
    return status === "awaiting_verification" && hasPermission(role, "actions.verify");
  }
  return false;
}

function canManageFindingRecord_(record, role = currentRole_()) {
  if (["super_admin", "institution_admin", "reviewer"].includes(role)) return true;
  if (role !== "auditor") return false;
  const status = String(record.workflow_status || "draft").toLowerCase();
  return String(record.created_by || "") === currentUserId_() && ["draft", "returned"].includes(status);
}

function canManageCorrectiveActionRecord_(record, role = currentRole_()) {
  if (["super_admin", "institution_admin", "reviewer"].includes(role)) return true;
  if (role !== "auditor") return false;
  const ownAction = String(record.created_by || record.owner_user_id || "") === currentUserId_();
  const status = String(record.status || "open").toLowerCase();
  return ownAction && ["open", "in_progress", "returned"].includes(status);
}

async function handleSubmit(event) {
  event.preventDefault();
  if (state.editing ? !canEditRecord_(state.editing) : !canCreateRecord_()) {
    showToast("Akses terhad", "Anda tidak mempunyai kebenaran untuk menyimpan rekod ini.", "warning");
    return;
  }
  const form = event.currentTarget;
  const payload = Object.fromEntries(new FormData(form).entries());
  if (state.editing) payload.id = state.editing.id;
  const validation = page.validator(payload);
  if (!validation.ok) {
    showToast("Semak borang", validation.error, "warning");
    return;
  }

  const action = state.editing ? page.updateAction : page.createAction;
  await runMutation(action, validation.data, "Rekod berjaya disimpan.");
  startCreate();
}

async function handleListClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const record = state.records.find(item => String(item.id) === String(button.dataset.id));
  if (!record) return;
  const action = button.dataset.action;
  if (action === "edit") {
    if (!canEditRecord_(record)) {
      showToast("Akses terhad", "Rekod ini tidak boleh diubah oleh peranan anda.", "warning");
      return;
    }
    state.editing = record;
    renderForm(record);
    document.querySelector("#editorCard")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (action === "delete") {
    if (!canDeleteRecord_(record)) {
      showToast("Akses terhad", "Rekod ini tidak boleh diarkib oleh peranan anda.", "warning");
      return;
    }
    if (confirm("Arkibkan rekod ini?")) await runMutation(page.deleteAction, { id: record.id }, "Rekod diarkibkan.");
    return;
  }
  if (action === "restore") {
    if (!canRestoreRecord_(record)) {
      showToast("Akses terhad", "Rekod ini tidak boleh dipulihkan oleh peranan anda.", "warning");
      return;
    }
    await runMutation(page.restoreAction, { id: record.id }, "Rekod dipulihkan.");
    return;
  }
  if (action === "workflow") {
    if (!canRunWorkflowAction_(button.dataset.workflow, record)) {
      showToast("Akses terhad", "Tindakan workflow ini tidak dibenarkan.", "warning");
      return;
    }
    await handleWorkflow(button.dataset.workflow, record);
  }
}

async function handleWorkflow(action, record) {
  const payload = { id: record.id };
  if (action === "findings.return") {
    payload.review_note = prompt("Catatan pulangan") || "";
    if (!payload.review_note) return;
  }
  if (action === "findings.approve") {
    payload.review_note = prompt("Catatan kelulusan (optional)") || "";
  }
  if (action === "findings.overrideLevel") {
    payload.final_level_id = prompt("Masukkan ID tahap risiko akhir (contoh: rl_high)") || "";
    payload.override_reason = prompt("Sebab override tahap risiko") || "";
    if (!payload.final_level_id || !payload.override_reason) return;
  }
  if (action === "correctiveActions.submitForVerification") {
    payload.progress_note = prompt("Catatan kemajuan / bukti siap") || record.progress_note || "";
    payload.completion_evidence = record.completion_evidence || "";
  }
  if (action === "correctiveActions.verify") {
    payload.status = "verified";
    payload.verification_note = prompt("Catatan pengesahan") || "";
  }
  if (action === "correctiveActions.return") {
    payload.verification_note = prompt("Catatan pulangan tindakan") || "";
    if (!payload.verification_note) return;
  }
  await runMutation(action, payload, "Workflow berjaya dikemaskini.");
}

async function runMutation(action, payload, successText) {
  if (!action) return;
  setText("cacheStatus", "Menyimpan...");
  try {
    await submitAuditMutation({ action, token: session.token, payload });
    clearRelatedCaches();
    showToast("Berjaya", successText, "success");
    await loadData({ force: true });
  } catch (err) {
    showToast("Ralat simpan", err.message || "Rekod gagal disimpan.", "error");
    setText("cacheStatus", "Ralat");
  }
}

function startCreate() {
  state.editing = null;
  renderForm();
}

function renderLoading() {
  const body = document.querySelector("#recordList");
  if (!body) return;
  setText("cacheStatus", "Memuat...");
  body.innerHTML = Array.from({ length: 3 }, () => `
    <tr><td colspan="5" class="px-5 py-4">
      <div class="h-14 animate-pulse rounded-xl bg-slate-100"></div>
    </td></tr>
  `).join("");
}

function renderError(message) {
  const body = document.querySelector("#recordList");
  if (!body) return;
  body.innerHTML = `<tr><td colspan="5" class="px-5 py-10 text-center text-sm font-bold text-red-600">${escapeHtml(message || "Data tidak dapat dimuatkan.")}</td></tr>`;
}

function readCache() {
  try {
    const raw = localStorage.getItem(page.cacheKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(records) {
  localStorage.setItem(page.cacheKey, JSON.stringify(records));
}

function clearRelatedCaches() {
  [
    STORAGE_KEYS.auditCyclesCache,
    STORAGE_KEYS.auditsCache,
    STORAGE_KEYS.findingsCache,
    STORAGE_KEYS.correctiveActionsCache,
    STORAGE_KEYS.auditLogsCache,
    STORAGE_KEYS.dashboardCache,
    STORAGE_KEYS.reportsCache
  ].forEach(key => localStorage.removeItem(key));
}

function actionButton(action, id, label, icon, type = "slate", workflow = "") {
  const styles = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-red-200 bg-red-50 text-red-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
    slate: "border-slate-200 bg-white text-slate-600"
  };
  return `<button type="button" data-action="${action}" data-id="${escapeAttr(id)}" data-workflow="${escapeAttr(workflow)}" class="rounded-full border px-3 py-2 text-[11px] font-extrabold transition hover:-translate-y-0.5 ${styles[type] || styles.slate}"><i class="fa-solid ${icon} mr-1"></i>${escapeHtml(label)}</button>`;
}

function stack(primary, secondary) {
  return `<div class="sprad-cell-stack"><strong>${escapeHtml(display(primary))}</strong><small>${escapeHtml(display(secondary))}</small></div>`;
}

function badge(text, color = "slate") {
  const styles = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-100 text-slate-600"
  };
  return `<span class="inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide ${styles[color] || styles.slate}">${escapeHtml(text)}</span>`;
}

function riskPill(record) {
  const score = Number(record.calculated_score || 0);
  if (score >= 13) return badge("Kritikal", "red");
  if (score >= 9) return badge("Tinggi", "red");
  if (score >= 5) return badge("Sederhana", "blue");
  return badge("Rendah", "green");
}

function lookupLabel(records = [], id, field) {
  const match = records.find(item => String(item.id) === String(id));
  return match ? display(match[field] || match.name || match.title || match.id) : display(id || "Tiada");
}

function trimText(value, length) {
  const text = display(value);
  return text.length > length ? `${text.slice(0, length - 1)}...` : text;
}

function display(value) {
  return value === undefined || value === null || value === "" ? "-" : String(value);
}

function setText(id, value) {
  const element = document.querySelector(`#${id}`);
  if (element) element.textContent = value;
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

function ensureAuditShell() {
  if (document.querySelector("#recordList")) return;
  document.body.className = document.body.className || "min-h-screen bg-slate-50 text-slate-800 antialiased";
  document.body.innerHTML = `
    <div id="toast" class="fixed right-4 top-20 z-[100] hidden w-[calc(100%-2rem)] max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80">
      <div class="flex gap-3"><div id="toastIcon" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><i class="fa-solid fa-circle-info"></i></div><div><p id="toastTitle" class="text-sm font-extrabold text-slate-900"></p><p id="toastText" class="mt-1 text-xs font-semibold leading-5 text-slate-500"></p></div></div>
    </div>
    <header class="sticky top-0 z-50 h-16 border-b border-gray-100 bg-white shadow-sm">
      <div class="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="./" class="flex items-center gap-3"><img src="https://www.akm.gov.my/templates/yootheme/cache/91/JATA%20NEGARA%20AI-01-91eac591.webp" alt="Jata Negara" class="h-10 w-10 object-contain"><div><p class="text-base font-extrabold tracking-tight text-slate-800">SPRAD</p><p class="text-[9px] font-semibold uppercase tracking-widest text-slate-500">Sistem Penilaian Risiko Audit Dalam</p></div></a>
        <nav class="hidden items-center gap-6 text-xs font-bold uppercase tracking-wide text-slate-600 sm:flex"><a href="dashboard" class="hover:text-blue-600">Dashboard</a><button id="logout" type="button" class="rounded-full bg-slate-900 px-4 py-2 text-white transition hover:bg-black">Log keluar</button></nav>
      </div>
    </header>
    <main class="mx-auto grid w-full max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
      <aside class="self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-20">
        <div class="flex items-center justify-between gap-3"><p class="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Ruang kerja</p><span id="sidebarRole" class="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-blue-700">SPRAD</span></div>
        <div class="mt-4 space-y-2">
          <a href="dashboard" data-nav-route="dashboard" class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-slate-500"><i class="fa-solid fa-chart-line w-4"></i>Dashboard</a>
          <a href="form" data-nav-route="form" class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-slate-500"><i class="fa-solid fa-clipboard-list w-4"></i>Penilaian risiko</a>
          <a href="audit-cycles" data-nav-route="audit-cycles" class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-slate-500"><i class="fa-solid fa-calendar-days w-4"></i>Kitaran audit</a>
          <a href="audits" data-nav-route="audits" class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-slate-500"><i class="fa-solid fa-file-signature w-4"></i>Audit</a>
          <a href="findings" data-nav-route="findings" class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-slate-500"><i class="fa-solid fa-triangle-exclamation w-4"></i>Penemuan</a>
          <a href="corrective-actions" data-nav-route="corrective-actions" class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-slate-500"><i class="fa-solid fa-list-check w-4"></i>Tindakan</a>
          <a href="reports" data-nav-route="reports" class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-slate-500"><i class="fa-solid fa-print w-4"></i>Laporan</a>
          <a href="audit-logs" data-nav-route="audit-logs" class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-slate-500"><i class="fa-solid fa-shield-halved w-4"></i>Log audit</a>
          <p class="px-4 pt-4 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Data induk</p>
          <a href="institutions" data-nav-route="institutions" class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-slate-500"><i class="fa-solid fa-building-columns w-4"></i>Institusi</a>
          <a href="org-units" data-nav-route="org-units" class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-slate-500"><i class="fa-solid fa-sitemap w-4"></i>PTJ / Unit</a>
          <a href="users" data-nav-route="users" class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-slate-500"><i class="fa-solid fa-users-gear w-4"></i>Pengguna</a>
          <a href="settings" data-nav-route="settings" class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-slate-500"><i class="fa-solid fa-sliders w-4"></i>Tetapan</a>
        </div>
      </aside>
      <section class="grid content-start gap-5">
        <div class="brand-cover rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p id="pageEyebrow" class="text-xs font-extrabold uppercase tracking-widest text-blue-600"></p><h1 id="pageTitle" class="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl"></h1><p id="pageDescription" class="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-500"></p></div>
        <div class="grid gap-4 md:grid-cols-4"><div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Jumlah</p><p id="totalCount" class="mt-3 text-3xl font-extrabold text-slate-900">0</p></div><div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Aktif</p><p id="activeCount" class="mt-3 text-3xl font-extrabold text-emerald-600">0</p></div><div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Arkib</p><p id="archivedCount" class="mt-3 text-3xl font-extrabold text-amber-600">0</p></div><div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Status data</p><p id="cacheStatus" class="mt-3 text-lg font-extrabold text-blue-700">-</p></div></div>
        <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div class="grid gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]"><input id="search" type="search" placeholder="Cari rekod..." class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold outline-none"><label class="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-extrabold text-slate-600"><input id="includeArchived" type="checkbox" class="h-4 w-4">Arkib</label><button id="refreshBtn" type="button" class="rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-extrabold text-slate-600"><i class="fa-solid fa-rotate-right mr-2"></i>Refresh</button><button id="newBtn" type="button" class="rounded-full bg-blue-600 px-4 py-3 text-xs font-extrabold text-white"><i class="fa-solid fa-plus mr-2"></i>Rekod baharu</button></div><div class="sprad-table-shell"><table class="sprad-crud-table w-full divide-y divide-slate-100"><thead><tr><th>Rujukan</th><th>Butiran</th><th>Status</th><th>Petunjuk</th><th>Tindakan</th></tr></thead><tbody id="recordList" class="divide-y divide-slate-100"></tbody></table></div><div class="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><p id="paginationSummary" class="text-xs font-bold text-slate-500">0 rekod</p><div class="flex gap-2"><button id="prevPage" type="button" class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-600">Sebelum</button><button id="nextPage" type="button" class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-600">Seterusnya</button></div></div></div>
          <div id="editorCard" class="self-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-20"><p id="editorMode" class="text-xs font-extrabold uppercase tracking-widest text-blue-600"></p><h2 id="editorTitle" class="mt-2 text-xl font-extrabold text-slate-900"></h2><p id="editorHelp" class="mt-2 text-xs font-semibold leading-5 text-slate-500"></p><form id="editorForm" class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-1"></form></div>
        </div>
      </section>
    </main>`;
}
