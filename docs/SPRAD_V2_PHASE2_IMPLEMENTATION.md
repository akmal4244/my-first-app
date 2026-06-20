<!--
File Path: docs/SPRAD_V2_PHASE2_IMPLEMENTATION.md
File Version: SPRAD v2.8-production | metadata-header.1
Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
-->

# SPRAD V2.2 Phase 2 - Institusi dan Data Induk

Tarikh kemaskini: 2026-06-19

## Status

Fasa 2 dilengkapkan pada repo frontend dan `apps-script/Code.gs`.

Stack kekal:

- GitHub Pages untuk hosting frontend.
- Google Apps Script sebagai API backend.
- Google Sheets sebagai database.
- Vanilla HTML/CSS/JavaScript dengan Tailwind CDN.

## Modul Disiapkan

### 1. Institusi

- Halaman `institutions`.
- Senarai institusi dengan carian dan pagination 5 rekod.
- Create, update, archive dan restore melalui mutation receipt.
- Form profil institusi: kod, nama, nama ringkas, kementerian, alamat, logo, tajuk laporan dan status.

### 2. PTJ / Unit

- Halaman `org-units`.
- Senarai PTJ / jabatan / unit dengan carian dan pagination.
- Create, update, archive dan restore.
- Sokongan medan `parent_unit_id` untuk struktur parent-child.

### 3. Pengguna

- Halaman `users`.
- Senarai pengguna tersanitasi tanpa password.
- Create, update, deactivate dan restore.
- Update menyokong username, nama paparan, e-mel, role, status dan password baharu jika diisi.

### 4. Kategori dan Matriks Risiko

- Halaman `settings`.
- CRUD kategori risiko.
- Paparan dan update tahap risiko: label, rank, skor minimum/maksimum, warna hex dan SLA hari.
- `riskMatrix.get` kini boleh ikut scope institusi apabila token dihantar.
- Pengiraan risiko backend membaca `risk_levels` mengikut institusi, dengan fallback default jika tenant lama belum mempunyai konfigurasi sendiri.
- Institusi baharu akan menerima clone default likelihood scale, impact scale, risk levels dan kategori starter secara automatik.

### 5. UI dan UX

- Sidebar pentadbir ditambah untuk modul Fasa 2.
- Jadual tidak menggunakan scroll mendatar; pada skrin kecil jadual bertukar menjadi kad.
- Semua jadual menggunakan pagination 5 rekod.
- Cache localStorage digunakan untuk paparan semula lebih cepat, kemudian refresh Apps Script di belakang.
- Loading skeleton dan toast notification digunakan untuk delay Google Sheets.

## Backend Apps Script

`apps-script/Code.gs` dinaikkan kepada:

```text
2.2-phase2-data-master
```

Mutation baharu:

- `orgUnits.restore`
- `riskCategories.create`
- `riskCategories.update`
- `riskCategories.delete`
- `riskCategories.restore`
- `riskLevels.update`
- `users.restore`

Read endpoint dikemaskini:

- `institutions.list` menerima `include_archived=1`.
- `orgUnits.list` menerima `include_archived=1`.
- `users.list` menerima `include_archived=1`.
- `riskCategories.list` menerima `include_archived=1`.

Hardening Fasa 2:

- `institution_admin` tidak boleh mencipta atau menetapkan `super_admin`.
- Frontend data induk hanya membenarkan `super_admin` dan `institution_admin`.
- Mutation receipt V2 disemak mengikut `request_id`, `user_id` dan `action`.
- Rekod `status=archived` / `inactive` disembunyikan daripada list default kecuali `include_archived=1`.
- Manifest `apps-script/appsscript.json` menetapkan runtime V8.

## Perkara Wajib Selepas Push

Untuk backend live berfungsi penuh, salin kandungan `apps-script/Code.gs` baharu ke Google Apps Script dan redeploy Web App.

Tanpa redeploy, frontend Fasa 2 masih boleh dibuka tetapi mutation/read V2 baharu akan memaparkan mesej bahawa backend belum dikemaskini.

## Ujian

Ujian automatik yang berkaitan:

- `tests/data-master-utils.test.mjs`
- `tests/mutation-utils.test.mjs`
- `tests/permissions.test.mjs`
- `tests/storage-validators.test.mjs`

Semakan terakhir:

```powershell
npm test
Get-Content -Path apps-script\Code.gs -Raw | node --check --input-type=commonjs
```
