/*
 * File Path: assets/js/components/app-shell.js
 * File Version: SPRAD v2.8-production | profile-menu.1
 * Update Info: 2026-06-21 - Tukar butang log keluar kepada menu profil topbar gaya AnalisisMe.
 */
import { STORAGE_KEYS } from "../config.js";
import { revokeSession } from "../core/api.js";
import { confirmAction, confirmationCopyForAction } from "../core/action-confirmation.js";
import { getRoleLabel, getRecordStatusLabel } from "../core/data-master-utils.js";
import { getVisibleNavLinks, hasPermission, normalizeRole } from "../core/permissions.js";
import { initSpaNavigation } from "../core/spa-navigation.js";
import { setupProfileMenu } from "./profile-menu.js";

let toastTimer;

export function normalizeCleanUrl(route) {
  const storedPath = sessionStorage.getItem("spradCleanPath");
  sessionStorage.removeItem("spradCleanPath");
  const cleanPath = route === "home"
    ? window.location.pathname.replace(/\/index\.html$/, "/")
    : window.location.pathname.replace(/\/[^/]*\.html$/, `/${route}`);
  const targetPath = storedPath || cleanPath + window.location.search + window.location.hash;
  if (targetPath && `${window.location.pathname}${window.location.search}${window.location.hash}` !== targetPath) {
    history.replaceState(null, "", targetPath);
  }
}

export function showToast(title, text, type = "info") {
  const toast = document.querySelector("#toast");
  const toastTitle = document.querySelector("#toastTitle");
  const toastText = document.querySelector("#toastText");
  const toastIcon = document.querySelector("#toastIcon");
  if (!toast || !toastTitle || !toastText || !toastIcon) return;

  const styles = {
    success: ["bg-emerald-50 text-emerald-600", "fa-solid fa-circle-check"],
    error: ["bg-red-50 text-red-600", "fa-solid fa-circle-exclamation"],
    info: ["bg-blue-50 text-blue-600", "fa-solid fa-circle-info"],
    warning: ["bg-amber-50 text-amber-600", "fa-solid fa-triangle-exclamation"]
  };
  const [iconClass, iconName] = styles[type] || styles.info;
  toastTitle.textContent = title;
  toastText.textContent = text;
  toastIcon.className = "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg " + iconClass;
  toastIcon.innerHTML = `<i class="${iconName}"></i>`;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 4200);
}

export function getSessionContext() {
  return {
    token: localStorage.getItem(STORAGE_KEYS.token) || "",
    legacyRole: (localStorage.getItem(STORAGE_KEYS.role) || "").toLowerCase(),
    v2Role: (localStorage.getItem(STORAGE_KEYS.v2Role) || "").toLowerCase(),
    userId: localStorage.getItem(STORAGE_KEYS.userId) || "",
    institutionId: localStorage.getItem(STORAGE_KEYS.institutionId) || "",
    username: localStorage.getItem(STORAGE_KEYS.username) || ""
  };
}

export function requireAdminSession() {
  return requireSession({
    permissions: ["institutions.manage", "masters.manage", "users.manage"],
    fallback: "form"
  });
}

export function requireSession(options = {}) {
  sessionStorage.removeItem("spradCleanPath");
  const session = getSessionContext();
  if (!session.token) {
    window.location.href = "login";
    return null;
  }

  const permissions = options.permissions || [];
  if (permissions.length) {
    const role = normalizeRole(session.v2Role || session.legacyRole);
    const allowed = permissions.some(permission => hasPermission(role, permission));
    if (!allowed) {
      window.location.href = options.fallback || "form";
      return null;
    }
  }
  return session;
}

export function clearCredentialsIfNotRemembered() {
  localStorage.removeItem("spradPassword");
  if (localStorage.getItem(STORAGE_KEYS.rememberMe) === "true") return;
  localStorage.removeItem(STORAGE_KEYS.username);
}

export async function logoutToLogin() {
  const confirmed = await confirmAction(confirmationCopyForAction("auth.logout"));
  if (!confirmed) return;
  const token = getSessionContext().token;
  clearCredentialsIfNotRemembered();
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.role);
  localStorage.removeItem(STORAGE_KEYS.v2Role);
  localStorage.removeItem(STORAGE_KEYS.userId);
  localStorage.removeItem(STORAGE_KEYS.institutionId);
  revokeSession(token).finally(() => {
    window.location.href = "login";
  });
}

export function setupLogoutButton() {
  const session = getSessionContext();
  setupProfileMenu({
    onLogout: logoutToLogin,
    role: session.v2Role || session.legacyRole || "viewer",
    username: session.username,
    userId: session.userId
  });
}

export function setupSidebar(currentRoute, session = getSessionContext()) {
  initSpaNavigation();
  removeSidebarHeader();
  const navContainer = document.querySelector("aside .mt-4.space-y-2");
  if (navContainer) {
    const role = normalizeRole(session.v2Role || session.legacyRole);
    navContainer.innerHTML = standardSidebarNav(role);
  }

  const sidebarRole = document.querySelector("#sidebarRole");
  if (sidebarRole) {
    const role = session.v2Role || session.legacyRole || "viewer";
    sidebarRole.textContent = getRoleLabel(role);
  }

  document.querySelectorAll("[data-nav-route]").forEach((link) => {
    const route = link.dataset.navRoute;
    const active = route === currentRoute;
    link.className = active ? "menu-item menu-active" : "menu-item";
  });
}

function removeSidebarHeader() {
  document.querySelector("#sidebarRole")
    ?.closest(".flex.items-center.justify-between.gap-3")
    ?.remove();
}

function standardSidebarNav(role) {
  const links = getVisibleNavLinks(role);
  const adminRoutes = new Set(["users", "settings"]);
  const primaryLinks = links.filter(link => !adminRoutes.has(link.route));
  const adminLinks = links.filter(link => adminRoutes.has(link.route));
  return [
    navSection("Menu utama", primaryLinks),
    navSection("Pentadbir", adminLinks)
  ].filter(Boolean).join("");
}

function navSection(title, links) {
  if (!links.length) return "";
  return `<div class="menu-section">${title}</div>${links.map(navLink).join("")}`;
}

function navLink({ route, icon, label }) {
  return `<a href="${route}" data-nav-route="${route}" class="menu-item"><i class="fa-solid ${icon} w-4"></i>${label}</a>`;
}

export function statusBadge(status) {
  const normalized = String(status || "active").toLowerCase();
  const styles = {
    active: "bg-emerald-50 text-emerald-700",
    inactive: "bg-amber-50 text-amber-700",
    archived: "bg-slate-100 text-slate-600"
  };
  const className = styles[normalized] || styles.archived;
  return `<span class="inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide ${className}">${getRecordStatusLabel(normalized)}</span>`;
}
