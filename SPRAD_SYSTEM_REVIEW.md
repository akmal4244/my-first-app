<!--
File Path: SPRAD_SYSTEM_REVIEW.md
File Version: SPRAD v2.8-production | metadata-header.1
Update Info: 2026-06-20 - Tambah metadata header untuk monitor path, versi dan info update.
-->

# SPRAD System Review and Improvement Notes

Tarikh semakan: 2026-06-19  
Nama sistem: Sistem Penilaian Risiko Audit Dalam (SPRAD)  
URL sistem: https://akmal4244.github.io/sprad/  
Platform utama: GitHub Pages + Google Apps Script + Google Sheets

## 1. Ringkasan Sistem

SPRAD ialah sistem web ringkas untuk menerima dan memaparkan rekod penilaian risiko audit dalaman. Sistem ini dibina menggunakan HTML, CSS, dan JavaScript biasa tanpa framework frontend. Backend menggunakan Google Apps Script sebagai API, manakala Google Sheets digunakan sebagai pangkalan data.

Sistem semasa menyokong:

- Log masuk pengguna.
- Daftar akaun baharu.
- Dua peranan asas: `pentadbir` dan `pengguna`.
- Borang penghantaran penilaian risiko.
- Dashboard pentadbir untuk melihat semua penilaian.
- Pagination 5 rekod setiap halaman.
- Cache localStorage untuk mempercepat paparan dashboard selepas reload.
- Paparan loading semasa menunggu Google Sheets.
- Notifikasi popup di bahagian atas kanan.
- Clean URL di GitHub Pages seperti `/login`, `/form`, dan `/view`.
- Tema visual light institutional dengan Jata Negara.

## 2. Stack Teknologi

| Komponen | Teknologi |
| --- | --- |
| Hosting frontend | GitHub Pages |
| Frontend | HTML, CSS, JavaScript |
| Styling | Tailwind CDN, custom `brand.css` |
| Ikon | Font Awesome |
| Font | Plus Jakarta Sans |
| Backend API | Google Apps Script Web App |
| Database | Google Sheets |
| Auth session | Token disimpan dalam sheet `sessions` |
| State client | `localStorage`, `sessionStorage` |

## 3. Fail Dalam Repo

| Fail | Fungsi |
| --- | --- |
| `index.html` | Halaman utama. Berfungsi sebagai halaman log masuk apabila pengguna buka root URL. |
| `login.html` | Halaman log masuk khusus. |
| `register.html` | Halaman daftar akaun dengan pilihan peranan. |
| `form.html` | Borang penilaian risiko untuk pengguna menghantar rekod. |
| `view.html` | Dashboard pentadbir untuk melihat semua rekod penilaian. |
| `404.html` | Fallback GitHub Pages untuk clean URL tanpa `.html`. |
| `brand.css` | Brand system SPRAD: warna, card, grid background, header, input, table, toast. |

## 4. Route Semasa

| Route | Fail sebenar | Akses | Tujuan |
| --- | --- | --- | --- |
| `/` | `index.html` | Public | Log masuk utama. |
| `/login` | `login.html` | Public | Log masuk. |
| `/register` | `register.html` | Public | Daftar akaun. |
| `/form` | `form.html` | Pengguna / public secara teknikal | Hantar penilaian risiko. |
| `/view` | `view.html` | Pentadbir | Lihat semua penilaian. |

Nota: Clean URL dicapai melalui `404.html`. GitHub Pages akan buka `404.html` dahulu untuk route seperti `/view`, kemudian script redirect ke `view.html` dan `history.replaceState` menyembunyikan `.html` semula.

## 5. Apps Script API

Web App URL semasa:

```text
https://script.google.com/macros/s/AKfycbyvO77bqueo45EPyAKW6jUK8R5AEIVvFLjqGhlK1Sv5s8N6ay7anY9QhGLSZaIznApkiQ/exec
```

### 5.1 GET Actions

