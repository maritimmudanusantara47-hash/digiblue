import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer className="bg-navy-dark text-white/60 text-sm mt-auto">
      <div className="container py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-9 h-9 rounded-xl bg-gold flex items-center justify-center text-navy-dark font-extrabold">D</span>
            <span className="font-extrabold text-white text-lg">DigiBlueCamp</span>
          </div>
          <p className="max-w-sm leading-relaxed">
            Platform kursus dan sertifikasi online Blue Economy bersama The Blue Economist International Association.
          </p>
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
  );
}
