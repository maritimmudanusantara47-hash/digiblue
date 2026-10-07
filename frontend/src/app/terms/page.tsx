'use client';

import Link from 'next/link';
import Icon from '@/components/Icon';

export default function TermsPage() {
  return (
    <div className="bg-[#f9f9ff] min-h-screen text-slate-700 py-12 sm:py-16">
      <div className="container max-w-4xl">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-navy transition-colors">
            Beranda
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Syarat & Ketentuan</span>
        </div>

        {/* Card Header */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-bold uppercase tracking-wider mb-4 border border-sky-200">
            <Icon name="shield-2" size={14} />
            <span>Ketentuan Layanan Resmi DigiBlue</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#00162d] tracking-tight mb-4">
            Syarat & Ketentuan Layanan
          </h1>
          <p className="text-sm text-slate-500">
            Terakhir diperbarui: 15 Februari 2026 • Berlaku untuk seluruh pengguna platform DigiBlue LMS
          </p>
        </div>

        {/* Legal Body */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-[#00162d] mb-3">1. Ketentuan Umum</h2>
            <p className="text-slate-600 mb-3">
              Selamat datang di DigiBlue, platform pembelajaran dan sertifikasi resmi hasil konsorsium antara The Blue Economist International Association, Maritim Muda Nusantara, dan Indonesia Blue Economy Center (IBEC). Dengan mendaftar, mengakses, atau menggunakan layanan kami, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan yang tercantum dalam dokumen ini.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#00162d] mb-3">2. Pendaftaran Akun & Tanggung Jawab Pengguna</h2>
            <p className="text-slate-600 mb-2">
              Pengguna diwajibkan memberikan informasi identitas yang akurat, lengkap, dan terkini saat melakukan pendaftaran. Nama yang Anda cantumkan pada saat pendaftaran akun akan digunakan secara permanen sebagai nama pemegang pada sertifikat kelulusan resmi.
            </p>
            <p className="text-slate-600">
              Anda bertanggung jawab penuh atas kerahasiaan kata sandi akun Anda dan segala aktivitas yang dilakukan melalui akun tersebut. Dilarang keras memindahtangankan akun atau membagikan kredensial login kepada pihak ketiga.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#00162d] mb-3">3. Ketentuan Transaksi & Pembayaran</h2>
            <p className="text-slate-600 mb-2">
              Seluruh transaksi pembayaran pelatihan diproses secara aman melalui payment gateway resmi Midtrans. Biaya yang tertera sudah termasuk akses materi modul digital, fasilitas ujian kompetensi, serta penerbitan sertifikat digital terverifikasi.
            </p>
            <p className="text-slate-600">
              Pembayaran yang telah berhasil tidak dapat dibatalkan atau dikembalikan (non-refundable), kecuali jika terjadi kendala teknis dari pihak sistem kami yang mengakibatkan akses pembelajaran tidak dapat diberikan sama sekali.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#00162d] mb-3">4. Hak Cipta & Kekayaan Intelektual</h2>
            <p className="text-slate-600">
              Seluruh silabus, naskah kurikulum, modul bacaan, video, studi kasus, logo, dan instrumen penilaian merupakan kekayaan intelektual terdaftar milik Konsorsium DigiBlue dan dilindungi undang-undang hak cipta. Pengguna hanya diberikan lisensi terbatas, non-eksklusif, dan tidak dapat dipindahtangankan untuk keperluan belajar pribadi. Dilarang menggandakan, mendistribusikan ulang, atau mengkomersialkan materi pembelajaran tanpa izin tertulis.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#00162d] mb-3">5. Integritas Akademik & Ujian Sertifikasi</h2>
            <p className="text-slate-600 mb-2">
              Peserta wajib menjunjung tinggi integritas akademik selama mengikuti asesmen dan ujian kelulusan Certified Blue Economist (CBEc). Segala bentuk kecurangan atau penggunaan jasa joki ujian akan berakibat pada diskualifikasi kepesertaan dan pembatalan sertifikat secara permanen dari basis data nasional.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#00162d] mb-3">6. Hubungi Kami</h2>
            <p className="text-slate-600">
              Jika Anda memiliki pertanyaan mengenai Syarat dan Ketentuan ini, silakan hubungi kami melalui email di <strong className="text-slate-800">halo@digibluecamp.id</strong> atau kunjungi <Link href="/help" className="text-sky-600 underline font-semibold">Pusat Bantuan</Link>.
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
