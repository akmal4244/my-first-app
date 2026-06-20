<!--
File Path: docs/API_CONTRACT.md
File Version: SPRAD v2.8-production | metadata-header.1
Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
-->

# SPRAD API Contract

Tarikh kemaskini: 2026-06-20

Stack API kekal Google Apps Script Web App. Semua URL Apps Script disimpan di `assets/js/config.js`.

## Response Envelope V2

Endpoint V2 GET memulangkan bentuk:

```json
{
  "ok": true,
  "data": {},
  "error": null,
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-06-19T12:00:00.000Z"
  }
}
```

Endpoint legacy seperti `login`, `register`, dan `getContacts` masih mengekalkan field rata untuk compatibility frontend sedia ada.

## Auth

| Method | Action | Token | Nota |
| --- | --- | --- | --- |
| GET | `login` | Tidak | Legacy login; response turut pulangkan `user_id`, `institution_id`, dan `v2_role` selepas Code.gs V2.8 deploy. Password lama akan dinaik taraf ke hash pepper+salt selepas login berjaya. |
| GET | `register` | Tidak | Public registration hanya role pengguna. Pentadbir awam ditutup. |
| GET | `auth.me` | Ya | Pulangkan profil user tersanitasi. |
| GET | `auth.logout` | Ya | Revoke session jika kolum V2 tersedia. |

## Read Actions

| Action | Data |
| --- | --- |
| `config.get` | Nama sistem, schema version, logo, role, registration policy. |
| `institutions.list` / `institutions.get` | Institusi aktif mengikut scope role. |
| `orgUnits.list` | PTJ / Jabatan / Unit mengikut institusi. |
| `users.list` | Senarai user tersanitasi untuk admin. |
| `auditCycles.list` | Kitaran audit. |
| `audits.list` | Audit engagement. |
| `riskCategories.list` | Kategori risiko. |
| `riskMatrix.get` | Skala likelihood, impact dan risk levels daripada Google Sheets. |
| `findings.list` / `findings.get` | Penemuan audit mengikut tenant dan filter. |
| `correctiveActions.list` | Tindakan pembetulan, termasuk flag overdue. |
| `auditLogs.list` | Log audit tersanitasi untuk admin/reviewer. |
| `dashboard.summary` | Ringkasan tahap risiko, kategori dan tindakan. |
| `reports.dataset` | Dataset laporan print/export. |
| `aiJobs.list` / `aiDrafts.list` | Status AI Intake dan draft penemuan hasil analisis dokumen. |
| `system.health` | Semakan production admin-only untuk schema, sheet readiness dan konfigurasi tanpa mendedahkan secret. |
| `mutations.status` | Receipt untuk POST `mode:"no-cors"`. |

## POST Mutations

Semua mutation V2 mesti dihantar sebagai JSON body dengan `action`, `token`, `request_id` atau `requestId`, dan `payload`.

```js
await fetch(URL, {
  method: "POST",
  mode: "no-cors",
  body: JSON.stringify({
    action: "findings.create",
    token,
    request_id,
    payload
  })
});
```

Client mesti polling:

```text
GET action=mutations.status&requestId=...&token=...
```

UI hanya boleh memaparkan berjaya selepas receipt `status="success"`.

Supported mutation actions:

- `institutions.create`, `institutions.update`, `institutions.delete`, `institutions.restore`
- `orgUnits.create`, `orgUnits.update`, `orgUnits.delete`, `orgUnits.restore`
- `riskCategories.create`, `riskCategories.update`, `riskCategories.delete`, `riskCategories.restore`
- `riskLevels.update`
- `auditCycles.create`, `auditCycles.update`, `auditCycles.finalize`, `auditCycles.delete`, `auditCycles.restore`
- `audits.create`, `audits.update`, `audits.delete`, `audits.restore`
- `findings.create`, `findings.update`, `findings.delete`, `findings.restore`
- `findings.submit`, `findings.return`, `findings.approve`, `findings.overrideLevel`
- `correctiveActions.create`, `correctiveActions.update`, `correctiveActions.delete`, `correctiveActions.restore`
- `correctiveActions.submitForVerification`, `correctiveActions.verify`, `correctiveActions.return`
- `users.create`, `users.update`, `users.deactivate`, `users.restore`
- `aiIntake.create`, `aiDrafts.promote`
- `settings.update`
- `backup.now`

## Workflow Guards V2.6

- Audit dan finding tidak boleh diubah jika kitaran audit sudah `finalized`.
- Finding create sentiasa bermula sebagai `draft`.
- Finding hanya boleh bergerak `draft/returned -> submitted -> approved/returned`.
- Override tahap risiko memerlukan `override_reason`.
- Corrective action hanya boleh dibuat untuk finding `approved`.
- Corrective action bergerak `open/in_progress/returned -> awaiting_verification -> verified/returned`.
- Jika semua tindakan finding telah `verified` atau `closed`, finding ditutup automatik.
- Mutation V2 menggunakan rate limit ringkas per user/action melalui `CacheService`.

## Compatibility Actions

Masih disokong untuk UI lama:

- `GET login`
- `GET register`
- `GET getContacts`
- `POST findings.create.legacy`
- `POST contacts.update`
- `POST contacts.delete`

`contacts.delete` masih legacy CRUD. Rekod audit sebenar V2 menggunakan `findings.delete`, yang soft delete.
