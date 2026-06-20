/*
 * File Path: assets/js/core/ai-intake-utils.js
 * File Version: SPRAD v2.8-production | metadata-header.1
 * Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
 */
import { buildMutationRequest, createRequestId } from "./mutation-utils.js";
import { calculateRisk } from "./risk-engine.js";

export const AI_UPLOAD_MAX_BYTES = 8 * 1024 * 1024;

export const AI_ACCEPTED_MIME_TYPES = Object.freeze([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "image/png",
  "image/jpeg",
  "image/webp"
]);

export function validateAiUploadDraft(input = {}) {
  const fileName = clean(input.fileName || input.file_name);
  const mimeType = clean(input.mimeType || input.mime_type);
  const size = Number(input.size || input.file_size || 0);

  if (!fileName) return invalid("Nama fail diperlukan.");
  if (!AI_ACCEPTED_MIME_TYPES.includes(mimeType)) {
    return invalid("Format fail belum disokong. Gunakan PDF, teks, PNG, JPG atau WEBP.");
  }
  if (!Number.isFinite(size) || size <= 0) return invalid("Saiz fail tidak sah.");
  if (size > AI_UPLOAD_MAX_BYTES) return invalid("Fail melebihi had 8MB untuk Apps Script Web App.");

  return {
    ok: true,
    data: {
      file_name: fileName,
      mime_type: mimeType,
      file_size: size
    }
  };
}

export function buildAiIntakeMutation({
  token,
  file,
  sourceTitle = "",
  requestIdFactory = createRequestId
} = {}) {
  const validation = validateAiUploadDraft(file || {});
  if (!validation.ok) throw new Error(validation.error);
  const base64 = clean(file.base64 || file.file_base64);
  if (!base64) throw new Error("Kandungan fail belum dibaca.");

  const payload = {
    ...validation.data,
    file_base64: base64,
    source_title: clean(sourceTitle) || validation.data.file_name
  };

  return buildMutationRequest("aiIntake.create", token, payload, () => requestIdFactory("ai-intake"));
}

export function summarizeAiReview(draft = {}) {
  const flags = [];
  const requiredFields = [
    ["title", "missing_title"],
    ["issue_description", "missing_issue_description"],
    ["root_cause", "missing_root_cause"],
    ["impact_description", "missing_impact_description"],
    ["recommendation", "missing_recommendation"]
  ];

  requiredFields.forEach(([field, flag]) => {
    if (!clean(draft[field])) flags.push(flag);
  });

  const confidence = Number(draft.confidence ?? 0);
  if (confidence < 0.7) flags.push("low_confidence");

  let risk;
  try {
    risk = calculateRisk(draft.likelihood || 1, draft.impact || 1);
    if (risk.rank >= 3) flags.push("high_risk");
  } catch {
    flags.push("invalid_risk_score");
  }

  return {
    status: flags.some(flag => flag.startsWith("missing_") || flag === "low_confidence" || flag === "invalid_risk_score")
      ? "perlu_semakan"
      : "lengkap",
    score: Math.max(0, Math.min(100, Math.round(confidence * 100)
      - flags.filter(flag => flag.startsWith("missing_")).length * 2
      - (flags.includes("low_confidence") ? 1 : 0))),
    flags,
    risk
  };
}

export function normalizeAiJob(record = {}) {
  return {
    id: clean(record.id),
    fileName: clean(record.file_name),
    sourceTitle: clean(record.source_title),
    status: clean(record.status || "processing"),
    draftCount: Number(record.draft_count || 0),
    reviewScore: Number(record.review_score || 0),
    reviewSummary: clean(record.review_summary),
    errorMessage: clean(record.error_message),
    createdAt: clean(record.created_at),
    createdBy: clean(record.created_by)
  };
}

export function normalizeAiDraft(record = {}) {
  return {
    id: clean(record.id),
    jobId: clean(record.job_id),
    title: clean(record.title),
    issueDescription: clean(record.issue_description),
    rootCause: clean(record.root_cause),
    impactDescription: clean(record.impact_description),
    recommendation: clean(record.recommendation),
    likelihood: Number(record.likelihood || 1),
    impact: Number(record.impact || 1),
    score: Number(record.calculated_score || 0),
    confidence: Number(record.confidence || 0),
    reviewStatus: clean(record.auto_review_status || "perlu_semakan"),
    reviewFlags: parseFlags(record.auto_review_flags),
    status: clean(record.status || "draft"),
    promotedFindingId: clean(record.promoted_finding_id)
  };
}

export function flagLabel(flag) {
  const labels = {
    missing_title: "Tajuk tiada",
    missing_issue_description: "Huraian tiada",
    missing_root_cause: "Punca tiada",
    missing_impact_description: "Impak tiada",
    missing_recommendation: "Syor tiada",
    low_confidence: "Keyakinan AI rendah",
    high_risk: "Risiko tinggi/kritikal",
    invalid_risk_score: "Skor risiko tidak sah",
    possible_duplicate: "Mungkin duplikasi"
  };
  return labels[flag] || flag;
}

function parseFlags(value) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed.map(clean).filter(Boolean) : [];
  } catch {
    return clean(value) ? clean(value).split(",").map(clean).filter(Boolean) : [];
  }
}

function invalid(error) {
  return { ok: false, error };
}

function clean(value) {
  return String(value ?? "").trim();
}
