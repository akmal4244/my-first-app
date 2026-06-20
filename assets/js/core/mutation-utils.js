/*
 * File Path: assets/js/core/mutation-utils.js
 * File Version: SPRAD v2.8-production | malay-localization.1
 * Update Info: 2026-06-20 - Seragamkan teks UI kepada Bahasa Melayu.
 */
const DEFAULT_ATTEMPTS = 10;
const DEFAULT_DELAY_MS = 1200;

export function createRequestId(prefix = "sprad") {
  const safePrefix = String(prefix || "sprad").trim() || "sprad";
  if (globalThis.crypto?.randomUUID) {
    return `${safePrefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${safePrefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function buildMutationRequest(action, token, payload = {}, idFactory = createRequestId) {
  const requestId = idFactory();
  return {
    action,
    request_id: requestId,
    requestId,
    token,
    payload
  };
}

export async function pollMutationReceipt({
  url,
  token,
  requestId,
  attempts = DEFAULT_ATTEMPTS,
  delayMs = DEFAULT_DELAY_MS,
  fetchImpl = globalThis.fetch,
  sleep = wait
}) {
  if (!url) throw new Error("URL API tidak ditemui.");
  if (!token) throw new Error("Token tidak ditemui.");
  if (!requestId) throw new Error("ID permintaan tidak ditemui.");
  if (typeof fetchImpl !== "function") throw new Error("Fungsi ambil data tidak tersedia.");

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const params = new URLSearchParams({
      action: "mutations.status",
      requestId,
      token
    });
    const response = await fetchImpl(`${url}?${params.toString()}`);
    const data = await response.json();
    const receipt = data.receipt || data.data?.receipt;

    if (data.ok && receipt) {
      if (receipt.status === "success") return receipt;
      if (receipt.status === "error") {
        throw new Error(receipt.error_message || receipt.errorMessage || "Perubahan gagal.");
      }
    }

    if (!data.ok && data.error && isUnsupportedMutationEndpoint(data.error)) {
      return {
        status: "unsupported",
        error: "Pelayan belakang belum dikemaskini untuk pengesahan automatik. Sila kemaskini Apps Script dan deploy semula Aplikasi Web."
      };
    }

    if (!data.ok && data.error && !isPendingReceiptError(data.error)) {
      throw new Error(readErrorMessage(data.error));
    }

    if (attempt < attempts - 1) await sleep(delayMs);
  }

  return {
    status: "timeout",
    error: "Status simpanan belum dapat disahkan."
  };
}

function wait(delayMs) {
  return new Promise(resolve => setTimeout(resolve, delayMs));
}

function isPendingReceiptError(error) {
  const message = readErrorMessage(error).toLowerCase();
  return message.includes("receipt not found")
    || message.includes("resit simpanan belum ditemui");
}

function isUnsupportedMutationEndpoint(error) {
  const message = readErrorMessage(error).toLowerCase();
  return message.includes("unknown action")
    || message.includes("unknown endpoint")
    || message.includes("tindakan tidak diketahui")
    || message.includes("endpoint tidak diketahui");
}

function readErrorMessage(error) {
  if (typeof error === "string") return error;
  return error?.message || error?.code || "Perubahan gagal.";
}
