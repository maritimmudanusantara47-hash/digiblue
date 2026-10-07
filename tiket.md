Judul:
[FULLSTACK] Implementasi Fitur Multi-Bahasa (i18n) End-to-End di Seluruh Halaman Platform DigiBlue

Jenis Develop:
Fullstack (Frontend: Next.js 16 App Router + Backend: Laravel 13 REST API)

Estimasi Scope:
BESAR (Large / Epic)
*Alasan: Mencakup setup arsitektur lokalisasi baru, ekstraksi ratusan teks di seluruh modul halaman (Publik, Auth, Siswa, Admin, Asesor, Verifikasi), penyesuaian skema validasi Zod, serta refactor respon pesan API di backend.*

Tujuan:
Menyediakan dukungan multi-bahasa dwibahasa (Bahasa Indonesia 🇮🇩 dan English 🇬🇧) secara menyeluruh pada platform DigiBlue guna meningkatkan aksesibilitas bagi pengguna lokal maupun internasional, baik pada elemen antarmuka pengguna (UI/UX) maupun pesan respon dari server backend.

Deskripsi:
Saat ini platform DigiBlue memiliki seluruh teks statis UI, label navigasi, form validasi, notifikasi toast, dan respon pesan API yang di-hardcode dalam Bahasa Indonesia. 

Fitur ini akan membangun arsitektur lokalisasi (i18n) terintegrasi:
1. Sisi Frontend: Mengintegrasikan library lokalisasi untuk Next.js App Router (React 19), membuat UI Language Switcher yang persisten (tersimpan di Cookie/LocalStorage), memindahkan seluruh teks statis ke kamus bahasa (`id.json` & `en.json`), serta mengirim preferensi bahasa via header HTTP ke backend.
2. Sisi Backend: Menerapkan middleware untuk mendeteksi preferensi bahasa klien melalui header `Accept-Language`, memindahkan seluruh pesan respon JSON dan validasi form ke kamus bahasa bawaan Laravel (`lang/id` & `lang/en`), sehingga pesan error/sukses selalu selaras dengan bahasa yang aktif di antarmuka.

Checkpoint Pekerjaan:
Phase 1: Arsitektur & Konfigurasi Dasar
- [ ] [FE] Setup & konfigurasi arsitektur i18n (menggunakan next-intl atau custom dictionary loader yang kompatibel dengan Next.js 16 App Router & Turbopack).
- [ ] [FE] Implementasi komponen UI Language Switcher (ID / EN) pada Navbar publik, Topbar Siswa, Topbar Admin, dan Topbar Asesor.
- [ ] [FE] Simpan state pilihan bahasa di Cookie agar tidak hilang saat reload atau perpindahan rute.
- [ ] [FE] Konfigurasi Axios Interceptor di `src/lib/api.ts` agar menyertakan header `Accept-Language: <locale>` pada setiap request ke backend.
- [ ] [BE] Buat Middleware `LocalizationMiddleware` (atau `SetLocale`) di Laravel untuk menangkap header `Accept-Language` dan mengeksekusi `app()->setLocale($locale)`.
- [ ] [BE] Daftarkan middleware pada grup rute API (`bootstrap/app.php` / `routes/api.php`).

Phase 2: Ekstraksi Kamus Bahasa Frontend (UI Strings)
- [ ] [FE] Ekstraksi string Landing Page Publik & Footer (`src/app/page.tsx`).
- [ ] [FE] Ekstraksi string Halaman Autentikasi (`/login` dan `/register`).
- [ ] [FE] Ekstraksi string Portal Peserta (`/student/*`: Dashboard, Katalog Kursus, Detail Modul, Beasiswa, Sertifikat).
- [ ] [FE] Ekstraksi string Portal Admin (`/admin/*`: Dashboard, Manajemen Pengguna, Kursus, Pendaftaran, Beasiswa).
- [ ] [FE] Ekstraksi string Portal Asesor (`/assessor/*`: Dashboard & Review Submisi Tugas).
- [ ] [FE] Ekstraksi string Halaman Verifikasi Publik Sertifikat (`/verify/[serialUrlKey]`).
- [ ] [FE] Penyesuaian skema pesan error validasi form (Zod + React Hook Form).

Phase 3: Sentralisasi Pesan Respon Backend (API Messages)
- [ ] [BE] Buat file kamus bahasa `lang/id/messages.php`, `lang/en/messages.php`, serta file `validation.php`.
- [ ] [BE] Refactor pesan respon JSON pada seluruh controller utama:
      - AuthController (Login, Register, Logout, Token)
      - CourseController & ContentController
      - EnrollmentController & PaymentController
      - ScholarshipController
      - SubmissionController
      - AdminControllers (User, Course, Quiz, Certificate)
- [ ] [BE] Pastikan fallback locale tetap berjalan (default: 'id' jika header tidak disertakan).

Phase 4: QA & UI Consistency
- [ ] [FE/BE] Pengujian pergantian bahasa secara langsung (real-time toggle) di semua halaman.
- [ ] [FE] Pengecekan layout responsif (pastikan tidak ada text-overflow / button patah akibat teks Bahasa Inggris yang lebih panjang).

Definition of Done (DoD):
1. Language Switcher berfungsi di seluruh role (Guest, Student, Admin, Assessor) dan perpindahan bahasa berjalan instan tanpa merusak state aplikasi.
2. Seluruh teks statis (navbar, sidebar, tombol CTA, judul, tabel, modal, form input, dan toast notification) berubah 100% sesuai bahasa yang dipilih (ID/EN).
3. Pesan validasi form input di frontend tampil sesuai bahasa aktif.
4. Respon API backend (pesan sukses, pesan error kredensial, validasi input) mengembalikan bahasa yang sesuai dengan header `Accept-Language`.
5. Pilihan bahasa tetap tersimpan (persist) saat halaman di-refresh atau setelah user logout & login kembali.
6. Tidak ada error rendering, hydration mismatch pada Next.js, maupun layout patah (responsif di desktop & mobile).
