<!--
File Path: apps-script/README.md
File Version: SPRAD v2.8-production | metadata-header.1
Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
-->

# SPRAD Apps Script

Fail `Code.gs` dalam folder ini ialah backend SPRAD V2.6 yang masih kompatibel dengan sistem lama.

## Cara guna

1. Buka projek Google Apps Script SPRAD.
2. Backup kod semasa dahulu.
3. Salin kandungan `apps-script/Code.gs` ke Apps Script.
4. Pastikan Apps Script menggunakan runtime V8. Jika guna manifest, salin juga `apps-script/appsscript.json`.
5. Jalankan fungsi `setup()` sekali daripada Apps Script editor.
6. Jika mahu backup automatik, jalankan fungsi `installDailyBackupTrigger()` sekali.
7. Deploy semula Web App.
8. Pastikan Web App masih menggunakan akses yang sama seperti deployment sebelum ini.

## Apa yang disokong

- Login/register/getContacts legacy masih dikekalkan.
- Public admin registration ditutup melalui `ALLOW_PUBLIC_ADMIN_REGISTER = false`.
- Sheet lama `contacts`, `users`, `sessions`, dan `settings` masih digunakan.
- Sheet V2 akan dicipta secara idempotent:
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
  - `mutation_receipts`
- Risk score dikira semula di backend untuk action `findings.create` dan `findings.create.legacy`.
- Submit borang V2 turut mengisi `contacts` supaya dashboard legacy masih boleh membaca rekod.
- Fasa 2 menyokong CRUD institusi, PTJ / unit, pengguna, kategori risiko dan update tahap risiko.
- Fasa 3 menyokong kitaran audit, audit, penemuan, PTJ many-to-many, risk recalculation, soft delete dan restore.
- Fasa 4 menyokong submit, return, approve, override, tindakan pembetulan, overdue dan verification.
- Fasa 5 menyokong `dashboard.summary`, `reports.dataset`, laporan cetak dan export CSV di frontend.
- Fasa 6 menyokong audit log read endpoint, mutation rate limit, password hash pepper+salt, token hash untuk sesi baharu dan helper backup.
- Mutation `mode:"no-cors"` disahkan melalui polling `mutations.status`.

## Nota

Selepas fail ini dikemaskini dalam Apps Script, deploy semula Web App supaya frontend GitHub Pages menerima endpoint V2.6.
