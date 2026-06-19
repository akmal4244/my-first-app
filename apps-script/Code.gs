// =========== APP CONFIG ===========
const APP_NAME = "Sistem Penilaian Risiko Audit Dalam (SPRAD)";
const LOGO_URL = "https://www.akm.gov.my/templates/yootheme/cache/91/JATA%20NEGARA%20AI-01-91eac591.webp";
const FAVICON_URL = LOGO_URL;

const SHEET_CONTACTS = "contacts";
const SHEET_USERS = "users";
const SHEET_SESSIONS = "sessions";
const SHEET_SETTINGS = "settings";
const SHEET_INSTITUTIONS = "institutions";
const SHEET_ORG_UNITS = "org_units";
const SHEET_AUDIT_CYCLES = "audit_cycles";
const SHEET_AUDITS = "audits";
const SHEET_RISK_CATEGORIES = "risk_categories";
const SHEET_LIKELIHOOD_SCALE = "likelihood_scale";
const SHEET_IMPACT_SCALE = "impact_scale";
const SHEET_RISK_LEVELS = "risk_levels";
const SHEET_FINDINGS = "findings";
const SHEET_FINDING_UNITS = "finding_units";
const SHEET_CORRECTIVE_ACTIONS = "corrective_actions";
const SHEET_ATTACHMENTS = "attachments";
const SHEET_AUDIT_LOGS = "audit_logs";
const SHEET_MUTATION_RECEIPTS = "mutation_receipts";

const ROLE_ADMIN = "pentadbir";
const ROLE_USER = "pengguna";
const ROLE_SUPER_ADMIN = "super_admin";
const ROLE_INSTITUTION_ADMIN = "institution_admin";
const ROLE_AUDITOR = "auditor";
const ROLE_REVIEWER = "reviewer";
const ROLE_VIEWER = "viewer";
const SESSION_DAYS = 7;
const DEFAULT_INSTITUTION_ID = "inst_default";
const SETUP_CACHE_KEY = "sprad_schema_ready_v2";
const SETUP_CACHE_SECONDS = 300;
const LOGIN_ATTEMPT_LIMIT = 8;
const LOGIN_ATTEMPT_WINDOW_SECONDS = 600;

// SPRAD V2: public registration must never create administrator accounts.
const ALLOW_PUBLIC_ADMIN_REGISTER = false;

