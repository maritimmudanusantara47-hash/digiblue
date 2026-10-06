import Icon from '@/components/Icon';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DigiBlueCamp — Kursus & Sertifikasi Blue Economy Online',
  description:
    'Kursus online Blue Economy dengan sertifikat yang bisa diverifikasi. Foundation Level & Specialization bersama The Blue Economist International Association.',
};

const certPoints = [
  { icon: 'file-multiple', title: 'PDF instan', desc: 'Terbit otomatis setelah lulus. Unduh, cetak, atau bagikan.' },
  { icon: 'shield-2-check', title: 'Dapat diverifikasi pemberi kerja', desc: 'ID unik & QR code bisa dicek online dalam hitungan detik.' },
  { icon: 'linkedin', title: 'Siap untuk CV & LinkedIn', desc: 'Tunjukkan keahlian Blue Economy-mu di tempat rekruter mencari.' },
  { icon: 'layers-1', title: 'Bertingkat', desc: 'Mulai dari Foundation, lanjut ke 11 jalur Specialization.' },
];

const included = [
  'Modul pembelajaran PDF interaktif langsung di browser',
  'Ujian pilihan ganda & studi kasus essay',
  'Field Study / Training Course lapangan (Foundation)',
  'Sertifikat PDF dengan ID & QR code yang dapat diverifikasi',
  'Akses di perangkat apa pun, tanpa instal aplikasi',
  'Peluang beasiswa Fully Funded & Partial',
];