| Action | Token diperlukan | Digunakan oleh | Response |
| --- | --- | --- | --- |
| `login` | Tidak | `login.html`, `index.html` | `{ ok, token, role, username }` |
| `register` | Tidak | `register.html` | `{ ok, user }` atau error |
| `getContacts` | Ya | `view.html` | `{ ok, contacts: [...] }` |
| `config` | Tidak | Belum digunakan secara frontend | `{ ok, app_name, logo_url, favicon_url, roles }` |

Contoh login:

```js
const params = new URLSearchParams({
  action: "login",
  username: form.username.value,
  password: form.password.value
});
const res = await fetch(URL + "?" + params.toString());
const data = await res.json();
```

### 5.2 POST Actions

POST digunakan oleh `form.html` untuk menyimpan rekod.

Fetch POST mesti kekal begini kerana Apps Script Web App tidak memberi CORS headers untuk POST:

```js
await fetch(URL, {
  method: "POST",
  mode: "no-cors",
  body: JSON.stringify(data)
});
```

Kesan `mode: "no-cors"`:

- Request dihantar.
- Data boleh disimpan oleh Apps Script.
- Browser tidak boleh baca response kerana response opaque.
- Frontend perlu anggap berjaya selepas `await fetch(...)`.
- Jangan panggil `res.json()` untuk POST ini.
- Jangan tambah `headers` atau `Content-Type`.

## 6. Struktur Google Sheets

### 6.1 Sheet `contacts`

| Column | Maksud |
| --- | --- |
| `id` | ID berdasarkan timestamp. |
| `name` | Nama penghantar. |
| `email` | E-mel penghantar. |
| `message` | Catatan atau mesej risiko. |
| `created_at` | Tarikh rekod dicipta. |

### 6.2 Sheet `users`

| Column | Maksud |
| --- | --- |
| `id` | UUID pengguna. |
| `username` | Nama pengguna. |
| `password` | Kata laluan. Dalam backend baharu, disimpan sebagai SHA-256 hash. |
| `role` | `pentadbir` atau `pengguna`. |
| `created_at` | Tarikh akaun dicipta. |

### 6.3 Sheet `sessions`

| Column | Maksud |
| --- | --- |
| `token` | Token sesi UUID. |
| `user_id` | ID pengguna. |
| `expires` | Tarikh luput sesi. |
| `created_at` | Tarikh sesi dicipta. |

### 6.4 Sheet `settings`

| Column | Maksud |
| --- | --- |
| `key` | Nama tetapan. |
| `value` | Nilai tetapan. |

Sheet `settings` dicadangkan untuk menyimpan nama sistem, logo, favicon, default user, dan metadata demo.

## 7. Peranan Pengguna

### 7.1 Pentadbir

Pentadbir boleh:

- Log masuk.
- Masuk ke dashboard `/view`.
- Melihat semua penilaian risiko.
- Melihat jumlah rekod.
- Melihat rekod terkini.
- Guna pagination.

### 7.2 Pengguna

Pengguna boleh:

- Log masuk.
- Dihalakan ke `/form`.
- Menghantar borang penilaian risiko.
- Tidak sepatutnya melihat `/view`.

## 8. Aliran Sistem

### 8.1 Aliran Log Masuk

1. Pengguna buka `/` atau `/login`.
2. Pengguna isi username dan password.
3. Frontend panggil Apps Script GET `action=login`.
4. Apps Script semak sheet `users`.
5. Jika berjaya, backend cipta token di sheet `sessions`.
6. Frontend simpan:
   - `token`
   - `role`
7. Jika role `pengguna`, redirect ke `/form`.
8. Jika role `pentadbir`, redirect ke `/view`.

### 8.2 Aliran Ingat Saya

Jika checkbox "Ingat saya" ditanda:

- `spradRememberMe` disimpan sebagai `"true"`.
- `spradUsername` disimpan.
- `spradPassword` dibersihkan jika wujud daripada versi lama.
- Selepas logout, hanya username kekal dalam login form.

Jika checkbox tidak ditanda:

- Username, metadata sesi dan token dibuang daripada `localStorage` semasa logout.

Nota keselamatan: SPRAD tidak menyimpan password dalam `localStorage`. Fungsi "Ingat saya" hanya menyimpan username.