const HEADERS = {
  contacts: ["id", "name", "email", "message", "created_at"],
  users: ["id", "username", "password", "role", "created_at"],
  sessions: ["token", "user_id", "expires", "created_at"],
  settings: ["key", "value"],
  institutions: ["id", "code", "name", "short_name", "ministry", "address", "logo_url", "report_title", "status", "created_at", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by"],
  org_units: ["id", "institution_id", "code", "name", "unit_type", "parent_unit_id", "status", "created_at", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by"],
  audit_cycles: ["id", "institution_id", "title", "audit_year", "start_date", "end_date", "status", "report_reference", "finalized_at", "finalized_by", "created_at", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by"],
  audits: ["id", "institution_id", "cycle_id", "audit_code", "title", "scope", "objective", "lead_auditor_user_id", "start_date", "end_date", "status", "created_at", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by"],
  risk_categories: ["id", "institution_id", "code", "name", "description", "sort_order", "status", "created_at", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by"],
  likelihood_scale: ["institution_id", "value", "label", "guidance", "sort_order", "status"],
  impact_scale: ["institution_id", "value", "label", "guidance", "sort_order", "status"],
  risk_levels: ["id", "institution_id", "code", "label", "rank", "min_score", "max_score", "color_hex", "description", "default_due_days", "status"],
  findings: ["id", "institution_id", "cycle_id", "audit_id", "category_id", "finding_no", "title", "issue_description", "detailed_justification", "root_cause", "impact_description", "audit_evidence", "recommendation", "likelihood", "impact", "calculated_score", "calculated_level_id", "final_level_id", "override_reason", "workflow_status", "review_note", "created_at", "created_by", "updated_at", "updated_by", "submitted_at", "submitted_by", "reviewed_at", "reviewed_by", "approved_at", "approved_by", "deleted_at", "deleted_by", "row_version"],
  finding_units: ["id", "institution_id", "finding_id", "unit_id", "created_at", "created_by"],
  corrective_actions: ["id", "institution_id", "finding_id", "action_text", "owner_user_id", "owner_name", "owner_unit_id", "target_date", "status", "progress_percent", "progress_note", "completion_evidence", "submitted_for_verification_at", "verified_at", "verified_by", "verification_note", "created_at", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by", "row_version"],
  attachments: ["id", "institution_id", "entity_type", "entity_id", "drive_file_id", "file_name", "mime_type", "file_url", "uploaded_at", "uploaded_by", "deleted_at", "deleted_by"],
  audit_logs: ["id", "institution_id", "user_id", "action", "entity_type", "entity_id", "request_id", "before_json", "after_json", "created_at"],
  mutation_receipts: ["request_id", "user_id", "institution_id", "action", "entity_type", "entity_id", "status", "error_code", "error_message", "created_at", "completed_at"]
};

const V2_RISK_LEVELS = [
  ["rl_low", DEFAULT_INSTITUTION_ID, "low", "Rendah", 1, 1, 4, "#047857", "Risiko rendah dan boleh dipantau melalui kawalan rutin.", 180, "active"],
  ["rl_medium", DEFAULT_INSTITUTION_ID, "medium", "Sederhana", 2, 5, 8, "#b7791f", "Risiko sederhana yang memerlukan tindakan penambahbaikan terancang.", 90, "active"],
  ["rl_high", DEFAULT_INSTITUTION_ID, "high", "Tinggi", 3, 9, 12, "#b91c1c", "Risiko tinggi yang memerlukan tindakan segera oleh pemilik proses.", 30, "active"],
  ["rl_critical", DEFAULT_INSTITUTION_ID, "critical", "Kritikal", 4, 13, 16, "#7f1d1d", "Risiko kritikal yang memerlukan perhatian pengurusan dengan segera.", 7, "active"]
];

const V2_RISK_CATEGORIES = [
  ["rc_mandate", DEFAULT_INSTITUTION_ID, "K01", "Tiada Mandat", "Isu berkaitan ketiadaan mandat, kelulusan atau punca kuasa.", 1, "active"],
  ["rc_technical", DEFAULT_INSTITUTION_ID, "K02", "Kesilapan Isu Teknikal", "Isu teknikal, konfigurasi, dokumentasi atau proses yang tidak tepat.", 2, "active"],
  ["rc_negligence", DEFAULT_INSTITUTION_ID, "K03", "Kecuaian", "Isu berpunca daripada kecuaian, pemantauan lemah atau ketidakpatuhan.", 3, "active"],
  ["rc_waste", DEFAULT_INSTITUTION_ID, "K04", "Pembaziran", "Isu melibatkan pembaziran sumber, masa, kos atau aset.", 4, "active"],
  ["rc_leakage", DEFAULT_INSTITUTION_ID, "K05", "Penyelewengan / Ketirisan", "Isu berisiko penyelewengan, ketirisan atau kehilangan hasil.", 5, "active"]
];

const DUMMY_USERS = [
  { username: "admin", password: "admin123", role: ROLE_ADMIN },
  { username: "pengguna", password: "pengguna123", role: ROLE_USER },
  { username: "test.pentadbir@example.com", password: "test1234", role: ROLE_ADMIN },
  { username: "test.pengguna@example.com", password: "test1234", role: ROLE_USER },
  { username: "aina.admin@example.com", password: "test1234", role: ROLE_ADMIN },
  { username: "farid.user@example.com", password: "test1234", role: ROLE_USER },
  { username: "nurul.user@example.com", password: "test1234", role: ROLE_USER },
  { username: "daniel.admin@example.com", password: "test1234", role: ROLE_ADMIN },
  { username: "siti.user@example.com", password: "test1234", role: ROLE_USER },
  { username: "hakim.user@example.com", password: "test1234", role: ROLE_USER }
];

const DEFAULT_USERS = [
  DUMMY_USERS[0],
  DUMMY_USERS[1]
];

const DUMMY_CONTACTS = [
  ["Aina Rahman", "aina.rahman@example.com", "Saya ingin bertanya tentang status permohonan."],
  ["Farid Azman", "farid.azman@example.com", "Mohon pihak tuan hubungi saya semula."],
  ["Nurul Huda", "nurul.huda@example.com", "Sistem ini mudah digunakan dan paparan jelas."],
  ["Daniel Lee", "daniel.lee@example.com", "Saya mahu kemaskini maklumat perhubungan."],
  ["Siti Aminah", "siti.aminah@example.com", "Terima kasih atas maklum balas yang cepat."],
  ["Zulhilmi Omar", "zulhilmi.omar@example.com", "Boleh saya tahu waktu operasi kaunter?"],
  ["Priya Nair", "priya.nair@example.com", "Saya perlukan bantuan untuk semakan rekod."],
  ["Hakim Roslan", "hakim.roslan@example.com", "Mohon panduan untuk hantar dokumen sokongan."],
  ["Mei Ling", "mei.ling@example.com", "Adakah borang ini boleh digunakan untuk semua pertanyaan?"],
  ["Irfan Hakimi", "irfan.hakimi@example.com", "Saya sudah hantar mesej dan menunggu balasan."]
];

const DUMMY_SESSIONS = [
  { username: "admin", token: "dummy-expired-admin-token", expiredDaysAgo: 14 },
  { username: "pengguna", token: "dummy-expired-user-token", expiredDaysAgo: 13 },
  { username: "test.pentadbir@example.com", token: "dummy-expired-admin-2-token", expiredDaysAgo: 12 },
  { username: "test.pengguna@example.com", token: "dummy-expired-user-2-token", expiredDaysAgo: 11 },
  { username: "aina.admin@example.com", token: "dummy-expired-admin-3-token", expiredDaysAgo: 10 },
  { username: "farid.user@example.com", token: "dummy-expired-user-3-token", expiredDaysAgo: 9 },
  { username: "nurul.user@example.com", token: "dummy-expired-user-4-token", expiredDaysAgo: 8 },
  { username: "daniel.admin@example.com", token: "dummy-expired-admin-4-token", expiredDaysAgo: 7 },
  { username: "siti.user@example.com", token: "dummy-expired-user-5-token", expiredDaysAgo: 6 },
  { username: "hakim.user@example.com", token: "dummy-expired-user-6-token", expiredDaysAgo: 5 }
];

const DUMMY_SETTINGS = [
  ["jabatan_demo", "Unit Perkhidmatan Pelanggan"],
  ["alamat_demo", "Aras 1, Blok Pentadbiran, Putrajaya"],
  ["telefon_demo", "03-8000 8000"],
  ["emel_demo", "bantuan@example.com"],
  ["waktu_operasi_demo", "Isnin hingga Jumaat, 8:30 pagi - 5:30 petang"],
  ["tema_demo", "Light Bento"],
  ["bahasa_demo", "Bahasa Melayu"],
  ["mod_latihan_demo", "true"],
  ["nota_demo", "Data ini dijana automatik untuk tujuan testing."],
  ["versi_demo", "1.0.0"]
];

// =========== POST (fire-and-forget; response is opaque) ===========
// form.html must keep using POST + mode:"no-cors" without headers.
function doPost(e) {
  try {
    ensureSheets_();
    const body = parseBody_(e);
    if (body.action === "findings.create" || body.action === "findings.create.legacy") {
      return saveFindingMutation_(body);
    }
    if (body.action === "contacts.update") return updateContact(body);
    if (body.action === "contacts.delete") return deleteContact(body);
    return saveContact(body);
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: "server error" });
  }
}

// =========== GET (returns data the browser can read) ===========
function doGet(e) {
  try {
    ensureSheets_();
    const p = e.parameter || {};

    // PUBLIC: no token required
    if (p.action === "config") return getConfig();
    if (p.action === "config.get") return getConfig();
    if (p.action === "riskMatrix.get") return getRiskMatrix();
    if (p.action === "login") return login(p);
    if (p.action === "register") return register(p);

    // PROTECTED: token required
    const user = validateToken(p.token);
    if (!user) return json({ ok: false, error: "invalid token" });

    if (p.action === "getContacts") return getContacts(user);
    if (p.action === "mutations.status") return getMutationStatus(p.requestId || p.request_id, user);

    return json({ ok: false, error: "unknown action" });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: "server error" });
  }
}

// Run this manually once from Apps Script if you want to force setup immediately.
// Normal web requests also call ensureSheets_() automatically.
function setup() {
  clearSetupCache_();
  ensureSheets_();
  return `${APP_NAME} setup complete. Legacy sheets and SPRAD V2 foundation sheets are ready.`;
}

// =========== ACTIONS ===========
function getConfig() {
  return json({
    ok: true,
    data: {
      app_name: APP_NAME,
      schema_version: "2.0-foundation",
      logo_url: LOGO_URL,
      favicon_url: FAVICON_URL,
      legacy_roles: [ROLE_ADMIN, ROLE_USER],
      v2_roles: [ROLE_SUPER_ADMIN, ROLE_INSTITUTION_ADMIN, ROLE_AUDITOR, ROLE_REVIEWER, ROLE_VIEWER],
      allow_public_admin_register: ALLOW_PUBLIC_ADMIN_REGISTER
    },
    app_name: APP_NAME,
    logo_url: LOGO_URL,
    favicon_url: FAVICON_URL,
    roles: [ROLE_ADMIN, ROLE_USER]
  });
}

function saveContact({ name, email, message }) {
  const contact = {
    name: clean_(name),
    email: clean_(email),
    message: clean_(message)
  };

  if (!contact.name || !contact.email || !contact.message) {
    return json({ ok: false, error: "missing fields" });
  }

  appendLegacyContact_(contact);

  return json({ ok: true });
}

function saveFindingMutation_(body) {
  const requestId = clean_(body.request_id || body.requestId || Utilities.getUuid());
  const existingReceipt = findMutationReceipt_(requestId);
  if (existingReceipt) return json({ ok: existingReceipt.status === "success", receipt: existingReceipt });

  const token = clean_(body.token);
  const user = validateToken(token);
  if (!user) {
    writeMutationReceipt_({
      requestId,
      userId: "",
      institutionId: DEFAULT_INSTITUTION_ID,
      action: clean_(body.action),
      entityType: "finding",
      entityId: "",
      status: "error",
      errorCode: "INVALID_TOKEN",
      errorMessage: "invalid token"
    });
    return json({ ok: false, error: "invalid token" });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(5000);

  try {
    const repeatedReceipt = findMutationReceipt_(requestId);
    if (repeatedReceipt) return json({ ok: repeatedReceipt.status === "success", receipt: repeatedReceipt });

    const risk = calculateRisk_(body.likelihood, body.impact);
    const now = new Date();
    const findingId = Utilities.getUuid();
    const categoryId = findRiskCategoryIdByName_(body.risk_category) || clean_(body.risk_category);
    const findingNo = `SPRAD-${Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyyMMdd-HHmmss")}`;

    const finding = [
      findingId,
      DEFAULT_INSTITUTION_ID,
      clean_(body.audit_cycle),
      "",
      categoryId,
      findingNo,
      clean_(body.finding_title),
      clean_(body.message),
      clean_(body.message),
      clean_(body.root_cause),
      clean_(body.impact_description),
      clean_(body.audit_evidence),
      clean_(body.recommendation),
      risk.likelihood,
      risk.impact,
      risk.score,
      risk.levelId,
      risk.levelId,
      "",
      "draft",
      "",
      now,
      user.id,
      now,
      user.id,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      1
    ];

    SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(SHEET_FINDINGS)
      .appendRow(finding);

    if (clean_(body.org_unit)) {
      SpreadsheetApp.getActiveSpreadsheet()
        .getSheetByName(SHEET_FINDING_UNITS)
        .appendRow([Utilities.getUuid(), DEFAULT_INSTITUTION_ID, findingId, clean_(body.org_unit), now, user.id]);
    }

    appendLegacyContact_({
      name: clean_(body.name),
      email: clean_(body.email),
      message: clean_(body.message)
    });

    appendAuditLog_({
      institutionId: DEFAULT_INSTITUTION_ID,
      userId: user.id,
      action: "findings.create",
      entityType: "finding",
      entityId: findingId,
      requestId,
      beforeJson: "",
      afterJson: JSON.stringify({ finding_id: findingId, calculated_score: risk.score, calculated_level: risk.levelLabel })
    });

    writeMutationReceipt_({
      requestId,
      userId: user.id,
      institutionId: DEFAULT_INSTITUTION_ID,
      action: "findings.create",
      entityType: "finding",
      entityId: findingId,
      status: "success",
      errorCode: "",
      errorMessage: ""
    });

    return json({ ok: true, request_id: requestId, finding_id: findingId });
  } catch (err) {
    writeMutationReceipt_({
      requestId,
      userId: user ? user.id : "",
      institutionId: DEFAULT_INSTITUTION_ID,
      action: clean_(body.action),
      entityType: "finding",
      entityId: "",
      status: "error",
      errorCode: "SERVER_ERROR",
      errorMessage: err.message
    });
    throw err;
  } finally {
    lock.releaseLock();
  }
}

function register({ username, password, role }) {
  const user = {
    username: clean_(username),
    password: String(password || ""),
    role: normalizeRole_(role, ROLE_USER)
  };

  if (!ALLOW_PUBLIC_ADMIN_REGISTER && user.role === ROLE_ADMIN) {
    user.role = ROLE_USER;
  }

  if (!user.username || !user.password) {
    return json({ ok: false, error: "missing fields" });
  }

  if (user.password.length < 8) {
    return json({ ok: false, error: "Kata laluan mesti sekurang-kurangnya 8 aksara." });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(5000);

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
    const rows = sheet.getDataRange().getValues();
    const duplicate = rows
      .slice(1)
      .some(row => clean_(row[1]).toLowerCase() === user.username.toLowerCase());

    if (duplicate) {
      return json({ ok: false, error: "username exists" });
    }

    const id = Utilities.getUuid();
    sheet.appendRow([id, user.username, hashPassword_(user.password), user.role, new Date()]);

    return json({
      ok: true,
      user: { id, username: user.username, role: user.role }
    });
  } finally {
    lock.releaseLock();
  }
}

function login({ username, password }) {
  username = clean_(username);
  password = String(password || "");

  if (!username || !password) {
    return json({ ok: false, error: "missing credentials" });
  }

  if (isLoginRateLimited_(username)) {
    return json({ ok: false, error: "Terlalu banyak cubaan log masuk. Sila cuba semula dalam 10 minit." });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName(SHEET_USERS);
  const rows = usersSheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1;
    const userId = row[0];
    const storedUsername = clean_(row[1]);
    const storedPassword = String(row[2] || "");

    if (storedUsername.toLowerCase() !== username.toLowerCase()) continue;
    if (!passwordMatches_(password, storedPassword)) continue;

    const role = normalizeRole_(row[3], ROLE_ADMIN);

    // Upgrade old plain-text passwords and missing roles without breaking login.
    if (storedPassword === password) {
      usersSheet.getRange(rowNumber, 3).setValue(hashPassword_(password));
    }
    if (!row[3]) {
      usersSheet.getRange(rowNumber, 4).setValue(role);
    }

    clearLoginAttempts_(username);

    const token = Utilities.getUuid();
    const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
    ss.getSheetByName(SHEET_SESSIONS).appendRow([token, userId, expires, new Date()]);
    cleanupExpiredSessions_();

    return json({
      ok: true,
      token,
      role,
      username: storedUsername,
      app_name: APP_NAME,
      logo_url: LOGO_URL
    });
  }

  recordFailedLogin_(username);
  return json({ ok: false, error: "Nama pengguna atau kata laluan salah." });
}

function validateToken(token) {
  token = clean_(token);
  if (!token) return null;

  const rows = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEET_SESSIONS)
    .getDataRange()
    .getValues();

  const now = new Date();
  for (let i = 1; i < rows.length; i++) {
    const [storedToken, userId, expires] = rows[i];
    if (storedToken === token && new Date(expires) > now) {
      return findUserById_(userId);
    }
  }
  return null;
}

function getContacts(user) {
  if (user.role !== ROLE_ADMIN) {
    return json({ ok: false, error: "forbidden" });
  }

  fixMisalignedContactRows_();

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CONTACTS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return json({ ok: true, contacts: [] });
  }

  const rows = sheet
    .getRange(2, 1, lastRow - 1, HEADERS.contacts.length)
    .getValues();

  const contacts = rows
    .filter(row => row.some(value => value !== ""))
    .map(row => Object.fromEntries(
      HEADERS.contacts.map((header, index) => [header, formatValue_(row[index])])
    ));

  return json({ ok: true, contacts });
}

function updateContact(body) {
  const user = validateToken(body.token);
  if (!user) return json({ ok: false, error: "invalid token" });
  if (user.role !== ROLE_ADMIN) return json({ ok: false, error: "forbidden" });

  const contact = {
    id: clean_(body.id),
    name: clean_(body.name),
    email: clean_(body.email),
    message: clean_(body.message)
  };

  if (!contact.id) return json({ ok: false, error: "missing id" });
  if (!contact.name || !contact.email || !contact.message) {
    return json({ ok: false, error: "missing fields" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
    return json({ ok: false, error: "invalid email" });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(5000);

  try {
    fixMisalignedContactRows_();
    const found = findContactRowById_(contact.id);
    if (!found) return json({ ok: false, error: "contact not found" });

    const beforeJson = JSON.stringify(contactRowToObject_(found.values));
    found.sheet
      .getRange(found.rowNumber, 2, 1, 3)
      .setValues([[contact.name, contact.email, contact.message]]);

    appendAuditLog_({
      institutionId: DEFAULT_INSTITUTION_ID,
      userId: user.id,
      action: "contacts.update",
      entityType: "contact",
      entityId: contact.id,
      requestId: clean_(body.request_id || body.requestId || ""),
      beforeJson,
      afterJson: JSON.stringify(contact)
    });

    return json({
      ok: true,
      contact: {
        ...contact,
        created_at: formatValue_(found.values[4])
      }
    });
  } finally {
    lock.releaseLock();
  }
}

function deleteContact(body) {
  const user = validateToken(body.token);
  if (!user) return json({ ok: false, error: "invalid token" });
  if (user.role !== ROLE_ADMIN) return json({ ok: false, error: "forbidden" });

  const id = clean_(body.id);
  if (!id) return json({ ok: false, error: "missing id" });

  const lock = LockService.getScriptLock();
  lock.waitLock(5000);

  try {
    fixMisalignedContactRows_();
    const found = findContactRowById_(id);
    if (!found) return json({ ok: false, error: "contact not found" });

    const beforeJson = JSON.stringify(contactRowToObject_(found.values));
    found.sheet.deleteRow(found.rowNumber);

    appendAuditLog_({
      institutionId: DEFAULT_INSTITUTION_ID,
      userId: user.id,
      action: "contacts.delete",
      entityType: "contact",
      entityId: id,
      requestId: clean_(body.request_id || body.requestId || ""),
      beforeJson,
      afterJson: ""
    });

    return json({ ok: true, id });
  } finally {
    lock.releaseLock();
  }
}

function getRiskMatrix() {
  return json({
    ok: true,
    data: {
      likelihood_scale: [
        { value: 1, label: "Rendah" },
        { value: 2, label: "Sederhana" },
        { value: 3, label: "Tinggi" },
        { value: 4, label: "Sangat Tinggi" }
      ],
      impact_scale: [
        { value: 1, label: "Rendah" },
        { value: 2, label: "Sederhana" },
        { value: 3, label: "Tinggi" },
        { value: 4, label: "Sangat Tinggi" }
      ],
      risk_levels: V2_RISK_LEVELS.map(row => ({
        id: row[0],
        code: row[2],
        label: row[3],
        rank: row[4],
        min_score: row[5],
        max_score: row[6],
        color_hex: row[7],
        default_due_days: row[9]
      }))
    }
  });
}

function getMutationStatus(requestId, user) {
  requestId = clean_(requestId);
  if (!requestId) return json({ ok: false, error: "missing requestId" });

  const receipt = findMutationReceipt_(requestId);
  if (!receipt || receipt.user_id !== user.id) {
    return json({ ok: false, error: "receipt not found" });
  }

  return json({ ok: true, receipt });
}

// =========== AUTOMATIC SHEET SETUP ===========
function ensureSheets_() {
  const cache = getScriptCache_();
  if (cache && cache.get(SETUP_CACHE_KEY) === "true") return;

  ensureSheet_(SHEET_CONTACTS, HEADERS.contacts);
  ensureSheet_(SHEET_USERS, HEADERS.users);
  ensureSheet_(SHEET_SESSIONS, HEADERS.sessions);
  ensureSheet_(SHEET_SETTINGS, HEADERS.settings);
  ensureV2Sheets_();
  ensureSettings_();
  seedV2Foundation_();
  seedDummySettings_();
  seedDummyUsers_();
  seedDummySessions_();
  seedDummyContacts_();
  fixMisalignedContactRows_();

  if (cache) cache.put(SETUP_CACHE_KEY, "true", SETUP_CACHE_SECONDS);
}

function ensureV2Sheets_() {
  ensureSheet_(SHEET_INSTITUTIONS, HEADERS.institutions);
  ensureSheet_(SHEET_ORG_UNITS, HEADERS.org_units);
  ensureSheet_(SHEET_AUDIT_CYCLES, HEADERS.audit_cycles);
  ensureSheet_(SHEET_AUDITS, HEADERS.audits);
  ensureSheet_(SHEET_RISK_CATEGORIES, HEADERS.risk_categories);
  ensureSheet_(SHEET_LIKELIHOOD_SCALE, HEADERS.likelihood_scale);
  ensureSheet_(SHEET_IMPACT_SCALE, HEADERS.impact_scale);
  ensureSheet_(SHEET_RISK_LEVELS, HEADERS.risk_levels);
  ensureSheet_(SHEET_FINDINGS, HEADERS.findings);
  ensureSheet_(SHEET_FINDING_UNITS, HEADERS.finding_units);
  ensureSheet_(SHEET_CORRECTIVE_ACTIONS, HEADERS.corrective_actions);
  ensureSheet_(SHEET_ATTACHMENTS, HEADERS.attachments);
  ensureSheet_(SHEET_AUDIT_LOGS, HEADERS.audit_logs);
  ensureSheet_(SHEET_MUTATION_RECEIPTS, HEADERS.mutation_receipts);
}

function ensureSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);

  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sheet;
}

function ensureSettings_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SETTINGS);
  const settings = {
    schema_version: "2.0-foundation",
    app_name: APP_NAME,
    logo_url: LOGO_URL,
    favicon_url: FAVICON_URL,
    default_admin_username: DEFAULT_USERS[0].username,
    default_admin_password: DEFAULT_USERS[0].password,
    default_user_username: DEFAULT_USERS[1].username,
    default_user_password: DEFAULT_USERS[1].password,
    dummy_contacts_target: DUMMY_CONTACTS.length,
    dummy_users_target: DUMMY_USERS.length,
    dummy_sessions_target: DUMMY_SESSIONS.length,
    dummy_settings_target: DUMMY_SETTINGS.length,
    allow_public_registration: "true",
    allow_public_admin_register: String(ALLOW_PUBLIC_ADMIN_REGISTER),
    overall_level_method: "mode_high_tiebreak",
    session_ttl_minutes: SESSION_DAYS * 24 * 60
  };

  const rows = sheet.getDataRange().getValues();
  const existing = new Map();
  for (let i = 1; i < rows.length; i++) {
    existing.set(String(rows[i][0] || ""), i + 1);
  }

  const upsert = ([key, value]) => {
    if (existing.has(key)) {
      sheet.getRange(existing.get(key), 2).setValue(value);
    } else {
      sheet.appendRow([key, value]);
    }
  };

  Object.entries(settings).forEach(upsert);
}

