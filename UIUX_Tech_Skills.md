# Dashboard2y2 – Referensi Keterampilan UI/UX dan Teknis

Dokumen ini menjabarkan kumpulan **keterampilan dan pengetahuan** penting yang harus dimiliki untuk bekerja dengan aplikasi Dashboard2y2. Sangat cocok sebagai panduan default bagi agen LLM atau pengembang yang akan memelihara, meninjau, atau menambah fitur. Tujuannya menekankan *apa yang perlu diketahui* ketimbang potongan kode atau struktur data secara rinci.

---

## 🎨 UI/UX Design Skills

Agen harus mampu melakukan hal-hal berikut:

### 🎨 Token Tema dan Palet Warna

Salah satu karakteristik kunci aplikasi adalah penggunaan objek token tema yang persis sama di seluruh komponen (misal di `QuarterlyAnalysis.tsx`, `WeekComparison.tsx`). Dua tema tersedia (`dark` dan `light`), masing‑masing mendefinisikan nilai warna untuk:

- `cardBg`, `border`, `borderCard`, `tableHeadBg`, `tableHeadText`
- `rowHover`, `rowAlt`
- `text`, `textSub`, `textMuted`, `textFaint`
- `inputBg`, `inputBorder`, `selectBg`
- `infoBg`, `infoBorder`, `infoText`
- `btnBg`, `btnBorder`, `btnText`
- `modalBg`, `gridStroke`, `axisColor`
- `tooltipBg`, `tooltipBorder`
- `qCardBg`, `posBg`, `posText`, `negBg`, `negText`
- `shadow`

Komponen baru harus mengimpor dan menggunakan token tema ini, bukan membuat warna sendiri — sehingga perubahan tema berlangsung otomatis.

### 📁 Struktur Komponen dan Direktori

Aplikasi menggunakan pola `components/` untuk semua komponen UI yang dapat dipakai ulang. Beberapa komponen tipikal:

- `FilterSelect.tsx` (div + select dengan label akronim) digunakan oleh semua layar filter.
- `ExpandBtn` tombol kecil untuk memicu modal.
- Badge seperti `AchieveBadge` untuk persentase.
- Chart helpers (`renderBarChart`, `renderPieChart`) yang sering diekspor atau di-copy ke komponen baru.

Penamaan dan lokasi:

```
components/
  AnalysisSection.tsx
  AreaManagement.tsx
  WeekComparison.tsx
  QuarterlyAnalysis.tsx
  YearOnYearGrowth.tsx
  UserManagement.tsx
  …
```

Masing‑masing file berisi komponen fungsional React dengan props didefinisikan di baris atas.

## 🔧 Struktur Direktori Umum

```text
app/            # Next.js pages dan layout
  layout.tsx
  page.tsx      # dashboard wrapper dengan tab, theme logic, fetch initial data
  login/
  admin/
  api/          # backend routes
components/     # semua komponen UI ulang-pakai
lib/            # helper javascript/ts (db, utils, productCategories)
migrations/     # SQL migration scripts
database/       # schema.sql, seed
types/          # interface TypeScript data
public/         # aset statis (gambar, favicon)
```

Struktur ini memberi gambaran umum lokasi setiap bagian ketika menambah fitur baru atau memperbaiki lainnya.

Agen harus memahami di mana menaruh komponen baru (di `components`), endpoint baru (`app/api`), dan tipe data (`types`). Komponen halaman sebaiknya tetap di `app/*.tsx` bukan di `components`.



1. **Memvisualisasikan dan membandingkan data**
   - Menentukan jenis grafik yang tepat (batang untuk perbandingan target vs actual, garis untuk tren, pai untuk proporsi).
   - Menambahkan elemen pelengkap seperti legenda, tooltip khusus, dan format sumbu agar data mudah dibaca.

   *Keterampilan ini memastikan semua data disajikan dalam bentuk yang konsisten dan intuitif.*

2. **Menentukan hierarki informasi**
   - Mengidentifikasi angka atau metrik paling penting dan menekankannya melalui ukuran atau ketebalan font.
   - Menyusun bagian tampilan secara logis: banner informasi → filter → grafik → kartu ringkas → tabel detail.

   *Dengan hierarki jelas, pengguna dapat menavigasi dan menginterpretasikan data lebih cepat.*

