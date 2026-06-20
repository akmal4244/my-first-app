<!--
File Path: docs/DEPLOYMENT.md
File Version: SPRAD v2.8-production | metadata-header.1
Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
-->

# SPRAD Deployment Notes

URL live rasmi:

```text
https://akmal4244.github.io/sprad/
```

Hosting kekal GitHub Pages. Backend kekal Google Apps Script Web App. Database kekal Google Sheets.

## Frontend Deploy

Frontend deploy berlaku melalui commit ke branch `main` repo GitHub:

```powershell
git push origin main
```

GitHub Pages akan serve root:

```text
https://akmal4244.github.io/sprad/
```

Custom domain tidak digunakan pada masa ini.

## Apps Script Deploy

Jika `apps-script/Code.gs` berubah:

1. Buka Apps Script projek Web App sedia ada.
2. Ganti kandungan `Code.gs` dengan versi terbaru dari repo.
3. Save.
4. Run function `setup()` sekali jika diminta authorization.
5. Optional: run `installDailyBackupTrigger()` sekali untuk backup harian Google Sheets.
6. Deploy > Manage deployments > Edit deployment.
7. Pilih versi baru.
8. Pastikan Web App masih accessible kepada pengguna yang sama seperti deployment lama.
9. Test `config.get` dan pastikan `schema_version` ialah `2.8-production`.
10. Test:

```text
GET action=config.get
GET action=system.health&token=...
GET action=riskMatrix.get
GET action=login
GET action=dashboard.summary&token=...
GET action=mutations.status&requestId=missing&token=...
```

## Important Backend Behavior

- POST kekal `mode:"no-cors"` tanpa headers.
- Mutation V2 tidak boleh dianggap berjaya sehingga `mutation_receipts` sah.
- `setup()` idempotent dan tidak memadam sheet lama.
- Legacy sheets dikekalkan.
- V2 sheets dan dummy data dijana automatik.
- Password baharu menggunakan salt + pepper; password lama akan dinaik taraf selepas login berjaya.
- Sesi baharu menyimpan token hash, bukan token mentah.
- Logout frontend memanggil `auth.logout` untuk revoke session backend sebelum kembali ke login.
- `system.health` ialah endpoint admin-only untuk semak schema, sheet readiness dan konfigurasi production tanpa mendedahkan secret.

## Required Manual Step

Google Apps Script tidak auto-deploy dari GitHub Pages. Selepas commit yang mengubah `apps-script/Code.gs`, pengguna perlu update Apps Script secara manual atau melalui deployment workflow berasingan.

## Rollback

Jika deploy Apps Script bermasalah:

1. Apps Script > Manage deployments.
2. Pilih versi lama yang berfungsi.
3. Redeploy.
4. Jangan padam sheet V2; ia selamat dibiarkan untuk migrasi seterusnya.

## Data Safety

Sebelum migration besar:

1. File > Make a copy pada Google Sheets database.
2. Simpan nama backup dengan tarikh.
3. Pastikan owner dan sharing tidak terbuka kepada public.
4. Jalankan `setup()` pada salinan jika mahu test migration dahulu.