function seedDummySettings_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SETTINGS);
  const rows = sheet.getDataRange().getValues();
  const existing = new Map();
  for (let i = 1; i < rows.length; i++) {
    existing.set(String(rows[i][0] || ""), i + 1);
  }

  DUMMY_SETTINGS.forEach(([key, value]) => {
    if (existing.has(key)) {
      sheet.getRange(existing.get(key), 2).setValue(value);
    } else {
      sheet.appendRow([key, value]);
    }
  });
}

function seedV2Foundation_() {
  seedDefaultInstitution_();
  seedScale_(SHEET_LIKELIHOOD_SCALE);
  seedScale_(SHEET_IMPACT_SCALE);
  seedRiskLevels_();
  seedRiskCategories_();
}

function seedDefaultInstitution_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_INSTITUTIONS);
  if (rowExists_(sheet, 1, DEFAULT_INSTITUTION_ID)) return;

  const now = new Date();
  sheet.appendRow([
    DEFAULT_INSTITUTION_ID,
    "DEFAULT",
    "Institusi Default SPRAD",
    "SPRAD",
    "",
    "",
    LOGO_URL,
    "Analisis Penilaian Risiko Audit Dalam",
    "active",
    now,
    "system",
    now,
    "system",
    "",
    ""
  ]);
}

