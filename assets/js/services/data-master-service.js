import { getApiUrl } from "../config.js";
import { getJson } from "../core/api.js";
import { runConfirmedAction } from "../core/action-confirmation.js";
import { buildDataMasterMutation, normalizeListResponse } from "../core/data-master-utils.js";
import { postOpaqueMutation } from "../core/mutation.js";
import { pollMutationReceipt } from "../core/mutation-utils.js";

export async function listDataMaster(resource, token, options = {}) {
  const actionMap = {
    institutions: "institutions.list",
    orgUnits: "orgUnits.list",
    users: "users.list",
    riskCategories: "riskCategories.list",
    riskLevels: "riskLevels.list"
  };
  const keyMap = {
    institutions: "institutions",
    orgUnits: "org_units",
    users: "users",
    riskCategories: "risk_categories",
    riskLevels: "records"
  };
  const action = actionMap[resource];
  if (!action) throw new Error("Sumber data induk tidak sah.");
  const response = await getJson({
    action,
    token,
    include_archived: options.includeArchived ? "1" : ""
  });
  return normalizeListResponse(response, keyMap[resource]);
}

export async function getRiskMatrix(token) {
  const params = token ? { action: "riskMatrix.get", token } : { action: "riskMatrix.get" };
  const response = await getJson(params);
  return response.data || {};
}

export async function submitDataMasterMutation({ action, token, payload, url = getApiUrl(), confirmation = {} }) {
  return runConfirmedAction(action, async () => {
    const request = buildDataMasterMutation(action, token, payload);
    await postOpaqueMutation(url, request);
    const receipt = await pollMutationReceipt({
      url,
      token,
      requestId: request.request_id
    });
    if (receipt.status !== "success") throw new Error(receipt.error || "Simpanan belum dapat disahkan.");
    return receipt;
  }, confirmation);
}
