# RacikResep - SaaS Platform untuk Bisnis F&B

RacikResep adalah platform SaaS (Software as a Service) yang dirancang khusus untuk pemilik bisnis F&B (Food & Beverage) skala kecil hingga menengah. Platform ini membantu pengguna menghitung Cost of Goods Sold (COGS) secara akurat untuk setiap item menu dan menentukan harga jual strategis di berbagai platform penjualan.

## 🎯 Target Pengguna

- Pemilik restoran
- Pemilik kafe
- Cloud kitchen
- Jasa katering
- Bisnis F&B lainnya yang membutuhkan alat untuk manajemen resep dan strategi penetapan harga

## ✨ Fitur Utama

### 📊 Dashboard
- **Ringkasan Bisnis**: Menampilkan metrik utama seperti total bahan baku, jumlah resep, dan rata-rata margin keuntungan
- **Resep Paling Menguntungkan**: Daftar resep dengan margin keuntungan tertinggi
- **Log Aktivitas Terbaru**: Ringkasan 5 aktivitas terakhir yang dilakukan pengguna

### 📦 Manajemen Inventori (Bahan Baku)
- **CRUD Bahan Baku**: Fungsi lengkap untuk membuat, membaca, memperbarui, dan menghapus data bahan baku
- **Kategorisasi Bahan**: Mengelompokkan bahan ke dalam kategori yang dapat disesuaikan
- **Penggunaan Bahan**: Melihat di mana bahan digunakan dan seberapa intensif penggunaannya
- **Detail Harga Pembelian**: Mencatat harga beli, berat/volume bersih per kemasan, dan satuan pembelian
- **Kalkulasi Harga per Unit**: Otomatis menghitung biaya bahan per unit penggunaan
- **Pencarian & Filter**: Fitur pencarian untuk menemukan bahan dengan cepat

### 👨‍🍳 Manajemen Resep & Kalkulasi COGS
- **CRUD Resep**: Fungsi lengkap untuk mengelola resep
- **Komposisi Resep Dinamis**: 
  - Menambahkan bahan baku dari inventori
  - Menambahkan resep lain sebagai "sub-resep"
- **Biaya Tambahan**: Memasukkan biaya non-bahan seperti tenaga kerja, operasional, dan kemasan
- **Kalkulasi COGS Real-time**: Total COGS resep dihitung dan diperbarui secara otomatis
- **Yield**: Menentukan jumlah porsi yang dihasilkan untuk menghitung COGS per porsi
- **Penetapan Harga Jual**: Menentukan margin & pajak untuk menghitung harga jual dasar
- **Kategorisasi Resep**: Mengelompokkan resep ke dalam kategori yang dapat disesuaikan

### ⚙️ Pengaturan & Kustomisasi
- **Profil Restoran**: Mengatur nama bisnis, alamat, kontak, dan upload logo
- **Preferensi Aplikasi**:
  - Mengatur mata uang yang digunakan
  - Mengatur bahasa (Indonesia/English)
  - Memilih tema tampilan (Light, Dark, atau mengikuti sistem)
- **Manajemen Unit**: Menambah atau menghapus daftar satuan pembelian dan penggunaan
- **CRUD Saluran Penjualan**: Mengelola berbagai channel penjualan

## 🛠️ Teknologi yang Digunakan

- **Frontend**: Next.js 15, React 19, TypeScript 5
- **Styling**: Tailwind CSS
- **Database**: SQLite dengan Prisma ORM (Prisma 6)
- **Authentication**: NextAuth.js (credentials)
- **UI Components**: Custom components dengan Radix UI primitives
- **Icons**: Lucide React

## 🚀 Instalasi dan Menjalankan Aplikasi