function seedScale_(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const existing = new Set(
    sheet.getDataRange().getValues().slice(1).map(row => `${row[0]}:${row[1]}`)
  );
  const rows = [
    [DEFAULT_INSTITUTION_ID, 1, "Rendah", "Jarang berlaku atau kesan minimum.", 1, "active"],
    [DEFAULT_INSTITUTION_ID, 2, "Sederhana", "Boleh berlaku atau kesan sederhana.", 2, "active"],
    [DEFAULT_INSTITUTION_ID, 3, "Tinggi", "Kerap berlaku atau kesan besar.", 3, "active"],
    [DEFAULT_INSTITUTION_ID, 4, "Sangat Tinggi", "Sangat kerap atau kesan sangat serius.", 4, "active"]
  ].filter(row => !existing.has(`${row[0]}:${row[1]}`));

  if (rows.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.likelihood_scale.length).setValues(rows);
  }
}

function seedRiskLevels_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RISK_LEVELS);
  const existing = new Set(sheet.getDataRange().getValues().slice(1).map(row => String(row[0] || "")));
  const rows = V2_RISK_LEVELS.filter(row => !existing.has(row[0]));
  if (rows.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.risk_levels.length).setValues(rows);
  }
}

function seedRiskCategories_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RISK_CATEGORIES);
  const existing = new Set(sheet.getDataRange().getValues().slice(1).map(row => String(row[0] || "")));
  const now = new Date();
  const rows = V2_RISK_CATEGORIES
    .filter(row => !existing.has(row[0]))
    .map(row => [...row, now, "system", now, "system", "", ""]);

  if (rows.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.risk_categories.length).setValues(rows);
  }
}