const faqs = [
  { q: 'Bagaimana cara memulai kursus?', a: 'Buat akun peserta, pilih program Foundation atau Specialization, lalu daftar. Setelah enrollment aktif, kamu bisa langsung membuka modul pembelajaran.' },
  { q: 'Apakah pemberi kerja bisa memverifikasi sertifikat saya?', a: 'Ya. Setiap sertifikat memiliki ID unik dan QR code yang mengarah ke halaman verifikasi resmi, sehingga siapa pun dapat memeriksa keasliannya.' },
  { q: 'Apakah ada syarat pengetahuan awal?', a: 'Tidak. Foundation Level dirancang untuk pemula. Kamu hanya butuh browser dan motivasi untuk belajar.' },
  { q: 'Apa itu Foundation dan Specialization?', a: 'Foundation (CBEc) membahas dasar Blue Economy lengkap dengan ujian dan field study. Specialization adalah 10 jalur peminatan mendalam, seperti Blue Carbon, Blue Finance, dan Blue Energy.' },
  { q: 'Apakah tersedia beasiswa?', a: 'Tersedia. Ajukan surat motivasi dari dashboard peserta; admin akan memutuskan Fully Funded, Partial, atau tidak lolos.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-700">
      {/* Top bar */}
      <div className="bg-navy-dark text-white/80 text-xs">
        <div className="container flex items-center justify-between h-9">
          <span className="flex items-center gap-2">
            <Icon name="shield-2-check" size={14} className="text-gold" />
            Resmi bersama The Blue Economist International Association
          </span>
          <span className="hidden sm:flex items-center gap-4">
            <a href="#sertifikat" className="hover:text-white">Tentang Sertifikat</a>
            <a href="#faq" className="hover:text-white">Bantuan</a>
          </span>
        </div>
      </div>

      {/* Header (IBMI Style) */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200/80 shadow-xs">
        <div className="container flex items-center justify-between h-[76px]">
          {/* Logo & Institute Brand Title */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-navy-dark text-white flex items-center justify-center p-2 border border-slate-200 shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
              <Icon name="certificate-badge-1" size={24} className="text-gold" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-navy-dark text-sm sm:text-base tracking-tight leading-tight uppercase font-heading">
                DigiBlue
              </span>
              <span className="font-semibold text-slate-500 text-[11px] tracking-wider uppercase">
                Center for Maritime Education
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-navy-dark" aria-label="Navigasi utama">
            <Link href="/" className="text-navy hover:text-sky-600 transition-colors">
              Beranda
            </Link>
            <Link href="/courses" className="hover:text-sky-600 flex items-center gap-1 transition-colors">
              Kursus
            </Link>
          </nav>

          {/* Right Action Buttons: LOGIN / REGISTER + Cart */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="px-4 sm:px-5 py-2 rounded-xl text-xs font-extrabold tracking-wider uppercase border border-sky-300 bg-sky-50/80 hover:bg-sky-100 text-sky-700 transition-colors shadow-xs"
            >
              Login / Register
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section (IBMI Style dengan Nuansa Lautan Indonesia) */}
        <section
          className="relative overflow-hidden bg-navy-dark text-white pt-14 pb-20 lg:pt-20 lg:pb-28"
          style={{
            backgroundImage: `linear-gradient(105deg, rgba(3, 21, 39, 0.94) 0%, rgba(4, 31, 57, 0.88) 55%, rgba(6, 45, 79, 0.65) 100%), url('/images/indonesia_ocean_backdrop.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Subtle ocean depth radial lights */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-10 w-96 h-96 rounded-full bg-sky-400/15 blur-3xl pointer-events-none" />

          <div className="container relative z-10 grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Column: Headline, Subtitle, CTA, Value Checklist */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-extrabold text-white leading-[1.1] tracking-tight mb-5">
                Kuasai keahlian maritim masa depan.<br />
                <span className="text-[#38bdf8]">Dalam hitungan jam, bukan tahun.</span>
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-slate-200/90 max-w-xl leading-relaxed mb-8">
                Kursus online ekonomi biru & maritim intensif 2–3 jam, 100% online, lengkap dengan sertifikat digital resmi yang dapat diverifikasi oleh industri & institusi global.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 mb-8">
                <Link
                  href="/courses"
                  className="px-7 py-3.5 rounded-full bg-[#00a3e0] hover:bg-[#0284c7] text-white font-bold text-sm tracking-wide shadow-lg shadow-sky-500/30 transition-all inline-flex items-center gap-2 group"
                >
                  <span>Pilih Kursus Kamu</span>
                  <Icon name="arrow-right" size={15} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="#harga"
                  className="px-6 py-3.5 rounded-full border border-white/30 hover:border-white/60 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm backdrop-blur-sm transition-all"
                >
                  Apa yang Kamu Dapat
                </a>
              </div>

              {/* Value proposition checklist */}
              <div className="flex flex-col gap-2.5 text-xs sm:text-sm text-slate-200">
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                  <span><strong className="text-white">Mulai dari Rp 150rb</strong>, termasuk sertifikat ber-QR code & ID unik</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                  <span><strong className="text-white">Tanpa prasyarat</strong>, mulai belajar mandiri kapan saja dari perangkat apa pun</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Professionals Photo + Floating Dual-Pill Stat Badge */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-end items-end pt-4 lg:pt-0">
              <div className="relative w-full max-w-md lg:max-w-none rounded-3xl overflow-hidden shadow-2xl border border-white/15 bg-navy-dark/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/hero_professionals.jpg"
                  alt="Peserta & Profesional Maritim DigiBlueCamp"
                  className="w-full h-auto object-cover object-top"
                />
                {/* Soft bottom vignette blend */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#031527] via-transparent to-transparent opacity-50" />
              </div>

              {/* Floating dual-pill badge anchored at the bottom (Like IBMI) */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-2 z-20 bg-white rounded-full p-2.5 px-4 sm:px-5 shadow-2xl border border-slate-100 flex items-center gap-3 sm:gap-5 text-navy-dark animate-fadeup whitespace-nowrap">
                {/* Left pill stat */}
                <div className="flex items-center gap-2.5 sm:gap-3 pr-3 sm:pr-4 border-r border-slate-200">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                    <Icon name="globe" size={17} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs sm:text-sm font-extrabold text-navy-dark leading-tight">3.000+ peserta</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-500">di 39 provinsi & global</p>
                  </div>
                </div>

                {/* Right pill stat */}
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                    <Icon name="thumbs-up" size={17} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs sm:text-sm font-extrabold text-navy-dark leading-tight">98% merekomendasikan</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-500">survei alumni 2026</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Partners */}
        <section className="border-y border-slate-100 bg-slate-50/60">
          <div className="container py-8 flex flex-col md:flex-row items-center gap-6 md:gap-12">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 shrink-0">Didukung oleh</p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-navy font-bold opacity-80">
              <span className="flex items-center gap-2"><Icon name="globe-1" size={20} /> The Blue Economist International Association</span>
              <span className="flex items-center gap-2"><Icon name="flag-1" size={20} /> SDG 14 — Life Below Water</span>
              <span className="flex items-center gap-2"><Icon name="anchor" size={20} /> Maritim Muda Nusantara</span>
            </div>
          </div>
        </section>

        {/* Program Tracks Overview (Mapped to Admin Course Catalog) */}
        <section className="container py-20">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold tracking-wider uppercase text-navy bg-navy/5 px-3 py-1 rounded-full">
              Jalur Pembelajaran
            </span>
            <h2 className="text-3xl font-extrabold text-navy-dark mt-3 mb-3">Pilihan Program Sesuai Kebutuhan Karier</h2>
            <p className="text-slate-500 text-sm sm:text-base">
              Setiap program terintegrasi dengan modul silabus komprehensif, evaluasi terstandarisasi, dan sertifikat yang dapat diverifikasi global.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Track 1: International Certification */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-navy/10 text-navy flex items-center justify-center mb-6">
                  <Icon name="graduation-cap-1" size={24} />
                </div>
                <span className="inline-block text-[11px] font-bold text-navy bg-navy/10 px-2.5 py-0.5 rounded-full mb-3">
                  INTERNATIONAL TRACK
                </span>
                <h3 className="text-xl font-bold text-navy-dark mb-3">International Certification</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
                  Meliputi <strong>Foundation Level (CBEc)</strong> dan <strong>10 Jalur Specialization</strong> (Blue Carbon, Finance, Energy, Circular Economy, dsb.) bersama The Blue Economist International Association.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
                  <li className="flex items-center gap-2">
                    <Icon name="check-circle-1" size={14} className="text-emerald-500 shrink-0" />
                    <span>Ujian sertifikasi online & studi kasus</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="check-circle-1" size={14} className="text-emerald-500 shrink-0" />
                    <span>Terbit sertifikat internasional theblueeconomist.org</span>
                  </li>
                </ul>
              </div>
              <Link href="/courses" className="btn btn-secondary w-full text-xs font-bold justify-center">
                Lihat Kursus Internasional →
              </Link>
            </div>

            {/* Track 2: National Training Course */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                  <Icon name="flag-1" size={24} />
                </div>
                <span className="inline-block text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full mb-3">
                  NATIONAL TRACK
                </span>
                <h3 className="text-xl font-bold text-navy-dark mb-3">National Training Course</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
                  Pelatihan berstandar nasional bersama Maritim Muda Nusantara yang memadukan teori industri maritim, studi kasus regulasi, dan implementasi lapangan.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
                  <li className="flex items-center gap-2">
                    <Icon name="check-circle-1" size={14} className="text-emerald-500 shrink-0" />
                    <span>Kurikulum nasional maritim Indonesia</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="check-circle-1" size={14} className="text-emerald-500 shrink-0" />
                    <span>Sertifikat kelulusan pelatihan resmi</span>
                  </li>
                </ul>
              </div>
              <Link href="/courses" className="btn btn-secondary w-full text-xs font-bold justify-center">
                Lihat National Training →
              </Link>
            </div>

            {/* Track 3: Single Modul Course */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
                  <Icon name="book-1" size={24} />
                </div>
                <span className="inline-block text-[11px] font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full mb-3">
                  MODULAR TRACK
                </span>
                <h3 className="text-xl font-bold text-navy-dark mb-3">Single Modul Course</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
                  Modul mandiri tematik yang fokus pada topik spesifik. Ideal untuk memperdalam kompetensi teknis tanpa perlu mengambil program sertifikasi penuh sekaligus.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
                  <li className="flex items-center gap-2">
                    <Icon name="check-circle-1" size={14} className="text-emerald-500 shrink-0" />
                    <span>Fleksibel, belajar mandiri kapan saja</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="check-circle-1" size={14} className="text-emerald-500 shrink-0" />
                    <span>Materi padat & aplikatif per topik</span>
                  </li>
                </ul>
              </div>
              <Link href="/courses" className="btn btn-secondary w-full text-xs font-bold justify-center">
                Lihat Single Modul →
              </Link>
            </div>
          </div>

          {/* CTA to Full Catalog */}
          <div className="mt-14 text-center bg-gradient-to-r from-sky-50 via-slate-50 to-amber-50/40 rounded-3xl p-8 border border-slate-200/80">
            <h4 className="text-lg font-bold text-navy-dark mb-2">Ingin melihat daftar lengkap silabus dan harga?</h4>
            <p className="text-slate-500 text-xs sm:text-sm mb-6 max-w-xl mx-auto">
              Semua kursus aktif dan silabus yang dikelola secara live dapat Anda cari dan filter di halaman Katalog Kursus.
            </p>
            <Link
              href="/courses"
              className="btn btn-primary btn-lg inline-flex items-center gap-2 shadow-lg shadow-navy/20"
            >
              <Icon name="books-2" size={18} />
              <span>Buka Katalog Lengkap Kursus</span>
              <Icon name="arrow-right" size={16} />
            </Link>
          </div>
        </section>

        {/* Why */}
        <section className="bg-navy-dark text-white">
          <div className="container py-20 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-white mb-4">Keahlian yang membuatmu selangkah lebih maju.</h2>
              <p className="text-white/70 mb-8">
                Laut adalah sumber pertumbuhan ekonomi berkelanjutan. Kami mengajarkan keahlian yang dibutuhkan industri maritim, kebijakan, dan keuangan biru — langsung ke intinya.
              </p>
              <Link href="/courses" className="btn btn-gold btn-lg">Temukan Kursusmu</Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['14', 'SDG 14 jadi dasar kurikulum Foundation'],
                ['10', 'jalur Specialization mendalam'],
                ['3', 'jenis asesmen: MCQ, essay, field study'],
                ['1', 'database sertifikat internasional'],
              ].map(([n, t]) => (
                <div key={t} className="rounded-2xl bg-white/5 border border-white/10 p-5">
                  <div className="text-4xl font-extrabold text-gold mb-1">{n}</div>
                  <p className="text-sm text-white/70">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Certificate */}
        <section id="sertifikat" className="container py-20 scroll-mt-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-navy-dark mb-4">Sertifikat yang benar-benar bisa kamu pakai.</h2>
              <p className="text-slate-600 mb-6">
                Selesaikan program dan sertifikat diterbitkan atas namamu, lengkap dengan ID unik yang dapat dicek siapa pun secara online.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/register" className="btn btn-primary">Mulai Belajar</Link>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {certPoints.map(p => (
                <div key={p.title} className="rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <span className="w-11 h-11 rounded-xl bg-sky-50 text-navy flex items-center justify-center mb-3"><Icon name={p.icon} size={20} /></span>
                  <h3 className="font-bold text-navy-dark mb-1 text-sm">{p.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Included */}
        <section id="harga" className="bg-sky-50 scroll-mt-24">
          <div className="container py-20 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-navy-dark mb-4">Satu program. Semuanya sudah termasuk.</h2>
              <p className="text-slate-600 mb-6">Tanpa biaya tersembunyi. Ajukan beasiswa dari dashboard dan biaya program bisa ditanggung sebagian atau penuh.</p>
              <div className="inline-flex items-center gap-3 bg-white rounded-2xl border border-slate-200 px-5 py-3 shadow-sm">
                <Icon name="graduation-cap-1" size={26} className="text-navy" />
                <div>
                  <p className="text-xs text-slate-500">Program Beasiswa</p>
                  <p className="font-extrabold text-navy-dark">Fully Funded & Partial</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-lg">
              <h3 className="font-bold text-navy-dark mb-4">Yang kamu dapatkan</h3>
              <ul className="flex flex-col gap-3">
                {included.map(i => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                    <Icon name="check-circle-1" size={18} className="text-emerald-500 mt-0.5 shrink-0" /> {i}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="btn btn-primary w-full mt-6 justify-center">Pilih Program</Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="container py-20 max-w-3xl scroll-mt-24">
          <h2 className="text-3xl font-extrabold text-navy-dark text-center mb-10">Jawaban singkat</h2>
          <div className="flex flex-col gap-3">
            {faqs.map(f => (
              <details key={f.q} className="group bg-white border border-slate-200 rounded-2xl px-6 py-4 open:shadow-md">
                <summary className="flex items-center justify-between cursor-pointer font-semibold text-navy-dark list-none">
                  {f.q}
                  <Icon name="chevron-down" size={16} className="text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="text-sm text-slate-600 leading-relaxed mt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="container pb-20">
          <div className="gradient-hero rounded-3xl text-center text-white px-6 py-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,168,32,0.15)_0%,transparent_70%)]" />
            <div className="relative">
              <h2 className="text-3xl font-extrabold text-white mb-3">Keahlian barumu hanya beberapa jam lagi.</h2>
              <p className="text-white/70 mb-8">Program praktis dengan sertifikat yang dapat diverifikasi.</p>
              <Link href="/register" className="btn btn-gold btn-lg">Daftar Sekarang</Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-navy-dark text-white/60 text-sm">
        <div className="container py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-9 h-9 rounded-xl bg-gold flex items-center justify-center text-navy-dark font-extrabold">D</span>
              <span className="font-extrabold text-white text-lg">DigiBlueCamp</span>
            </div>
            <p className="max-w-sm leading-relaxed">Platform kursus dan sertifikasi online Blue Economy bersama The Blue Economist International Association.</p>
          </div>
          <div>
            <h3 className="text-white font-bold mb-3 text-sm">Platform</h3>
            <ul className="flex flex-col gap-2">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
              <li><Link href="/courses" className="hover:text-white">Kursus</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold mb-3 text-sm">Akun</h3>
            <ul className="flex flex-col gap-2">
              <li><Link href="/login" className="hover:text-white">Masuk</Link></li>
              <li><Link href="/register" className="hover:text-white">Daftar</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="container py-5 flex flex-col sm:flex-row justify-between gap-2 text-xs">
            <p>© 2026 DigiBlueCamp x The Blue Economist International Association. All rights reserved.</p>
            <p>Mendukung SDG 14 — Life Below Water</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
