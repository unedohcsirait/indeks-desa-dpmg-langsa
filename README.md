## Persyaratan Sistem

Pastikan Anda sudah menginstal perangkat lunak berikut:
- **Node.js** (Versi 18 atau terbaru)
- **PostgreSQL** (Database)
- **Git** (Opsional, untuk klon repositori)

## Langkah-langkah Instalasi

### 1. Persiapan File
```bash
git clone https://github.com/unedohcsirait/desa-indeks-system
````

### 2. Instalasi Dependensi
Buka terminal/command prompt di dalam folder proyek (`Desa-Indeks-System`) dan jalankan:
```bash
npm install
```

### 3. Pengaturan Database (PostgreSQL)
Aplikasi ini membutuhkan database PostgreSQL.
1. Buat database baru di PostgreSQL Anda (misalnya bernama `indeks_desa`).
2. Dapatkan URL koneksi database Anda. Formatnya biasanya:
   `postgres://username:password@localhost:5432/indeks_desa`

### 4. Pengaturan Variabel Lingkungan (Environment Variables)
Buat file baru bernama `.env` di folder utama proyek dan tambahkan konfigurasi berikut:

```env
DATABASE_URL=postgres://username:password@localhost:5432/indeks_desa
```


### 5. Inisialisasi Database (Push Schema)
Jalankan perintah berikut untuk membuat tabel-tabel yang diperlukan di database Anda:
```bash
npm run db:push
```

### 6. Menjalankan Aplikasi
Setelah semua siap, jalankan aplikasi dalam mode pengembangan:
```bash
npm run dev
```

Aplikasi akan berjalan dan biasanya dapat diakses melalui browser di alamat:
`http://localhost:5000` (atau port lain yang muncul di terminal).


## Ringkasan Perintah
- `npm install` - Instal library
- `npm run db:push` - Sinkronisasi database
- `npm run dev` - Jalankan aplikasi