function seedDummyUsers_() {
  DUMMY_USERS.forEach(user => ensureUser_(user));
}

function ensureUser_(user) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
  const rows = sheet.getDataRange().getValues();
  const exists = rows
    .slice(1)
    .some(row => clean_(row[1]).toLowerCase() === user.username.toLowerCase());

  if (!exists) {
    sheet.appendRow([
      Utilities.getUuid(),
      user.username,
      hashPassword_(user.password),
      user.role,
      new Date()
    ]);
  }
}

function seedDummySessions_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SESSIONS);
  const rows = sheet.getDataRange().getValues();
  const existingTokens = new Set(rows.slice(1).map(row => String(row[0] || "")));
  const now = Date.now();
  const rowsToAdd = [];

  DUMMY_SESSIONS.forEach((session, index) => {
    if (existingTokens.has(session.token)) return;

    const userId = findUserIdByUsername_(session.username);
    if (!userId) return;

    const expires = new Date(now - session.expiredDaysAgo * 24 * 60 * 60 * 1000);
    const createdAt = new Date(expires.getTime() - (index + 1) * 60 * 60 * 1000);
    rowsToAdd.push([session.token, userId, expires, createdAt]);
  });

  if (rowsToAdd.length) {
    sheet
      .getRange(sheet.getLastRow() + 1, 1, rowsToAdd.length, HEADERS.sessions.length)
      .setValues(rowsToAdd);
  }
}