### 8.3 Aliran Daftar Akaun

1. Pengguna buka `/register`.
2. Pengguna isi username, password, dan role.
3. Frontend panggil GET `action=register`.
4. Backend semak duplicate username.
5. Backend simpan user baharu dalam sheet `users`.
6. Frontend papar notifikasi berjaya.

Nota keselamatan: Public registration untuk role `pentadbir` patut ditutup selepas akaun admin pertama siap.

### 8.4 Aliran Hantar Penilaian

1. Pengguna buka `/form`.
2. Pengguna isi nama, e-mel, dan catatan risiko.
3. Frontend hantar POST `mode: "no-cors"`.
4. Apps Script simpan data ke sheet `contacts`.
5. Frontend papar mesej berjaya dan reset form.

### 8.5 Aliran Dashboard Pentadbir

1. Pentadbir buka `/view`.
2. Frontend semak `token`.
3. Jika tiada token, redirect ke `/login`.
4. Jika role bukan `pentadbir`, redirect ke `/form`.
5. Jika ada cache `spradContactsCache`, dashboard dipaparkan segera.
6. Frontend panggil GET `action=getContacts&token=...`.
7. Backend validate token dan role.
8. Jika sah, backend pulangkan contacts.
9. Frontend update cache, table, statistik, dan pagination.

## 9. UI dan Brand System Semasa

SPRAD sekarang menggunakan tema light institutional:

- Logo Jata Negara pada header dan favicon.
- Warna utama biru rasmi `#1e40af`.
- Warna sokongan merah `#b91c1c`, emas `#b7791f`, hijau `#047857`.
- Background grid halus untuk rasa dashboard profesional.
- Card putih dengan border lembut.
- Watermark `SPRAD` pada panel utama.
- Toast notification di atas kanan.
- Button utama berbentuk pill.
- Sidebar untuk peranan pengguna dan pentadbir.
- Table dashboard dengan pagination.

Fail utama untuk style ialah `brand.css`. Ini bagus sebagai pusat kawalan visual supaya semua halaman boleh kekal seragam.

## 10. Ciri Semasa Yang Sudah Baik

- Struktur sistem ringkas dan mudah difahami.
- Tiada framework berat.
- GitHub Pages sesuai untuk hosting percuma.
- Google Sheets sesuai untuk prototaip dan sistem kecil.
- Role `pentadbir` dan `pengguna` sudah ada.
- Backend sudah ada token session.
- Dashboard ada caching supaya reload pertama selepas data pernah dimuatkan terasa lebih pantas.
- Pagination 5 rekod setiap halaman sudah mengelakkan table terlalu panjang.
- Clean URL sudah menjadikan URL lebih kemas.
- UI sudah konsisten selepas `brand.css`.

## 11. Isu dan Risiko Semasa

### 11.1 Keselamatan

| Isu | Risiko | Cadangan |
| --- | --- | --- |
| Password boleh disimpan di `localStorage` jika "Ingat saya" ditanda | Password boleh dibaca jika device/browser terdedah | Simpan username sahaja untuk production. |
| Public registration membenarkan role `pentadbir` | Orang luar boleh cipta akaun admin jika URL diketahui | Set `ALLOW_PUBLIC_ADMIN_REGISTER = false` selepas admin pertama siap. |
| Hash password SHA-256 tanpa salt | Lebih lemah jika sheet bocor | Guna salt + secret pepper daripada Script Properties. |
| POST borang tidak memerlukan token | Sesiapa yang tahu URL API boleh submit data | Tambah token dalam body POST jika borang perlu login. |
| Tiada rate limiting | Risiko spam submission | Tambah captcha ringan, throttle, atau Apps Script Lock/limit. |
| Token disimpan di `localStorage` | Risiko token dicuri melalui XSS | Kurangkan injection risk dan sanitize semua output. |

### 11.2 Data Model

Sheet `contacts` masih terlalu umum untuk sistem penilaian risiko audit. Field `message` sahaja tidak cukup untuk analisis risiko sebenar.

Sistem SPRAD sepatutnya ada medan seperti:

