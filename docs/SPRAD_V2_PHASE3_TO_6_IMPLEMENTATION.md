<!--
File Path: docs/SPRAD_V2_PHASE3_TO_6_IMPLEMENTATION.md
File Version: SPRAD v2.8-production | metadata-header.1
Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
-->

# SPRAD V2.6 Phase 3 To 6 Implementation

Tarikh: 2026-06-20

Versi selepas kemaskini: `2.6-full-blueprint`

## Ringkasan

Fasa 3 hingga 6 melengkapkan SPRAD daripada data induk kepada workflow audit penuh:

- Kitaran audit dan audit engagement.
- Penemuan audit dengan pengiraan risiko, PTJ many-to-many dan workflow semakan.
- Tindakan pembetulan dengan due date, overdue, submission dan verification.
- Dashboard analitik dan laporan cetak/CSV.
- Audit log, mutation receipt, rate limit, password hash pepper+salt dan backup helper.

## Frontend

Halaman baharu:

- `dashboard.html`
- `audit-cycles.html`
- `audits.html`
- `findings.html`
- `corrective-actions.html`
- `reports.html`
- `audit-logs.html`

Fail JavaScript baharu:

- `assets/js/core/audit-workflow-utils.js`
- `assets/js/services/audit-service.js`
- `assets/js/pages/audit-workspace-page.js`
- `assets/js/pages/dashboard-page.js`
- `assets/js/pages/reports-page.js`

Semua halaman baharu menggunakan Bahasa Melayu, Tailwind CDN, light bento style, cache tempatan selepas load pertama, loading skeleton, pagination 5 rekod dan jadual responsif tanpa horizontal scroll.

## Backend Apps Script

`apps-script/Code.gs` dikemaskini kepada schema `2.6-full-blueprint`.

Endpoint GET baharu/ditambah baik:

- `auditLogs.list`
- `dashboard.summary`
- `reports.dataset`
- filter `cycle_id`, `audit_id`, `category_id`, `unit_id`, `audit_year`

Mutation baharu/ditambah baik:

- `auditCycles.delete`, `auditCycles.restore`
- `audits.delete`, `audits.restore`
- `correctiveActions.delete`, `correctiveActions.restore`
- `correctiveActions.return`
- `backup.now`

Workflow guard:

- Cycle finalized menjadikan audit/finding/action berkaitan read-only.
- Finding create sentiasa `draft`.
- Finding transition: `draft/returned -> submitted -> approved/returned`.
- Corrective action transition: `open/in_progress/returned -> awaiting_verification -> verified/returned`.
- Semua corrective action verified/closed akan auto-close finding.

## Arahan Deploy Apps Script

1. Salin semua kandungan `apps-script/Code.gs` ke Google Apps Script.
2. Salin `apps-script/appsscript.json` jika guna manifest.
3. Run function `setup()`.
4. Optional: run `installDailyBackupTrigger()` untuk backup harian.
5. Deploy semula Web App.
6. Test `config.get` dan pastikan schema ialah `2.6-full-blueprint`.

## Status Fasa

- Fasa 0: Siap.
- Fasa 1: Siap.
- Fasa 2: Siap.
- Fasa 3: Siap dalam repo.
- Fasa 4: Siap dalam repo.
- Fasa 5: Siap dalam repo.
- Fasa 6: Siap dalam repo, dengan nota bahawa modular Apps Script multi-file masih belum dibuat kerana stack semasa diminta kekal mudah copy/paste `Code.gs`.