function seedDummyContacts_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CONTACTS);
  const existingCount = Math.max(0, sheet.getLastRow() - 1);
  if (existingCount >= DUMMY_CONTACTS.length) return;

  const now = Date.now();
  const rowsToAdd = DUMMY_CONTACTS
    .slice(existingCount)
    .map((contact, index) => [
      now + index,
      contact[0],
      contact[1],
      contact[2],
      new Date(now - (index + 1) * 60 * 60 * 1000)
    ]);

  if (rowsToAdd.length) {
    sheet
      .getRange(sheet.getLastRow() + 1, 1, rowsToAdd.length, HEADERS.contacts.length)
      .setValues(rowsToAdd);
  }
}

// Fix old rows where message accidentally landed in created_at and date landed in column F.
function fixMisalignedContactRows_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CONTACTS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2 || sheet.getMaxColumns() < 6) return;

  const range = sheet.getRange(2, 1, lastRow - 1, 6);
  const rows = range.getValues();
  let changed = false;

  rows.forEach(row => {
    const message = row[3];
    const createdAt = row[4];
    const extraDate = row[5];

    if (!message && createdAt && extraDate instanceof Date) {
      row[3] = createdAt;
      row[4] = extraDate;
      row[5] = "";
      changed = true;
    }
  });

  if (changed) range.setValues(rows);
}