- Jabatan/unit.
- Proses audit.
- Keterangan risiko.
- Punca risiko.
- Impak.
- Kebarangkalian.
- Skor risiko.
- Tahap risiko.
- Kawalan sedia ada.
- Cadangan mitigasi.
- Pemilik risiko.
- Status tindakan.
- Tarikh sasaran.
- Catatan semakan pentadbir.

### 11.3 UX

| Isu | Kesan |
| --- | --- |
| Form hanya ada nama, e-mel, message | Tidak cukup spesifik untuk penilaian risiko. |
| Dashboard belum ada search/filter | Sukar semak data apabila rekod banyak. |
| Tiada detail view | Pentadbir perlu baca dalam table sahaja. |
| Tiada export | Sukar buat laporan. |
| Tiada dashboard chart | Tiada gambaran risiko tinggi/sederhana/rendah. |
| Tiada status workflow | Tidak jelas sama ada risiko sudah disemak atau belum. |

### 11.4 Maintainability

| Isu | Kesan |
| --- | --- |
| Banyak JavaScript berulang dalam setiap HTML | Susah maintain jika perubahan global diperlukan. |
| Tailwind browser CDN digunakan | Sesuai untuk prototaip, kurang ideal untuk production. |
| API URL hardcoded di setiap fail | Perlu ubah banyak tempat jika deployment Apps Script berubah. |
| Nama sheet `contacts` tidak menggambarkan risk assessment | Boleh mengelirukan apabila sistem berkembang. |

## 12. Cadangan Data Model Baharu

Untuk jadikan SPRAD lebih sesuai sebagai sistem penilaian risiko audit dalaman, cadangan sheet utama ialah `assessments`.

### 12.1 Sheet `assessments`

| Column | Jenis | Catatan |
| --- | --- | --- |
| `id` | text | UUID atau timestamp. |
| `created_at` | datetime | Auto generated. |
| `created_by` | text | User ID atau username. |
| `name` | text | Nama pengisi. |
| `email` | text | E-mel pengisi. |
| `department` | text | Jabatan/unit. |
| `process` | text | Proses/aktiviti audit. |
| `risk_title` | text | Tajuk risiko. |
| `risk_description` | text | Keterangan risiko. |
| `risk_cause` | text | Punca risiko. |
| `impact_description` | text | Kesan jika berlaku. |
| `likelihood` | number | Skala 1-5. |
| `impact` | number | Skala 1-5. |
| `risk_score` | number | `likelihood * impact`. |
| `risk_level` | text | Rendah, Sederhana, Tinggi, Kritikal. |
| `existing_control` | text | Kawalan semasa. |
| `mitigation_plan` | text | Cadangan tindakan. |
| `owner` | text | Pemilik risiko. |
| `target_date` | date | Tarikh sasaran tindakan. |
| `status` | text | Baru, Dalam Semakan, Diterima, Ditolak, Selesai. |
| `reviewed_by` | text | Pentadbir penyemak. |
| `reviewed_at` | datetime | Tarikh semakan. |
| `review_note` | text | Catatan pentadbir. |

### 12.2 Risk Score Matrix

Cadangan formula:

```text
risk_score = likelihood * impact
```

Cadangan tahap:

| Skor | Tahap |
| --- | --- |
| 1-4 | Rendah |
| 5-9 | Sederhana |
| 10-16 | Tinggi |
| 17-25 | Kritikal |

### 12.3 Sheet `audit_logs`

Untuk audit trail sistem:

| Column | Maksud |
| --- | --- |
| `id` | ID log. |
| `created_at` | Tarikh log. |
| `user_id` | Pengguna yang buat tindakan. |
| `action` | Contoh: login, create_assessment, update_status. |
| `entity` | Contoh: assessment, user. |
| `entity_id` | ID rekod berkaitan. |
| `detail` | JSON/text ringkas. |

## 13. Cadangan Penambahbaikan Mengikut Fasa

### Fasa 1: Stabilkan Sistem Semasa

Keutamaan tinggi kerana ia mengurangkan risiko dan memudahkan maintenance.