3. **Menjaga konsistensi warna dan tema**
   - Mengoperasikan dua palet warna (light/dark) yang telah ditentukan sebagai token; gunakan hijau untuk data positif, merah untuk negatif, dan warna netral lain sesuai peran.
   - Memahami sistem token agar komponen baru langsung menyesuaikan ketika pengguna berganti tema.

   *Perubahan warna seharusnya tidak memecah konsistensi desain.*

4. **Menerapkan aturan tipografi**
   - Gunakan font monospaced untuk angka dan label teknis; gunakan font sans‑serif untuk teks umum.
   - Pertahankan ukuran font antara 9–16px dan jarak huruf (letter spacing) yang konsisten di seluruh elemen.

   *Typography uniform membantu membedakan jenis informasi.*

5. **Merancang layout responsif**
   - Menggunakan grid fleksibel (`auto-fit`/`minmax`) sehingga kolom otomatis membungkus saat layar sempit.
   - Menyiapkan filter dan tabel agar dapat di-scroll horizontal pada perangkat kecil.

   *Responsif berarti tampilan tetap usable di mobile maupun desktop.*

6. **Memberi umpan balik interaksi**
   - Filter yang dipilih segera memperbarui data tampilan tanpa perlu muat ulang halaman.
   - Menyediakan efek hover, progress bar animasi, dan grafik yang bisa diperbesar lewat modal.
   - Menampilkan penanda "memuat" atau "tidak ada data" sesuai kondisi.

   *Umpan balik menjaga pengguna tetap tahu apa yang sedang terjadi.*

7. **Menjamin aksesibilitas**
   - Menjaga kontras warna tinggi, area interaktif minimal 32×32px, dan semua kontrol bisa difokuskan.
   - Menambahkan atribut `aria-` pada elemen kustom.

   *Prinsip WCAG sederhana cukup untuk kebutuhan dashboard internal ini.*

8. **Memodularisasi komponen UI**
   - Memecah antarmuka menjadi bagian‑bagian ulang‑pakai (baris filter, kartu, grafik, badge) agar pola tetap standar saat menambah fitur baru.

   *Modularitas mempercepat pengembangan dan menjaga konsistensi.*

9. **Melakukan pengujian desain**
   - Meninjau tampilan di kedua tema, pada desktop dan mobile, serta dengan hanya keyboard.
   - Mengadopsi pendekatan mobile-first saat membuat UI baru.

   *Pengujian memastikan desain baru tidak menyalahi pedoman.*

> **Ringkasan:** Kumpulan keterampilan UI/UX ini membimbing desain antarmuka dashboard yang konsisten, responsif, dan mudah dipahami. Agen tidak harus memahami detail kode; cukup mengikuti pola warna, tipografi, layout, dan perilaku interaksi yang sudah ada.


---

## 💻 Technical Skills

Siapa pun yang menulis kode untuk proyek ini harus menguasai:


1. **React & Next.js (App Router)**
   - Membangun komponen fungsional dengan TypeScript.
   - Mengelola state lokal (`useState`) dan mengoptimalkan perhitungan turunan (`useMemo`).
   - Menempatkan halaman di direktori `app/` dan membuat endpoint API di `app/api/`.
   - Memahami cara middleware bekerja untuk melindungi rute.

   *Dasar bagi setiap fitur frontend atau backend ringan.*

2. **Kemahiran TypeScript**
   - Mendefinisikan interface untuk data masuk (penjualan, kuartal, dsb.).
   - Memberi tipe pada props komponen dan penangan event agar aman saat kompilasi.

3. **Metodologi styling**
   - Menggunakan Tailwind CSS untuk layout global, dan objek style inline untuk tampilan khusus komponen.
   - Mengetahui kapan memakai token tema dan kapan menggunakan kelas utilitas Tailwind.