// =========== HELPERS ===========
function appendLegacyContact_(contact) {
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEET_CONTACTS)
    .appendRow([Date.now(), clean_(contact.name), clean_(contact.email), clean_(contact.message), new Date()]);
}

function findContactRowById_(id) {
  id = clean_(id);
  if (!id) return null;

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CONTACTS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  const rows = sheet
    .getRange(2, 1, lastRow - 1, HEADERS.contacts.length)
    .getValues();

  for (let index = 0; index < rows.length; index++) {
    if (String(rows[index][0] || "") === id) {
      return {
        sheet,
        rowNumber: index + 2,
        values: rows[index]
      };
    }
  }
  return null;
}

function contactRowToObject_(row) {
  return Object.fromEntries(
    HEADERS.contacts.map((header, index) => [header, formatValue_(row[index])])
  );
}

function getScriptCache_() {
  try {
    return CacheService.getScriptCache();
  } catch (err) {
    console.warn(`Script cache unavailable: ${err.message}`);
    return null;
  }
}

function clearSetupCache_() {
  const cache = getScriptCache_();
  if (cache) cache.remove(SETUP_CACHE_KEY);
}

function isLoginRateLimited_(username) {
  const cache = getScriptCache_();
  if (!cache) return false;
  const attempts = Number(cache.get(loginAttemptKey_(username)) || 0);
  return attempts >= LOGIN_ATTEMPT_LIMIT;
}

