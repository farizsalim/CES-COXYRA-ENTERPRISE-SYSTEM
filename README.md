# COXYRA ENTERPRISE SYSTEM

HRIS internal COXYRA ENTERPRISE SYSTEM. Saat ini aplikasi berfokus pada
pengelolaan data karyawan dan tindak lanjut kontrak.

## Fitur yang tersedia

### Akun dan hak akses

- Login internal menggunakan email dan kata sandi; pendaftaran publik tidak
  tersedia.
- Role aplikasi: Super Admin, Admin, HR, dan Manager.
- Super Admin memiliki seluruh izin aplikasi.
- Admin dan HR dapat menambah dan mengubah data karyawan, mengelola tindak
  lanjut kontrak, serta mengekspor daftar karyawan.
- Manager dapat melihat dan mencari direktori serta profil karyawan, tetapi
  tidak dapat mengubah data atau mengekspor daftar.
- Data pribadi hanya ditampilkan kepada Super Admin dan HR. Admin dan Manager
  hanya menerima data kerja.

### Manpower Planning dan direktori karyawan

- Navigasi **Manpower Planning** memiliki submenu **Daftar karyawan**.
- Tampilan desktop menggunakan sidebar; tampilan mobile menggunakan sidebar
  drawer yang dibuka dengan tombol hamburger.
- Direktori menyediakan pencarian berdasarkan nama, nomor karyawan, atau
  departemen; filter Aktif, Berakhir ≤14 hari, dan Semua; serta pagination
  dengan pilihan 10, 20, 30, 50, atau 100 data per halaman.
- Ringkasan dashboard menampilkan jumlah karyawan aktif dan jumlah karyawan
  aktif yang tanggal akhir masa kerjanya berada dalam rentang H-14. Perhitungan
  menggunakan kalender Asia/Jakarta.
- Data dapat ditambah, dilihat, dan diubah sesuai izin role. Penghapusan
  permanen tidak tersedia.
- Jenis hubungan kerja baru: Magang Unpaid, Magang Paid, PKWT, Freelance, dan
  Tetap. Kategori lama Magang/Kontrak tetap ditampilkan sebagai belum dirinci;
  sistem tidak menebak apakah magang lama berbayar atau tidak.
- Super Admin, Admin, dan HR dapat mengunduh Excel berdasarkan pencarian dan
  filter yang aktif. Ekspor mencakup seluruh hasil filter, bukan hanya halaman
  yang sedang dibuka. Kolom data pribadi hanya disertakan untuk Super Admin
  dan HR.

### Tindak lanjut kontrak

- Admin dan HR dapat membuka tindak lanjut dari daftar H-14 atau profil
  karyawan.
- Perpanjangan dapat mengganti jenis hubungan kerja ke Magang Unpaid, Magang
  Paid, PKWT, Freelance, atau Tetap.
- Untuk jenis non-Tetap, tanggal akhir dan durasi periode berikutnya wajib
  dicatat. Jenis Tetap tidak memiliki tanggal akhir maupun durasi kontrak.
- Kontrak dapat ditandai selesai dengan tanggal akhir aktual; status karyawan
  berubah menjadi Selesai.
- Perubahan menyimpan riwayat berisi jenis hubungan kerja lama dan baru,
  tanggal akhir lama dan baru, alasan, serta waktu pencatatan.

## Batasan fitur saat ini

- Bagian **Manpower Planning** saat ini menyediakan navigasi dan halaman
  pengantar. Form permintaan kebutuhan tenaga kerja dan alur persetujuan belum
  tersedia.
- Pipeline kandidat, seleksi, evaluasi wawancara, dan Offering Letter belum
  tersedia.
- H-14 ditampilkan di dashboard dan daftar; pengiriman notifikasi otomatis
  melalui email atau kanal lain belum tersedia.

## Teknologi

- Next.js 16, React 19, TypeScript, dan Tailwind CSS.
- MongoDB dengan Mongoose.
- Auth.js Credentials untuk autentikasi.
- ExcelJS untuk impor dan ekspor berkas Excel.

## Persiapan lokal

1. Pasang dependensi:

   ```bash
   npm install
   ```

2. Atur variabel server-only berikut dalam `.env` di root repository:

   - `MONGODB_URL`
   - `MONGODB_DB`
   - `AUTH_SECRET` (dapat dibuat dengan `npx auth secret`)
   - `super_admin_email`
   - `super_admin_password`

   Jangan commit atau membagikan `.env`.

3. Buat atau sinkronkan akun Super Admin dari kredensial `.env`:

   ```bash
   npm run create-super-admin
   ```

   Kata sandi disimpan dalam bentuk hash.

4. Untuk membuat akun lain secara interaktif:

   ```bash
   npm run create-user
   ```

   Input kata sandi tidak ditampilkan saat diketik. Kata sandi harus sepanjang
   12–72 byte.

5. Opsional, impor daftar karyawan dari `../MMP.xlsx`. Perintah pertama hanya
   memvalidasi dan menampilkan ringkasan tanpa menulis ke database:

   ```bash
   npm run import-employees
   ```

   Setelah meninjau ringkasan, jalankan dengan `-- --apply` untuk memasukkan
   nomor karyawan yang belum ada. Nomor yang sudah terdaftar dilewati dan tidak
   ditimpa.

6. Jalankan aplikasi lokal:

   ```bash
   npm run dev
   ```

   Buka `http://localhost:3000`.

## Perintah pengembangan

```bash
npm run lint
npm run build
npm run start
```

## Aturan data karyawan

- Nomor karyawan unik; email kerja juga unik jika diisi.
- Tanggal akhir dan durasi kontrak wajib untuk jenis hubungan kerja non-Tetap.
- Data karyawan tidak dihapus secara permanen dari aplikasi.
