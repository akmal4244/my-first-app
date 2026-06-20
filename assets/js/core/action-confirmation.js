/*
 * File Path: assets/js/core/action-confirmation.js
 * File Version: SPRAD v2.8-production | malay-localization.1
 * Update Info: 2026-06-20 - Seragamkan mesej tindakan kepada Bahasa Melayu.
 */
const CANCELLED_RESULT = Object.freeze({
  cancelled: true,
  reason: "user_cancelled"
});

const READ_ACTION_SUFFIXES = new Set(["list", "get", "summary", "dataset", "status", "health", "me"]);

const ACTION_COPY = {
  create: ["Sahkan tambah", "tambah", "Ya, tambah", "primary"],
  update: ["Sahkan simpan", "simpan perubahan untuk", "Ya, simpan", "primary"],
  delete: ["Sahkan arkib", "arkibkan", "Ya, arkib", "danger"],
  restore: ["Sahkan pulih", "pulihkan", "Ya, pulihkan", "primary"],
  deactivate: ["Sahkan nyahaktif", "nyahaktif", "Ya, nyahaktif", "danger"],
  finalize: ["Sahkan muktamad", "muktamadkan", "Ya, muktamadkan", "warning"],
  submit: ["Sahkan hantar", "hantar", "Ya, hantar", "primary"],
  return: ["Sahkan pulangan", "pulangkan", "Ya, pulangkan", "warning"],
  approve: ["Sahkan kelulusan", "luluskan", "Ya, luluskan", "primary"],
  overrideLevel: ["Sahkan override", "override tahap risiko untuk", "Ya, override", "warning"],
  submitForVerification: ["Sahkan pengesahan", "hantar untuk pengesahan", "Ya, hantar", "primary"],
  verify: ["Sahkan verifikasi", "sahkan", "Ya, sahkan", "primary"],
  promote: ["Sahkan draft AI", "sahkan draft AI ke", "Ya, sahkan", "primary"],
  logout: ["Sahkan log keluar", "log keluar daripada", "Ya, log keluar", "danger"],
  bulkCreate: ["Sahkan hantar", "hantar", "Ya, hantar", "primary"]
};

const ACTION_OVERRIDES = {
  "aiIntake.create": ["Sahkan analisis AI", "mula analisis AI untuk", "Ya, analisis", "primary"],
  register: ["Sahkan daftar akaun", "cipta", "Ya, daftar", "primary"]
};

const SUBJECT_LABELS = {
  institutions: "rekod institusi",
  orgUnits: "rekod PTJ / unit",
  users: "rekod pengguna",
  riskCategories: "rekod kategori risiko",
  riskLevels: "rekod tahap risiko",
  auditCycles: "rekod kitaran audit",
  audits: "rekod audit",
  findings: "rekod penemuan audit",
  correctiveActions: "rekod tindakan pembetulan",
  aiIntake: "analisis dokumen",
  aiDrafts: "penemuan audit",
  auth: "SPRAD"
};

export function actionRequiresConfirmation(action) {
  if (ACTION_OVERRIDES[action]) return true;
  const parts = splitAction(action);
  if (parts.length < 2) return false;
  const operation = parts[1];
  if (READ_ACTION_SUFFIXES.has(operation)) return false;
  return Boolean(ACTION_COPY[operation]);
}

export function confirmationCopyForAction(action, options = {}) {
  const parts = splitAction(action);
  const resource = parts[0] || "";
  const operation = parts[1] || "";
  const [title, verb, confirmLabel, tone] = ACTION_OVERRIDES[action] || ACTION_COPY[operation] || ["Sahkan tindakan", "teruskan tindakan untuk", "Ya, teruskan", "primary"];
  const subject = options.subject || SUBJECT_LABELS[resource] || "rekod ini";
  return {
    title,
    message: options.message || `Tindakan ini akan ${verb} ${subject}. Teruskan?`,
    confirmLabel,
    cancelLabel: "Batal",
    tone
  };
}