- Pindahkan JavaScript berulang ke `app.js`.
- Pindahkan URL Apps Script ke satu config global.
- Tutup public admin registration selepas admin pertama.
- Tukar "Ingat saya" supaya simpan username sahaja untuk production.
- Tambah guard pada `/form` jika hanya user login boleh hantar penilaian.
- Tambah empty state dan error state yang lebih jelas.
- Tambah search dan filter ringkas pada dashboard.
- Tambah refresh button manual pada dashboard.

### Fasa 2: Jadikan Borang Betul-Betul Borang Risiko

- Tukar label `Catatan risiko` kepada struktur medan risiko penuh.
- Tambah medan:
  - Jabatan/unit.
  - Proses.
  - Tajuk risiko.
  - Punca risiko.
  - Impak.
  - Kebarangkalian.
  - Kawalan sedia ada.
  - Cadangan mitigasi.
  - Pemilik risiko.
  - Tarikh sasaran.
- Kira skor risiko secara automatik di frontend.
- Simpan skor dan tahap risiko ke Google Sheets.

### Fasa 3: Dashboard Analisis

- Tambah summary card:
  - Jumlah risiko.
  - Risiko kritikal.
  - Risiko tinggi.
  - Risiko belum disemak.
  - Risiko selesai.
- Tambah filter:
  - Tahap risiko.
  - Status.
  - Jabatan.
  - Tarikh.
- Tambah chart:
  - Risiko mengikut tahap.
  - Risiko mengikut jabatan.
  - Trend bulanan.
- Tambah export CSV.
- Tambah detail modal untuk setiap rekod.

### Fasa 4: Workflow Semakan Pentadbir

- Pentadbir boleh buka detail risiko.
- Pentadbir boleh ubah status.
- Pentadbir boleh tambah catatan semakan.
- Pentadbir boleh assign pemilik tindakan.
- Pentadbir boleh set tarikh sasaran.
- Semua perubahan ditulis ke `audit_logs`.

### Fasa 5: Hardening Production

- Tambah salted password hash.
- Simpan secret/pepper dalam Apps Script Properties.
- Rate limit login.
- Rate limit submission.
- Validasi email dan input di backend.
- Escape/sanitize output.
- Tambah backup/export berkala Google Sheets.
- Tambah dokumentasi deployment Apps Script.

## 14. Backlog Prioriti

| Prioriti | Item | Impak | Usaha |
| --- | --- | --- | --- |
| P0 | Tutup public admin registration | Tinggi | Rendah |
| P0 | Pusatkan config API URL | Sederhana | Rendah |
| P0 | Guard `/form` dengan token jika sistem bukan public | Tinggi | Sederhana |
| P1 | Tukar borang kepada medan risiko sebenar | Sangat tinggi | Sederhana |
| P1 | Tambah risk score matrix | Sangat tinggi | Sederhana |
| P1 | Search/filter dashboard | Tinggi | Sederhana |
| P1 | Detail modal rekod | Tinggi | Sederhana |
| P2 | Export CSV/PDF | Sederhana | Sederhana |
| P2 | Chart analisis | Tinggi | Sederhana |
| P2 | Audit logs | Tinggi | Sederhana |
| P3 | Refactor JS ke `app.js` | Sederhana | Sederhana |
| P3 | Build Tailwind production | Sederhana | Tinggi |

## 15. Cadangan Struktur Fail Akan Datang

Jika sistem terus berkembang, struktur fail boleh jadi begini:

```text
/
  index.html
  login.html
  register.html
  form.html
  view.html
  404.html
  assets/
    css/
      brand.css
      app.css
    js/
      config.js
      auth.js
      api.js
      toast.js
      router.js
      form.js
      dashboard.js
  docs/
    SPRAD_SYSTEM_REVIEW.md
    APPS_SCRIPT_DEPLOYMENT.md
    DATA_SCHEMA.md
```

Untuk sistem kecil, struktur semasa masih boleh diterima. Refactor hanya perlu dibuat apabila perubahan mula kerap berulang.

## 16. Acceptance Criteria Untuk Versi Seterusnya

