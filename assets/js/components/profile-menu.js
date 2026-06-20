/*
 * File Path: assets/js/components/profile-menu.js
 * File Version: SPRAD v2.8-production | profile-menu.1
 * Update Info: 2026-06-21 - Tambah menu profil topbar gaya AnalisisMe dengan logout dalam dropdown.
 */
import { getRoleLabel } from "../core/data-master-utils.js";
import { getVisibleNavLinks, normalizeRole } from "../core/permissions.js";

const QUICK_ROUTES = ["dashboard", "form", "reports", "users", "settings"];
let activeController;

export function setupProfileMenu(options = {}) {
  const currentMenu = document.querySelector(".sprad-user-menu");
  const logoutButton = document.querySelector("#logout");
  const source = currentMenu || logoutButton;
  if (!source) return;

  const role = normalizeRole(options.role || "viewer");
  const username = clean(options.username) || clean(options.userId) || "pengguna";
  const displayName = clean(options.displayName) || titleFromUsername(username);
  const roleLabel = getRoleLabel(role);
  const initials = getInitials(displayName);
  const menu = document.createElement("div");
  menu.className = "sprad-user-menu";
  menu.innerHTML = `
    <button type="button" class="sprad-user-btn" aria-expanded="false" aria-haspopup="menu">
      <span class="sprad-user-avatar" aria-hidden="true">${escapeHtml(initials)}</span>
      <span class="sprad-user-copy">
        <span class="sprad-user-name">${escapeHtml(displayName)}</span>
        <span class="sprad-user-meta">${escapeHtml(roleLabel)}</span>
      </span>
      <i class="fa-solid fa-chevron-down sprad-user-chevron" aria-hidden="true"></i>
    </button>
    <div class="sprad-user-dropdown" role="menu">
      <div class="sprad-user-dropdown-header">
        <p>${escapeHtml(displayName)}</p>
        <span>${escapeHtml(username)}</span>
        <strong>${escapeHtml(roleLabel)}</strong>
      </div>
      <div class="sprad-user-dropdown-list">
        ${buildProfileLinks(role)}
      </div>
      <div class="sprad-user-dropdown-divider"></div>
      <button id="logout" type="button" class="sprad-user-dropdown-button sprad-user-dropdown-button--danger" role="menuitem">
        <i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i>
        Log keluar
      </button>
    </div>
  `;

  source.replaceWith(menu);
  revealTopbarContainer(menu);
  bindProfileEvents(menu, options.onLogout);
}

function bindProfileEvents(menu, onLogout) {
  activeController?.abort();
  activeController = new AbortController();
  const { signal } = activeController;
  const button = menu.querySelector(".sprad-user-btn");
  const dropdown = menu.querySelector(".sprad-user-dropdown");
  const logout = menu.querySelector("#logout");
  const close = () => {
    dropdown.classList.remove("open");
    button.classList.remove("open");
    button.setAttribute("aria-expanded", "false");
  };
  const toggle = () => {
    const nextOpen = !dropdown.classList.contains("open");
    dropdown.classList.toggle("open", nextOpen);
    button.classList.toggle("open", nextOpen);
    button.setAttribute("aria-expanded", String(nextOpen));
  };

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    toggle();
  }, { signal });
  dropdown.addEventListener("click", event => event.stopPropagation(), { signal });
  logout?.addEventListener("click", () => {
    close();
    if (typeof onLogout === "function") onLogout();
  }, { signal });
  document.addEventListener("click", close, { signal });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  }, { signal });
}

function revealTopbarContainer(menu) {
  const nav = menu.closest("nav");
  if (!nav?.classList.contains("hidden")) return;
  nav.classList.remove("hidden", "sm:flex");
  nav.classList.add("flex");
}

function buildProfileLinks(role) {
  const links = getVisibleNavLinks(role).filter(link => QUICK_ROUTES.includes(link.route));
  return links.map(link => `
    <a href="${escapeAttr(link.route)}" class="sprad-user-dropdown-link" role="menuitem">
      <i class="fa-solid ${escapeAttr(link.icon)}" aria-hidden="true"></i>
      ${escapeHtml(link.label)}
    </a>
  `).join("");
}

function titleFromUsername(value) {
  const text = clean(value)
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ");
  if (!text) return "Pengguna SPRAD";
  return text.split(" ").map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function getInitials(value) {
  const words = clean(value).split(/\s+/).filter(Boolean);
  const initials = words.length > 1
    ? words.slice(0, 2).map(word => word.charAt(0)).join("")
    : clean(value).slice(0, 2);
  return (initials || "SP").toUpperCase();
}

function clean(value) {
  return String(value ?? "").trim();
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