1. **Clone repository**:
   ```bash
   git clone <repository-url>
   cd RacikResep
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Persiapan environment**:
   Buat file `.env` di root proyek minimal dengan variabel berikut:
   ```bash
   # URL aplikasi saat pengembangan
   NEXTAUTH_URL=http://localhost:3000
   # Dapat dibuat via: openssl rand -base64 32
   NEXTAUTH_SECRET=your-strong-random-secret
   ```

4. **Setup database**:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Jalankan development server**:
   ```bash
   npm run dev
   ```

6. **Buka aplikasi**:
   Akses aplikasi di [http://localhost:3000](http://localhost:3000)

7. (Opsional) **Lihat database dengan Prisma Studio**:
   ```bash
   npx prisma studio
   ```

### Skrip NPM yang tersedia (`package.json`)

- `dev`: Menjalankan Next.js dev server dengan Turbopack
- `build`: Build produksi (Turbopack)
- `start`: Menjalankan server produksi
- `lint`: Menjalankan ESLint

## 📁 Struktur Project

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (Ingredients, Recipes, Units, Categories, Sales Channels, dll.)
│   ├── auth/              # Halaman autentikasi
│   ├── dashboard/         # Dashboard bisnis
│   ├── ingredients/       # Manajemen bahan baku
│   ├── recipes/           # Manajemen resep
│   └── layout.tsx         # Root layout
├── components/            # Komponen reusable
│   ├── ui/               # UI primitives & wrappers (Radix, Tailwind)
│   ├── layout/           # Komponen layout
│   ├── ingredients/      # Komponen khusus bahan
│   └── recipes/          # Komponen khusus resep
├── hooks/                # React hooks (mis. `useTheme`)
├── lib/                  # Library utilitas
│   ├── auth.ts          # Konfigurasi NextAuth (credentials)
│   ├── prisma.ts        # Prisma client
│   └── utils.ts         # Helper utilities
prisma/
├── schema.prisma         # Skema database Prisma (SQLite)
└── migrations/           # Migrations Prisma
```

## 🗄️ Database Schema

Aplikasi menggunakan database relasional dengan tabel utama:
- **Users**: Data pengguna
- **Business**: Profil bisnis
- **Categories**: Kategori bahan dan resep
- **Units**: Satuan pembelian dan penggunaan
- **Ingredients**: Data bahan baku
- **Recipes**: Data resep
- **RecipeIngredients**: Relasi bahan dalam resep
- **SalesChannels**: Channel penjualan
- **ActivityLogs**: Log aktivitas pengguna

## 🔐 Fitur Keamanan

- Autentikasi berbasis JWT dengan NextAuth.js
- Password hashing dengan bcrypt
- Session management
- Protected routes
- Data isolation per business

Catatan: Aplikasi menggunakan Credentials Provider; proses login memeriksa email/password di tabel `users` dengan hashing `bcryptjs` (lihat `src/lib/auth.ts`).

## 📈 Fitur Kalkulasi COGS

Sistem kalkulasi COGS yang komprehensif:
1. **Biaya Bahan Baku**: Dihitung berdasarkan quantity × cost per unit
2. **Biaya Tenaga Kerja**: Biaya untuk persiapan dan memasak
3. **Biaya Operasional**: Biaya gas, listrik, dll.
4. **Biaya Kemasan**: Biaya packaging
5. **Total COGS**: Jumlah semua biaya di atas
6. **COGS per Porsi**: Total COGS dibagi jumlah porsi

## 🎨 Desain UI/UX

- **Responsive Design**: Optimal di desktop, tablet, dan mobile
- **Modern Interface**: Clean dan intuitive
- **Color-coded Categories**: Kategori dengan warna untuk identifikasi mudah
- **Real-time Updates**: Kalkulasi COGS yang update secara real-time
- **Loading States**: Feedback visual saat memuat data

## 🔄 Status Pengembangan

✅ **Selesai**:
- Setup project dan database schema
- Sistem autentikasi dan manajemen user
- Dashboard dengan metrik bisnis
- Manajemen bahan baku (CRUD lengkap)
- Manajemen resep dengan kalkulasi COGS
 - Pengayaan data bahan: tampilan penggunaan bahan di resep (`usageCount` + daftar resep)

🚧 **Dalam Pengembangan**:
- Fitur simulasi (promo, sales channels, shopping planning)
- Pengaturan dan kustomisasi lanjutan
- Peningkatan UI/UX
- Testing dan deployment

## 📝 Cara Menggunakan

1. **Registrasi**: Buat akun baru dengan informasi bisnis
2. **Setup Bahan Baku**: Tambahkan bahan-bahan yang digunakan
3. **Buat Resep**: Tambahkan resep dengan komposisi bahan
4. **Analisis COGS**: Lihat kalkulasi COGS otomatis
5. **Tentukan Harga**: Set margin keuntungan dan harga jual
6. **Monitor Dashboard**: Pantau performa bisnis

## 🤝 Kontribusi

Aplikasi ini dikembangkan sebagai solusi SaaS untuk bisnis F&B. Untuk kontribusi atau feedback, silakan hubungi developer.

## 📄 Lisensi

Copyright © 2025 RacikResep. All rights reserved.