Versi seterusnya boleh dianggap stabil jika:

- Pengguna boleh daftar dan log masuk.
- Pengguna role `pengguna` hanya nampak borang.
- Pengguna role `pentadbir` boleh nampak dashboard.
- Pengguna tanpa token tidak boleh akses dashboard.
- Borang menyimpan data ke Google Sheets.
- Dashboard memaparkan data terbaru.
- Pagination masih 5 rekod setiap halaman.
- Search/filter berfungsi tanpa reload.
- Loading animation muncul semasa data belum siap.
- Cache tidak memaparkan data salah selepas logout/login role lain.
- UI mobile dan desktop tidak overlap.
- Clean URL berfungsi di GitHub Pages.
- Tiada error console kritikal.

## 17. Checklist Ujian Manual

### Login

- Login admin berjaya.
- Login pengguna berjaya.
- Login password salah papar error.
- "Ingat saya" checked menyimpan input selepas logout.
- "Ingat saya" unchecked membuang input selepas logout.

### Register

- Daftar pengguna berjaya.
- Daftar username duplicate papar error.
- Daftar pentadbir hanya dibenarkan jika config production mengizinkan.

### Form

- Semua field required.
- Submit berjaya simpan ke Google Sheets.
- Form reset selepas submit.
- Toast berjaya keluar.
- Loading muncul semasa submit.

### Dashboard

- Tanpa token redirect ke login.
- Role pengguna redirect ke form.
- Role pentadbir boleh lihat table.
- Pagination paparkan 5 rekod sahaja.
- Button sebelum/seterusnya berfungsi.
- Cache memaparkan data segera selepas reload.
- Jika fetch gagal, data cache masih dipaparkan dengan toast makluman.

### Clean URL

- `/sprad/` buka login.
- `/sprad/login` buka login tanpa `.html`.
- `/sprad/register` buka register tanpa `.html`.
- `/sprad/form` buka form tanpa `.html`.
- `/sprad/view` buka dashboard tanpa `.html`.

### Responsive

- Login mobile tidak overflow.
- Sidebar mobile stack dengan baik.
- Table dashboard boleh scroll horizontal jika perlu.
- Button dan input mudah ditekan pada mobile.

## 18. Cadangan Sprint Seterusnya

Jika mahu tambah baik sistem secara cepat dan paling bernilai, cadangan sprint pertama:

1. Tukar `contacts` kepada konsep `assessments` tetapi kekalkan compatibility data lama.
2. Tambah medan risiko lengkap dalam `form.html`.
3. Tambah kiraan `likelihood`, `impact`, `risk_score`, dan `risk_level`.
4. Update Apps Script supaya simpan semua medan baharu.
5. Update dashboard supaya ada filter tahap risiko dan status.
6. Tambah detail modal untuk semakan pentadbir.
7. Tutup public admin registration.
8. Tambah audit log untuk perubahan status.

Hasil sprint ini akan menjadikan SPRAD bukan sekadar contact form, tetapi sistem penilaian risiko audit yang lebih sebenar.

## 19. Nota Penting Untuk Production

SPRAD sekarang sesuai sebagai prototaip/versi awal. Untuk kegunaan production sebenar, beri perhatian kepada:

- Keselamatan akaun.
- Had Apps Script dan Google Sheets.
- Hak akses Google Sheet.
- Backup data.
- Audit trail.
- Validasi backend.
- Kawalan siapa boleh daftar sebagai pentadbir.
- Polisi penyimpanan kata laluan.
- Keperluan laporan rasmi.

## 20. Keputusan Cadangan

Cadangan utama ialah teruskan dengan stack sedia ada untuk fasa awal kerana ia cepat, murah, dan mudah maintain. Namun, sistem perlu ditambah baik pada data model dan workflow supaya benar-benar selari dengan nama SPRAD.

Keutamaan paling penting:

1. Jadikan borang sebagai borang risiko sebenar.
2. Tambah risk score matrix.
3. Tambah dashboard analisis.
4. Ketatkan role dan keselamatan.
5. Refactor JS apabila ciri bertambah.