function recordFailedLogin_(username) {
  const cache = getScriptCache_();
  if (!cache) return;
  const key = loginAttemptKey_(username);
  const attempts = Math.min(LOGIN_ATTEMPT_LIMIT, Number(cache.get(key) || 0) + 1);
  cache.put(key, String(attempts), LOGIN_ATTEMPT_WINDOW_SECONDS);
}

function clearLoginAttempts_(username) {
  const cache = getScriptCache_();
  if (cache) cache.remove(loginAttemptKey_(username));
}

function loginAttemptKey_(username) {
  return `sprad_login_${hashPassword_(clean_(username).toLowerCase()).slice(0, 40)}`;
}

function calculateRisk_(likelihood, impact) {
  likelihood = Number(likelihood);
  impact = Number(impact);

  if (!Number.isInteger(likelihood) || likelihood < 1 || likelihood > 4) {
    throw new Error("Kemungkinan mesti antara 1 hingga 4");
  }
  if (!Number.isInteger(impact) || impact < 1 || impact > 4) {
    throw new Error("Kesan mesti antara 1 hingga 4");
  }

  const score = likelihood * impact;
  const level = V2_RISK_LEVELS.find(row => score >= row[5] && score <= row[6]);
  if (!level) throw new Error("Tahap risiko tidak ditemui");

  return {
    likelihood,
    impact,
    score,
    levelId: level[0],
    levelLabel: level[3],
    levelRank: level[4]
  };
}

function findRiskCategoryIdByName_(name) {
  name = clean_(name).toLowerCase();
  if (!name) return "";

  const rows = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEET_RISK_CATEGORIES)
    .getDataRange()
    .getValues();

  for (let i = 1; i < rows.length; i++) {
    if (clean_(rows[i][3]).toLowerCase() === name) return rows[i][0];
  }
  return "";
}

function findMutationReceipt_(requestId) {
  requestId = clean_(requestId);
  if (!requestId) return null;

  const rows = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEET_MUTATION_RECEIPTS)
    .getDataRange()
    .getValues();
  const headers = rows.shift();

  for (const row of rows) {
    if (row[0] === requestId) {
      return Object.fromEntries(headers.map((header, index) => [header, formatValue_(row[index])]));
    }
  }
  return null;
}

function writeMutationReceipt_({ requestId, userId, institutionId, action, entityType, entityId, status, errorCode, errorMessage }) {
  const now = new Date();
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEET_MUTATION_RECEIPTS)
    .appendRow([
      requestId,
      userId,
      institutionId,
      action,
      entityType,
      entityId,
      status,
      errorCode,
      errorMessage,
      now,
      now
    ]);
}

function appendAuditLog_({ institutionId, userId, action, entityType, entityId, requestId, beforeJson, afterJson }) {
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEET_AUDIT_LOGS)
    .appendRow([
      Utilities.getUuid(),
      institutionId,
      userId,
      action,
      entityType,
      entityId,
      requestId,
      beforeJson || "",
      afterJson || "",
      new Date()
    ]);
}

function rowExists_(sheet, columnIndex, value) {
  const rows = sheet.getDataRange().getValues();
  return rows.slice(1).some(row => String(row[columnIndex - 1] || "") === String(value));
}

function findUserById_(userId) {
  const rows = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEET_USERS)
    .getDataRange()
    .getValues();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row[0] === userId) {
      return {
        id: row[0],
        username: clean_(row[1]),
        role: normalizeRole_(row[3], ROLE_ADMIN)
      };
    }
  }
  return null;
}

function findUserIdByUsername_(username) {
  username = clean_(username).toLowerCase();
  const rows = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEET_USERS)
    .getDataRange()
    .getValues();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (clean_(row[1]).toLowerCase() === username) {
      return row[0];
    }
  }
  return null;
}

function cleanupExpiredSessions_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SESSIONS);
  const rows = sheet.getDataRange().getValues();
  const now = new Date();

  for (let i = rows.length - 1; i >= 1; i--) {
    const token = String(rows[i][0] || "");
    if (token.indexOf("dummy-expired-") === 0) continue;

    const expires = rows[i][2];
    if (expires && new Date(expires) <= now) {
      sheet.deleteRow(i + 1);
    }
  }
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Missing POST body");
  }
  return JSON.parse(e.postData.contents);
}

function clean_(value) {
  return String(value || "").trim();
}

function normalizeRole_(value, fallback) {
  const role = clean_(value).toLowerCase();
  if (role === ROLE_ADMIN) return ROLE_ADMIN;
  if (role === ROLE_USER) return ROLE_USER;
  return fallback || ROLE_USER;
}

function hashPassword_(password) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8
  );
  return bytes
    .map(byte => (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, "0"))
    .join("");
}

function passwordMatches_(password, storedPassword) {
  return storedPassword === password || storedPassword === hashPassword_(password);
}

function formatValue_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(
      value,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd HH:mm:ss"
    );
  }
  return value;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
