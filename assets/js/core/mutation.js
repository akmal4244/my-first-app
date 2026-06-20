/*
 * File Path: assets/js/core/mutation.js
 * File Version: SPRAD v2.8-production | metadata-header.1
 * Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
 */
export {
  buildMutationRequest,
  createRequestId,
  pollMutationReceipt
} from "./mutation-utils.js";

export async function postOpaqueMutation(url, request) {
  await fetch(url, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify(request)
  });
}
