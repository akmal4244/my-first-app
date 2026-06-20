<!--
File Path: docs/DATA_SCHEMA.md
File Version: SPRAD v2.8-production | metadata-header.1
Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
-->

# SPRAD Data Schema

Tarikh kemaskini: 2026-06-20

Google Sheets ialah database rasmi. `apps-script/Code.gs` menjalankan setup idempotent melalui `ensureSheets_()` pada setiap request dan manual function `setup()`.

## Schema Version

Current schema marker:

```text
2.8-production
```

Setting ini disimpan dalam sheet `settings` sebagai `schema_version`.

## Legacy Sheets

Legacy sheets dikekalkan supaya sistem live tidak putus:

- `contacts`: `id, name, email, message, created_at`
- `users`: `id, username, password, role, created_at`
- `sessions`: `token, user_id, expires, created_at`
- `settings`: `key, value`

V2.6 menambah compatibility columns pada `users` dan `sessions` tanpa mengubah lima kolum asal.

Tambahan `users`:

```text
institution_id, display_name, email, password_salt, status,
failed_login_count, locked_until, updated_at, updated_by,
deactivated_at, deactivated_by
```

Tambahan `sessions`:

```text
token_hash, institution_id, role, last_seen_at, revoked_at
```

## V2 Sheets

Sheets V2 yang disediakan automatik:

- `institutions`
- `org_units`
- `audit_cycles`
- `audits`
- `risk_categories`
- `likelihood_scale`
- `impact_scale`
- `risk_levels`
- `findings`
- `finding_units`
- `corrective_actions`
- `attachments`
- `audit_logs`
- `ai_jobs`
- `ai_drafts`
- `mutation_receipts`

## Risk Rules

Formula backend:

```text
calculated_score = likelihood * impact
```

Valid value:

```text
likelihood = 1..4
impact = 1..4
```

Default levels:

| Score | Level | Due days |
| --- | --- | --- |
| 1-4 | Rendah | 180 |
| 5-8 | Sederhana | 90 |
| 9-12 | Tinggi | 30 |
| 13-16 | Kritikal | 7 |

Backend menyimpan `calculated_level_id` dan `final_level_id` secara berasingan. Override final level memerlukan `override_reason`.

## Delete Policy

Business records V2 menggunakan soft delete:

```text
status=archived
deleted_at=<ISO timestamp>
deleted_by=<user id>
```

Legacy `contacts` masih dikekalkan untuk compatibility table lama.

## Audit Trail

Mutation V2 menulis ke `audit_logs`:

```text
id, institution_id, user_id, action, entity_type, entity_id,
request_id, before_json, after_json, created_at
```

Sanitizer membuang password, password hash, salt, token dan token hash daripada audit JSON.

## Dummy Data

Setup V2.6 menambah data demo idempotent:

- 10 institusi demo
- 10 PTJ demo
- 10 audit cycles
- 10 audits
- 10 findings
- 10 finding unit links
- 10 corrective actions
- 10 attachments
- 10 audit logs
- 10 mutation receipts

Seeder tidak menggandakan row jika ID demo sudah wujud.

## Security / Hardening V2.6

- Password baharu disimpan sebagai hash SHA-256 dengan `password_salt` dan pepper `SPRAD_PASSWORD_PEPPER` dalam `PropertiesService`.
- Password lama/plain lama masih boleh login sekali dan akan dinaik taraf automatik selepas login berjaya.
- Sesi baharu menyimpan `token_hash`; token mentah dikosongkan untuk rekod baharu. Rekod lama masih disokong untuk migration.
- Mutation receipt mengekalkan idempotency melalui `request_id`.
- `audit_logs` membuang password, salt, token dan token hash daripada JSON audit.
- Backup boleh dijalankan manual melalui `backup.now` atau fungsi Apps Script `runDailyBackup()`.