4. **Pengambilan data dan desain API**
   - Menulis panggilan `fetch` ke rute internal (`/api/...`) dan mengembalikan JSON menggunakan `NextResponse.json()`.
   - Menangani kondisi error dengan elegan di frontend maupun backend.
   - Menghargai bahwa query ditulis langsung dalam SQL — tidak ada ORM.

   *Kemampuan ini penting saat menambah rute atau memodifikasi data.*

5. **PostgreSQL dan skrip basis data**
   - Membaca sekaligus memodifikasi skema yang ada di `database/schema.sql`.
   - Menjalankan skrip `.cjs` dan `.bat` untuk migrasi, pembuatan indeks, dan perbaikan data.
   - Memperhatikan performa kueri dan penggunaan indeks saat menambahkan kolom atau endpoint.

   *Skrip bantuan di root berperan penting untuk operasi data massal.*

6. **Pemahaman autentikasi**
   - Menginterpretasikan otentikasi berbasis JWT yang disimpan dalam cookie dan ditegakkan lewat middleware.
   - Mengetahui endpoint mana saja yang memerlukan proteksi (misalnya `/admin`, `/dashboard`).

   *Tanpa mekanisme ini, pengguna biasa bisa mengakses data sensitif.*

7. **Pemanfaatan utilitas**
   - Menggunakan fungsi bantu seperti `formatCurrency`, `getProductCategory`, dll. tanpa harus menulis ulang.
   - Menempatkan helper chart (renderBarChart, renderPieChart) di luar JSX agar bisa digunakan ulang di beberapa komponen.

   *Menghemat waktu dan menjaga konsistensi perhitungan/data.*

8. **Optimisasi dan performa**
   - Menggunakan memoization (`useMemo`) untuk menghindari perhitungan ulang pada dataset besar.
   - Menentukan apakah filtering dilakukan di sisi klien atau server berdasarkan ukuran data dan frekuensi perubahan.

   *Kinerja UI bergantung pada logika ini, terutama saat data bertambah.*

9. **Alur kerja pengembangan**
   - Menjalankan `npm run dev` untuk development, menjalankan pemeriksaan TypeScript (`tsc --noEmit`), dan mengikuti aturan linting pada `eslint.config.mjs`.
   - Menjalankan serta men-debug skrip database melalui PowerShell Windows; banyak utilitas ditulis dalam CommonJS.

   *Mengetahui workflow ini mempercepat pengujian dan pengerjaan fitur baru.*

10. **Keterampilan pengujian manual**
    - Karena tidak ada pengujian otomatis, pengembang harus mampu memverifikasi perubahan UI secara manual, menelusuri behavior permintaan fetch, dan memastikan tipe data benar.

    *Biasakan membuka devtools, memeriksa network, dan menjalankan `tsc` setiap kali memodifikasi komponen.*

> **Ide pokok:** profil teknis yang diharapkan adalah "pemahaman tumpukan Next.js/React/Postgres dengan penekanan pada keamanan tipe, alur data dari backend ke UI, dan ketaatan pada pola styling yang sudah ada." Agen atau pengembang yang memiliki keterampilan ini dapat memperluas atau memperbaiki aplikasi dengan aman.

---

### 🧩 Cara Menerapkan Keterampilan Ini

- **Fitur UI baru:** Mulailah dengan mengenali pola yang sudah ada (kartu, filter, grafik) lalu buat ulang dengan label dan data baru. Terapkan keterampilan desain agar konsistensi terjaga.
- **Pekerjaan endpoint:** Tambahkan rute baru di `app/api` dengan kueri SQL yang serupa; perbarui tipe TypeScript dan tangani error.
- **Komponen baru:** Buat sederhana, presentational, dan peka terhadap tema. Hindari styling sembarang.
- **Skrip data:** Saat mengubah skema atau memperbaiki data, gunakan utilitas `.cjs`; pertimbangkan performa saat menulis kueri.
- **Pengujian:** Validasi perubahan dalam mode light/dark, pada berbagai ukuran layar, dan jalankan `tsc` untuk menangkap kesalahan tipe.

Dengan referensi skillset ini, agen (atau anggota tim mana pun) secara otomatis akan menghasilkan UI dan kode yang berperilaku serta tampak sama dengan aplikasi Dashboard2y2 asli — tanpa keharusan mempelajari kode secara mendalam.

