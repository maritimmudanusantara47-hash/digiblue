import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DigiBlueCamp — Platform Sertifikasi Blue Economy Resmi',
  description: 'Raih sertifikasi Blue Economy internasional bersama The Blue Economist International Association. Foundation Level & 10 Specialization Track tersedia.',
};

export default function LandingPage() {
  const features = [
    { icon: '🌊', title: 'Kurikulum Resmi',       desc: 'Materi dirancang bersama The Blue Economist International Association' },
    { icon: '🏅', title: 'Sertifikat Terverifikasi', desc: 'QR Code mengarah langsung ke database internasional theblueeconomist.org' },
    { icon: '📱', title: 'Belajar Kapan Saja',     desc: 'Akses materi PDF, video, dan kuis kapanpun dari perangkat apapun' },
    { icon: '🎓', title: 'Program Beasiswa',       desc: 'Tersedia beasiswa Fully Funded dan Partial untuk peserta terpilih' },
  ];

  const programs = [
    { code: 'FND',  name: 'Foundation Level',        desc: 'Program dasar CBEc untuk memahami ekosistem Blue Economy secara komprehensif', count: '1 Program' },
    { code: 'SPEC', name: 'Specialization Level',    desc: '10 jalur peminatan mendalam dari Blue Carbon hingga Blue Finance', count: '10 Program' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-gold font-extrabold text-sm">D</div>
            <span className="font-extrabold text-navy text-lg">DigiBlueCamp</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"    className="btn btn-outline btn-sm">Masuk</Link>
            <Link href="/register" className="btn btn-primary btn-sm">Daftar Gratis</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="gradient-hero py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-gold/10 blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-64 h-64 rounded-full bg-navy-light/30 blur-3xl" />
        </div>
        <div className="container relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-white/80 text-sm mb-6">
            <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
            Resmi bersama The Blue Economist International Association
          </div>
          <h1 className="text-white font-extrabold mb-6 leading-tight">
            Raih Sertifikasi<br />
            <span className="text-gold">Blue Economy</span> Internasional
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-10">
            Platform pembelajaran dan sertifikasi resmi untuk menjadi <strong className="text-white">Certified Blue Economist (CBEc)</strong>.
            Foundation Level & 10 jalur Specialization tersedia.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/register" className="btn btn-gold btn-lg animate-glow">
              Mulai Sekarang — Gratis
            </Link>
            <Link href="/login" className="btn btn-lg border border-white/30 text-white hover:bg-white/10">
              Sudah Punya Akun
            </Link>
          </div>

          {/* Stats bar */}
          <div className="flex justify-center gap-12 mt-16 flex-wrap">
            {[['2000+', 'Peserta Terlatih'], ['11', 'Program Sertifikasi'], ['30+', 'Negara'], ['100%', 'Diakui Internasional']].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-extrabold text-gold">{num}</div>
                <div className="text-white/60 text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 container">
        <div className="text-center mb-12">
          <h2 className="text-navy-dark mb-3">Kenapa Memilih DigiBlueCamp?</h2>
          <p className="text-slate-500 max-w-xl mx-auto text-sm">Platform LMS modern yang dirancang khusus untuk ekosistem Blue Economy Indonesia dan dunia</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(f => (
            <div key={f.title} className="card text-center hover:-translate-y-1 transition-all duration-200">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-base font-bold text-navy-dark mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Programs */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-navy-dark mb-3">Program Sertifikasi</h2>
            <p className="text-slate-500 text-sm">Pilih jalur sertifikasi yang sesuai dengan tujuan karirmu</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {programs.map(p => (
              <div key={p.code}
                className="card border-2 hover:border-navy/30 hover:-translate-y-1 transition-all duration-200 cursor-pointer group">
                <span className="badge badge-navy mb-3">{p.count}</span>
                <h3 className="text-lg font-bold text-navy-dark mb-2 group-hover:text-navy transition-colors">{p.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
                <Link href="/register" className="btn btn-primary btn-sm mt-4 inline-flex">
                  Daftar Program →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gradient-navy text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,168,32,0.1)_0%,transparent_70%)]" />
        <div className="container relative z-10">
          <h2 className="text-white mb-4">Siap Memulai Perjalananmu?</h2>
          <p className="text-white/60 text-sm mb-8 max-w-lg mx-auto">
            Bergabunglah dengan 2000+ peserta dari 30+ negara yang telah mendapatkan sertifikasi Blue Economy internasional.
          </p>
          <Link href="/register" className="btn btn-gold btn-lg animate-glow">
            Daftar Sekarang — 100% Gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-dark py-8 text-center text-white/40 text-sm">
        <div className="container">
          <p>© 2026 DigiBlueCamp x The Blue Economist International Association. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
