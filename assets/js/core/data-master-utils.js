/*
 * File Path: assets/js/core/data-master-utils.js
 * File Version: SPRAD v2.8-production | malay-localization.1
 * Update Info: 2026-06-20 - Seragamkan teks UI kepada Bahasa Melayu.
 */
import { buildMutationRequest } from "./mutation-utils.js";
import { normalizeSearchText } from "./formatters.js";

const ACTIVE_STATUSES = new Set(["active", "inactive", "archived"]);
const USER_ROLES = new Set(["super_admin", "institution_admin", "auditor", "reviewer", "viewer"]);

export function normalizeListResponse(response, key) {
  const data = response?.data || response || {};
  const candidates = [
    data[key],
    data.records,
    response?.[key],
    response?.records
  ];
  const records = candidates.find(Array.isArray);
  return records ? records : [];
}

export function filterRecords(records, query, fields) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return records;
  return records.filter(record =>
    fields.some(field => normalizeSearchText(record?.[field]).includes(normalizedQuery))
  );
}

export function paginateRecords(records, page = 1, pageSize = 5) {
  const total = records.length;
  const safePageSize = Math.max(1, Number(pageSize) || 5);
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const currentPage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const startIndex = (currentPage - 1) * safePageSize;
  const items = records.slice(startIndex, startIndex + safePageSize);
  return {
    items,
    currentPage,
    pageSize: safePageSize,
    total,
    totalPages,
    start: total ? startIndex + 1 : 0,
    end: total ? startIndex + items.length : 0
  };
}

export function buildDataMasterMutation(action, token, payload = {}, idFactory) {
  return buildMutationRequest(action, token, payload, idFactory);
}

export function getRecordStatusLabel(status) {
  const labels = {
    active: "Aktif",
    inactive: "Tidak aktif",
    archived: "Arkib",
    draft: "Draf",
    finalized: "Dimuktamadkan"
  };
  return labels[String(status || "").toLowerCase()] || "Tidak diketahui";
}

export function getRoleLabel(role) {
  const labels = {
    super_admin: "Pentadbir Utama",
    institution_admin: "Pentadbir Institusi",
    auditor: "Juruaudit",
    reviewer: "Penyemak",
    viewer: "Pembaca",
    pentadbir: "Pentadbir",
    pengguna: "Pengguna"
  };
  return labels[String(role || "").toLowerCase()] || "Pembaca";
}

export function validateInstitutionDraft(input = {}) {
  const code = cleanCode(input.code);
  const name = clean(input.name);
  if (!code) return invalid("Kod institusi wajib diisi.");
  if (!name) return invalid("Nama institusi wajib diisi.");
  return valid({
    id: clean(input.id),
    code,
    name,
    short_name: clean(input.short_name) || code,
    ministry: clean(input.ministry),
    address: clean(input.address),
    logo_url: clean(input.logo_url),
    report_title: clean(input.report_title) || name,
    status: normalizeStatus(input.status)
  });
}

export function validateOrgUnitDraft(input = {}) {
  const code = cleanCode(input.code);
  const name = clean(input.name);
  if (!code) return invalid("Kod PTJ / unit wajib diisi.");
  if (!name) return invalid("Nama PTJ / unit wajib diisi.");
  return valid({
    id: clean(input.id),
    institution_id: clean(input.institution_id),
    code,
    name,
    unit_type: clean(input.unit_type) || "Unit",
    parent_unit_id: clean(input.parent_unit_id),
    status: normalizeStatus(input.status)
  });
}

export function validateUserDraft(input = {}) {
  const username = clean(input.username);
  const role = normalizeRole(input.role);
  const password = clean(input.password);
  if (!username) return invalid("Nama pengguna wajib diisi.");
  if (!role) return invalid("Peranan tidak sah.");
  if (!input.id && password.length < 8) return invalid("Kata laluan baharu mesti sekurang-kurangnya 8 aksara.");
  if (input.id && password && password.length < 8) return invalid("Kata laluan baharu mesti sekurang-kurangnya 8 aksara.");

  const data = {
    id: clean(input.id),
    institution_id: clean(input.institution_id),
    username,
    display_name: clean(input.display_name),
    email: clean(input.email),
    role,
    status: normalizeStatus(input.status)
  };
  if (password) data.password = password;
  return valid(data);
}

export function validateRiskCategoryDraft(input = {}) {
  const code = cleanCode(input.code);
  const name = clean(input.name);
  if (!code) return invalid("Kod kategori wajib diisi.");
  if (!name) return invalid("Nama kategori wajib diisi.");
  return valid({
    id: clean(input.id),
    institution_id: clean(input.institution_id),
    code,
    name,
    description: clean(input.description),
    sort_order: normalizeInteger(input.sort_order, 1),
    status: normalizeStatus(input.status)
  });
}

export function validateRiskLevelDraft(input = {}) {
  const id = clean(input.id);
  const label = clean(input.label);
  const rank = normalizeInteger(input.rank, 1);
  const minScore = normalizeInteger(input.min_score, 1);
  const maxScore = normalizeInteger(input.max_score, 16);
  const color = clean(input.color_hex) || "#1e40af";
  if (!id) return invalid("ID tahap risiko wajib diisi.");
  if (!label) return invalid("Label tahap risiko wajib diisi.");
  if (minScore < 1 || maxScore > 16 || minScore > maxScore) {
    return invalid("Julat skor risiko mesti antara 1 hingga 16 dan min tidak boleh melebihi maks.");
  }
  if (!/^#[0-9a-f]{6}$/i.test(color)) return invalid("Warna mesti dalam format hex seperti #1e40af.");
  return valid({
    id,
    label,
    rank,
    min_score: minScore,
    max_score: maxScore,
    color_hex: color,
    description: clean(input.description),
    default_due_days: normalizeInteger(input.default_due_days, 30),
    status: normalizeStatus(input.status)
  });
}

function valid(data) {
  return { ok: true, data };
}

function invalid(error) {
  return { ok: false, error };
}

function clean(value) {
  return String(value ?? "").trim();
}

function cleanCode(value) {
  return clean(value).toUpperCase();
}

function normalizeStatus(status) {
  const normalized = clean(status).toLowerCase() || "active";
  return ACTIVE_STATUSES.has(normalized) ? normalized : "active";
}

function normalizeRole(role) {
  const normalized = clean(role).toLowerCase();
  return USER_ROLES.has(normalized) ? normalized : "";
}

function normalizeInteger(value, fallback) {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) ? number : fallback;
}
