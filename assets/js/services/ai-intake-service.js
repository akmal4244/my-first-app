/*
 * File Path: assets/js/services/ai-intake-service.js
 * File Version: SPRAD v2.8-production | metadata-header.1
 * Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
 */
import { getJson } from "../core/api.js";
import { runConfirmedAction } from "../core/action-confirmation.js";
import { postOpaqueMutation } from "../core/mutation.js";
import { pollMutationReceipt } from "../core/mutation-utils.js";
import { getApiUrl } from "../config.js";

export async function listAiJobs(token) {
  const response = await getJson({ action: "aiJobs.list", token });
  return response.data?.jobs || [];
}

export async function listAiDrafts(token, options = {}) {
  const response = await getJson({
    action: "aiDrafts.list",
    token,
    job_id: options.jobId || "",
    status: options.status || ""
  });
  return response.data?.drafts || [];
}

export async function submitAiMutation(request, { url = getApiUrl(), attempts = 18, delayMs = 1500, confirmation = {} } = {}) {
  return runConfirmedAction(request.action, async () => {
    await postOpaqueMutation(url, request);
    const receipt = await pollMutationReceipt({
      url,
      token: request.token,
      requestId: request.request_id,
      attempts,
      delayMs
    });
    if (receipt.status !== "success") throw new Error(receipt.error || "Simpanan AI belum dapat disahkan.");
    return receipt;
  }, confirmation);
}