export async function runConfirmedAction(action, handler, options = {}) {
  if (typeof handler !== "function") throw new Error("Pengendali tindakan tidak sah.");
  if (options.skipConfirmation || !actionRequiresConfirmation(action)) {
    return handler();
  }

  const copy = options.copy || confirmationCopyForAction(action, options);
  const confirm = options.confirm || confirmAction;
  const confirmed = await confirm(copy);
  if (!confirmed) return { ...CANCELLED_RESULT };
  return handler();
}

export function isActionCancelled(result) {
  return Boolean(result?.cancelled && result.reason === CANCELLED_RESULT.reason);
}

export function confirmAction(copy = {}) {
  const safeCopy = {
    title: copy.title || "Sahkan tindakan",
    message: copy.message || "Teruskan tindakan ini?",
    confirmLabel: copy.confirmLabel || "Ya, teruskan",
    cancelLabel: copy.cancelLabel || "Batal",
    tone: copy.tone || "primary"
  };

  if (typeof document === "undefined" || !document.body) {
    if (typeof globalThis.confirm === "function") {
      return Promise.resolve(globalThis.confirm(`${safeCopy.title}\n\n${safeCopy.message}`));
    }
    return Promise.resolve(true);
  }

  return new Promise(resolve => {
    document.querySelector("#spradConfirmModal")?.remove();

    const overlay = document.createElement("div");
    overlay.id = "spradConfirmModal";
    overlay.className = "fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm";
    overlay.innerHTML = `
      <section role="dialog" aria-modal="true" aria-labelledby="spradConfirmTitle" class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/20">
        <div class="flex items-start gap-4">
          <div class="${iconClass(safeCopy.tone)}">
            <i class="${iconName(safeCopy.tone)}"></i>
          </div>
          <div class="min-w-0 flex-1">
            <h2 id="spradConfirmTitle" class="text-lg font-extrabold tracking-tight text-slate-900">${escapeHtml(safeCopy.title)}</h2>
            <p class="mt-2 text-sm font-semibold leading-6 text-slate-500">${escapeHtml(safeCopy.message)}</p>
          </div>
        </div>
        <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" data-confirm-cancel class="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-600 transition hover:bg-slate-100">${escapeHtml(safeCopy.cancelLabel)}</button>
          <button type="button" data-confirm-ok class="${buttonClass(safeCopy.tone)}">${escapeHtml(safeCopy.confirmLabel)}</button>
        </div>
      </section>
    `;

    const cleanup = value => {
      document.removeEventListener("keydown", onKeydown);
      overlay.remove();
      resolve(value);
    };
    const onKeydown = event => {
      if (event.key === "Escape") cleanup(false);
    };

    overlay.querySelector("[data-confirm-cancel]")?.addEventListener("click", () => cleanup(false));
    overlay.querySelector("[data-confirm-ok]")?.addEventListener("click", () => cleanup(true));
    overlay.addEventListener("click", event => {
      if (event.target === overlay) cleanup(false);
    });
    document.addEventListener("keydown", onKeydown);
    document.body.append(overlay);
    overlay.querySelector("[data-confirm-ok]")?.focus();
  });
}

function splitAction(action) {
  return String(action || "").split(".").filter(Boolean);
}

function iconClass(tone) {
  const styles = {
    danger: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600",
    warning: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600",
    primary: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
  };
  return styles[tone] || styles.primary;
}

function iconName(tone) {
  if (tone === "danger") return "fa-solid fa-triangle-exclamation";
  if (tone === "warning") return "fa-solid fa-circle-exclamation";
  return "fa-solid fa-circle-question";
}

function buttonClass(tone) {
  const base = "rounded-full px-5 py-3 text-sm font-extrabold text-white transition";
  if (tone === "danger") return `${base} bg-red-600 hover:bg-red-700`;
  if (tone === "warning") return `${base} bg-amber-500 hover:bg-amber-600`;
  return `${base} bg-blue-600 hover:bg-blue-700`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
