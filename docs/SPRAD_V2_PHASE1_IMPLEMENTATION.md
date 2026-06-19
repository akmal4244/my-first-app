# SPRAD V2 Phase 1 Implementation Notes

Tarikh: 2026-06-19
URL GitHub Pages: `https://akmal4244.github.io/sprad/`
Skop: Foundation selamat tanpa memutuskan sistem GitHub Pages + Apps Script sedia ada.

## Matlamat Fasa 1

Fasa ini memulakan migrasi SPRAD daripada borang umum kepada sistem penilaian risiko audit dalaman berstruktur, tetapi masih mengekalkan keserasian dengan backend Apps Script semasa.

Keputusan penting:

- Stack kekal vanilla HTML/CSS/JavaScript.
- Apps Script URL dipusatkan dalam `assets/js/config.js`.
- Borang risiko menggunakan matriks rasmi 1-4 x 1-4.
- Frontend mengira pratonton risiko, tetapi backend V2 tetap perlu mengira semula apabila dideploy.
- POST borang masih mengekalkan `mode: "no-cors"` dan menghantar `message` terstruktur untuk backend lama.
- "Ingat saya" tidak lagi menyimpan kata laluan; ia hanya menyimpan nama pengguna.
- Pendaftaran awam pentadbir ditutup pada UI.

## Perubahan Utama

| Kawasan | Perubahan |
| --- | --- |
| Domain | Custom domain dibuang; sistem kembali menggunakan URL default GitHub Pages. |
| Dokumentasi | Blueprint V2 disimpan di `docs/SPRAD_V2_SYSTEM_BLUEPRINT.md`. |
| Config | API URL dan storage key dipusatkan di `assets/js/config.js`. |
| Risk Engine | Modul `assets/js/core/risk-engine.js` mengira skor dan tahap risiko. |
| Tests | `tests/risk-engine.test.mjs` menguji formula, validasi dan rumusan. |
| Login | "Ingat saya" hanya menyimpan username. Password lama dibersihkan dari storage. |
| Register | Public registration hanya untuk `pengguna`. Pentadbir perlu dicipta secara terkawal. |
| Form | Borang menjadi borang penemuan risiko V2 dengan risk preview. |
| Backend prep | Folder `apps-script/` menyimpan asas Code.gs kompatibel untuk migrasi V2. |

## Had Fasa Ini

Fasa ini belum menyelesaikan semua acceptance criteria blueprint. Ciri berikut masih fasa seterusnya:

- CRUD institusi penuh di UI.
- CRUD PTJ/org units.
- CRUD kitaran audit dan audit engagement.
- Dashboard analitik V2 penuh.
- Workflow reviewer: submit, return, approve, override.
- Corrective actions penuh.
- Report print seperti UniMAP.
- Mutation receipt polling pada semua mutation.
- Token hash dan salted password penuh di backend live.

## Strategi Keserasian

Borang V2 menghantar data baharu seperti `likelihood`, `impact`, `risk_score`, `risk_level`, `risk_category`, `audit_cycle`, `root_cause`, `impact_description`, dan `recommendation`.

Untuk backend lama, field `message` dibina semula sebagai teks terstruktur. Ini memastikan sheet `contacts` masih menerima data walaupun Apps Script live belum dinaik taraf.

## Domain

Sistem menggunakan URL default GitHub Pages:

```text
https://akmal4244.github.io/sprad/
```

Fail `CNAME` tidak digunakan supaya GitHub Pages tidak bertukar semula kepada custom domain.

## Ujian Wajib Fasa 1

```bash
npm test
```

Expected:

```text
4 tests pass
0 fail
```

Smoke test manual:

- `/` dan `/login` masih boleh log masuk.
- Remember me hanya mengisi username.
- `/register` tidak lagi menawarkan pilihan pentadbir.
- `/form` memerlukan token dan memaparkan borang risiko V2.
- Risk preview berubah apabila likelihood/impact ditukar.
- Submit borang masih menggunakan POST `mode: "no-cors"`.
- `/view` masih memaparkan dashboard legacy dengan pagination 5 rekod.

## Fasa Seterusnya Yang Selamat

1. Deploy Apps Script V2 foundation ke Web App.
2. Tambah `mutations.status` polling untuk submit borang.
3. Tambah CRUD institusi dan PTJ.
4. Migrasi `contacts` kepada `legacy_contacts` atau `findings` status `legacy_incomplete`.
5. Naik taraf dashboard kepada data `findings`.
