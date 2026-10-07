'use client';

import Link from 'next/link';
import Icon from '@/components/Icon';

export default function PrivacyPage() {
  return (
    <div className="bg-[#f9f9ff] min-h-screen text-slate-700 py-12 sm:py-16">
      <div className="container max-w-4xl">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-navy transition-colors">
            Beranda
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Kebijakan Privasi</span>
        </div>

        {/* Card Header */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-200">
            <Icon name="lock" size={14} />
            <span>Kepatuhan UU Pelindungan Data Pribadi (UU PDP)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#00162d] tracking-tight mb-4">
            Kebijakan Privasi & Keamanan Data
          </h1>
          <p className="text-sm text-slate-500">
            Terakhir diperbarui: 15 Februari 2026 • Komitmen perlindungan privasi data pembelajar maritim DigiBlue
          </p>
        </div>

        {/* Legal Body */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-[#00162d] mb-3">1. Informasi yang Kami Kumpulkan</h2>
            <p className="text-slate-600 mb-2">
              Kami mengumpulkan informasi pribadi yang Anda berikan secara langsung saat membuat akun dan menggunakan platform DigiBlue, antara lain:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-slate-600">
              <li>Identitas dasar: Nama lengkap, alamat email, nomor telepon/WhatsApp, dan negara asal.</li>
              <li>Data akademik: Riwayat kursus, progres pembelajaran modul, hasil ujian kompetensi, serta kredensial sertifikat.</li>
              <li>Data transaksi: Riwayat nomor referensi pemesanan dan status konfirmasi transaksi melalui Midtrans (kami tidak pernah menyimpan informasi nomor kartu kredit lengkap Anda).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#00162d] mb-3">2. Penggunaan Informasi Pribadi</h2>
            <p className="text-slate-600 mb-2">
              Data yang dikumpulkan digunakan semata-mata untuk:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-slate-600">
              <li>Menyediakan akses layanan pembelajaran dan mengelola akun peserta Anda.</li>
              <li>Menerbitkan dan mengotentikasi sertifikat kelulusan resmi pada Portal Verifikasi Kredensial (/verify).</li>
              <li>Mengirimkan notifikasi pembaruan materi, jadwal webinar maritim, dan invoice pembayaran resmi.</li>
              <li>Meningkatkan kualitas antarmuka platform dan kestabilan sistem LMS DigiBlue.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#00162d] mb-3">3. Keamanan Data & Kerahasiaan</h2>
            <p className="text-slate-600">
              Kami menerapkan standar enkripsi Secure Socket Layer (SSL/TLS) dan proteksi basis data berlapis untuk mencegah akses tidak sah, pengubahan, atau kebocoran data. Kami tidak pernah memperjualbelikan atau menyewakan informasi pribadi Anda kepada pihak ketiga untuk kepentingan komersial di luar konsorsium.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#00162d] mb-3">4. Hak Pengguna atas Data Pribadi</h2>
            <p className="text-slate-600 mb-2">
              Sesuai dengan ketentuan undang-undang pelindungan data yang berlaku, Anda berhak untuk:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-slate-600">
              <li>Mengakses dan memperbarui data profil akun Anda kapan saja melalui dashboard siswa.</li>
              <li>Meminta salinan riwayat data kredensial dan sertifikasi yang Anda miliki.</li>
              <li>Mengajukan permohonan penonaktifan akun dengan menghubungi tim dukungan kami.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#00162d] mb-3">5. Kontak Pejabat Pelindungan Data (DPO)</h2>
            <p className="text-slate-600">
              Jika Anda memiliki pertanyaan mengenai tata kelola privasi dan keamanan data kami, Anda dapat menghubungi tim Data Protection Officer kami melalui email di <strong className="text-slate-800">halo@digibluecamp.id</strong>.
            </p>
          </section>
        </div>

        {/* Bottom Back Button */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors"
          >
            <Icon name="arrow-left" size={14} />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
