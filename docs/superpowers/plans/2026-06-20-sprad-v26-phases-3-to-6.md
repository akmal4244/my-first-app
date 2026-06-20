<!--
File Path: docs/superpowers/plans/2026-06-20-sprad-v26-phases-3-to-6.md
File Version: SPRAD v2.8-production | metadata-header.1
Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
-->

# SPRAD V2.6 Phases 3 To 6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete SPRAD phase 3 to phase 6 for audit cycles, audits, findings, corrective actions, dashboard, reports, and hardening while preserving GitHub Pages, Apps Script, and Google Sheets.

**Architecture:** Keep the app as vanilla HTML/CSS/JavaScript hosted on GitHub Pages. Add focused frontend utilities/services/pages that call the existing Apps Script API contract. Patch `apps-script/Code.gs` so `setup()` remains autopilot for sheets, dummy data, routes, workflow validation, audit logs, and backup helpers.

**Tech Stack:** Plain HTML, Tailwind CDN, vanilla JavaScript ES modules, Node test runner, Google Apps Script, Google Sheets.

## Global Constraints

- Live hosting stays GitHub Pages.
- Database stays Google Sheets.
- Backend API stays Google Apps Script Web App.
- UI language is Bahasa Melayu.
- No horizontal table scrolling for normal data review; use responsive compact rows/cards.
- Every Code.gs change must be documented for copy/paste into Apps Script, then run `setup()` and redeploy.
- Version target is `2.6-full-blueprint`.

---

### Task 1: Workflow Utility Tests And Frontend Contracts

**Files:**
- Create: `tests/audit-workflow-utils.test.mjs`
- Create: `assets/js/core/audit-workflow-utils.js`
- Create: `assets/js/services/audit-service.js`

**Interfaces:**
- Produces: `validateAuditCycleDraft(input)`, `validateAuditDraft(input)`, `validateFindingDraft(input)`, `validateCorrectiveActionDraft(input)`, `getFindingWorkflowActions(record, role)`, `getCorrectiveActionWorkflowActions(record, role)`, `buildReportCsv(report)`, `buildAuditMutation(action, token, payload, idFactory)`.

- [ ] Write failing tests for validation, workflow transitions, CSV escaping, and mutation envelopes.
- [ ] Run `npm test -- tests/audit-workflow-utils.test.mjs` and confirm failure because the module does not exist.
- [ ] Implement utilities and service with no framework.
- [ ] Re-run targeted test and full `npm test`.

### Task 2: Audit Workspace UI

**Files:**
- Create: `audit-cycles.html`
- Create: `audits.html`
- Create: `findings.html`
- Create: `corrective-actions.html`
- Create: `audit-logs.html`
- Create: `assets/js/pages/audit-workspace-page.js`
- Modify: `404.html`

**Interfaces:**
- Consumes Task 1 utilities and service.
- Produces reusable bento/table workflow pages with pagination size 5 and responsive stacked rows on small screens.

- [ ] Add pages for kitaran audit, audit, penemuan, tindakan pembetulan, and log audit.
- [ ] Add clean-route mappings in `404.html`.
- [ ] Implement list/search/filter/pagination, create/update/delete/restore where allowed, and workflow buttons.
- [ ] Ensure no horizontal scroll is needed on mobile/desktop.

### Task 3: Dashboard And Reports

**Files:**
- Create: `dashboard.html`
- Create: `reports.html`
- Create: `assets/js/pages/dashboard-page.js`
- Create: `assets/js/pages/reports-page.js`
- Modify: `404.html`

**Interfaces:**
- Consumes `dashboard.summary`, `reports.dataset`, and `buildReportCsv(report)`.
- Produces cards, charts, urgent lists, report preview, print, and CSV export.

- [ ] Add dashboard cards and compact charts for counts by risk level/category.
- [ ] Add overdue and awaiting verification panels.
- [ ] Add report page with generated dataset, printable layout, and CSV export.
- [ ] Run tests and browser smoke locally.

### Task 4: Apps Script Phase 3-6 Backend

**Files:**
- Modify: `apps-script/Code.gs`
- Modify: `apps-script/README.md`
- Modify: `docs/API_CONTRACT.md`
- Modify: `docs/DATA_SCHEMA.md`

**Interfaces:**
- Adds `auditCycles.delete/restore`, `audits.delete/restore`, `correctiveActions.delete/restore`, `auditLogs.list`, and stricter workflow checks.
- Keeps `setup()` autopilot for all sheets and 10 dummy rows per table.

- [ ] Bump schema/version to `2.6-full-blueprint`.
- [ ] Add missing routes and mutation actions.
- [ ] Enforce editable/finalized cycle rules, status transition checks, finding unit replace on update, target date derivation, and closure checks.
- [ ] Add backup helper functions and document Apps Script deployment steps.
- [ ] Run Apps Script syntax check with Node wrapper.

### Task 5: Navigation, Docs, Verification, Commit, Push

**Files:**
- Modify: existing HTML navigation where practical.
- Modify: `docs/MANUAL_TEST_CHECKLIST.md`
- Create: `docs/SPRAD_V2_PHASE3_TO_6_IMPLEMENTATION.md`

**Interfaces:**
- Produces final operator checklist and status summary.

- [ ] Update sidebar links so modules are discoverable.
- [ ] Run `npm test`.
- [ ] Run Apps Script syntax check.
- [ ] Start local server and smoke-test clean routes.
- [ ] Test live GitHub Pages after push.
- [ ] Commit and push to `main`.

## Status SPRAD

- Current before this plan: `2.2-phase2-data-master`.
- Target after this plan: `2.6-full-blueprint`.
- Remaining before this plan: Fasa 3, Fasa 4, Fasa 5, Fasa 6.
