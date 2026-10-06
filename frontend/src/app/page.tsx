import Icon from '@/components/Icon';
import Link from 'next/link';
import type { Metadata } from 'next';
import LandingCourseTabs from '@/components/landing/LandingCourseTabs';

export const metadata: Metadata = {
  title: 'DigiBlueCamp — Kursus & Sertifikasi Blue Economy Online',
  description:
    'Kursus online Blue Economy dengan sertifikat yang bisa diverifikasi. Foundation Level & Specialization bersama The Blue Economist International Association.',
};

const stats = [
  { num: '3.000+', label: 'peserta terlatih', sub: 'di 30+ negara' },
  { num: '12', label: 'program sertifikasi', sub: 'Foundation & Specialization' },
  { num: '100%', label: 'sertifikat terverifikasi', sub: 'QR code & ID unik' },
];

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
];

const faqs = [
  { q: 'Bagaimana cara memulai kursus?', a: 'Buat akun peserta, pilih program Foundation atau Specialization, lalu daftar. Setelah enrollment aktif, kamu bisa langsung membuka modul pembelajaran.' },
  { q: 'Apakah pemberi kerja bisa memverifikasi sertifikat saya?', a: 'Ya. Setiap sertifikat memiliki ID unik dan QR code yang mengarah ke halaman verifikasi resmi, sehingga siapa pun dapat memeriksa keasliannya.' },
  { q: 'Apakah ada syarat pengetahuan awal?', a: 'Tidak. Foundation Level dirancang untuk pemula. Kamu hanya butuh browser dan motivasi untuk belajar.' },
  { q: 'Apa itu Foundation dan Specialization?', a: 'Foundation (CBEc) membahas dasar Blue Economy lengkap dengan ujian dan field study. Specialization adalah 10 jalur peminatan mendalam, seperti Blue Carbon, Blue Finance, dan Blue Energy.' },
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

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="container flex items-center justify-between h-[72px]">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center text-gold font-extrabold">D</span>
            <span className="font-extrabold text-navy-dark text-lg tracking-tight">DigiBlueCamp</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-navy-dark" aria-label="Navigasi utama">
            <a href="/" className="hover:text-navy-light">Home</a>
            <a href="#kursus" className="hover:text-navy-light">Kursus</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:inline text-sm font-semibold text-navy-dark hover:text-navy-light">Masuk</Link>
            <Link href="/register" className="btn btn-primary btn-sm">Daftar</Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 to-white">
          <div className="absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full bg-navy-light/10 blur-3xl" />
          <div className="container relative grid lg:grid-cols-2 gap-12 items-center py-16 lg:py-24">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-bold text-navy bg-white border border-slate-200 rounded-full px-3 py-1 mb-5 shadow-sm">
                <Icon name="water-drop-1" size={14} className="text-navy-light" /> Blue Economy · Online · Bersertifikat
              </span>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-navy-dark leading-[1.1] mb-4">
                Kuasai keahlian<br />
                <span className="text-navy-light">ekonomi biru.</span>
              </h1>
              <p className="text-lg font-semibold text-navy mb-3">Praktis. Terverifikasi. Terjangkau.</p>
              <p className="text-slate-600 max-w-lg mb-8">
                Kursus online Blue Economy dari pemula hingga spesialis. Selesaikan program dan dapatkan sertifikat yang bisa diverifikasi pemberi kerja secara online.
              </p>
              <div className="flex flex-wrap gap-3 mb-8">
                <a href="#kursus" className="btn btn-primary btn-lg">Pilih Kursus</a>
                <a href="#harga" className="btn btn-lg border-2 border-slate-200 text-navy-dark hover:bg-slate-50">Apa yang Kamu Dapat</a>
              </div>
              <ul className="flex flex-col gap-2 text-sm text-slate-600">
                {['Akses sertifikat seumur hidup', 'Tanpa prasyarat, mulai kapan saja', 'Sertifikat dengan ID & QR code'].map(t => (
                  <li key={t} className="flex items-center gap-2">
                    <Icon name="check-circle-1" size={16} className="text-emerald-500" /> {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="rounded-3xl gradient-hero p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute -bottom-10 -right-10 w-56 h-56 rounded-full bg-gold/20 blur-2xl" />
                <Icon name="certificate-badge-1" size={56} className="text-gold mb-5" />
                <p className="text-xs uppercase tracking-widest text-white/60 mb-1">Certified Blue Economist</p>
                <h2 className="text-2xl font-extrabold mb-4 text-white">CBEc — Foundation Level</h2>
                <ul className="flex flex-col gap-2.5 text-sm text-white/80 mb-6">
                  <li className="flex items-center gap-2"><Icon name="book-1" size={15} className="text-gold" /> Modul pembelajaran interaktif</li>
                  <li className="flex items-center gap-2"><Icon name="clipboard" size={15} className="text-gold" /> Ujian pilihan ganda & studi kasus</li>
                  <li className="flex items-center gap-2"><Icon name="water-drop-1" size={15} className="text-gold" /> Field Study lapangan</li>
                </ul>
                <Link href="/register" className="btn btn-gold btn-sm">Mulai Foundation <Icon name="arrow-right" size={14} className="ml-1.5" /></Link>
              </div>
              <div className="hidden sm:flex absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-xl border border-slate-100 px-4 py-3 items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><Icon name="check-circle-1" size={20} /></span>
                <div>
                  <p className="text-sm font-bold text-navy-dark leading-none">Terverifikasi</p>
                  <p className="text-xs text-slate-500">theblueeconomist.org</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="container relative pb-14">
            <div className="grid sm:grid-cols-3 gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              {stats.map(s => (
                <div key={s.label} className="text-center sm:border-r last:border-r-0 border-slate-100">
                  <div className="text-3xl font-extrabold text-navy-dark">{s.num}</div>
                  <div className="text-sm font-semibold text-slate-700">{s.label}</div>
                  <div className="text-xs text-slate-400">{s.sub}</div>
                </div>
              ))}
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

        {/* Courses */}
        <section id="kursus" className="container py-20 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl font-extrabold text-navy-dark mb-3">Pilih program dan mulai hari ini.</h2>
            <p className="text-slate-500">Setiap program memiliki modul, ujian, dan sertifikat yang dapat diverifikasi.</p>
          </div>
          <LandingCourseTabs />
          <p className="text-center text-sm text-slate-500 mt-10">
            Selesaikan Foundation untuk membuka jalur Specialization.{' '}
            <Link href="/register" className="font-bold text-navy hover:underline">Lihat semua program</Link>
          </p>
        </section>

        {/* Why */}
        <section className="bg-navy-dark text-white">
          <div className="container py-20 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-white mb-4">Keahlian yang membuatmu selangkah lebih maju.</h2>
              <p className="text-white/70 mb-8">
                Laut adalah sumber pertumbuhan ekonomi berkelanjutan. Kami mengajarkan keahlian yang dibutuhkan industri maritim, kebijakan, dan keuangan biru — langsung ke intinya.
              </p>
              <a href="#kursus" className="btn btn-gold btn-lg">Temukan Kursusmu</a>
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
              <p className="text-slate-600 mb-6">Tanpa biaya tersembunyi. Nikmati akses materi pembelajaran seumur hidup hanya dengan sekali bayar.</p>
              <div className="inline-flex items-center gap-3 bg-white rounded-2xl border border-slate-200 px-5 py-3 shadow-sm">
                <Icon name="medal-1" size={26} className="text-navy" />
                <div>
                  <p className="text-xs text-slate-500">Sertifikasi Profesional</p>
                  <p className="font-extrabold text-navy-dark">Akses Penuh Selamanya</p>
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
              <li><a href="/" className="hover:text-white">Home</a></li>
              <li><a href="#kursus" className="hover:text-white">Kursus</a></li>
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

