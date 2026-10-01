import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login — DigiBlueCamp',
  description: 'Masuk ke akun DigiBlueCamp untuk mengakses pelatihan Blue Economy.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex gradient-hero">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-gold/10 blur-2xl" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center font-extrabold text-navy-dark text-lg">
              D
            </div>
            <span className="text-white font-extrabold text-xl tracking-tight">DigiBlueCamp</span>
          </div>
          <p className="text-white/50 text-sm">Blue Economy Learning Platform</p>
        </div>

        {/* Center quote */}
        <div className="relative z-10">
          <div className="w-10 h-1 bg-gold rounded-full mb-6" />
          <blockquote className="text-white text-2xl font-bold leading-snug mb-4">
            "Jadilah bagian dari ekonomi yang berkelanjutan untuk masa depan."
          </blockquote>
          <p className="text-white/50 text-sm">The Blue Economist International Association</p>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 flex gap-8">
          {[
            { number: '2000+', label: 'Peserta Terlatih' },
            { number: '11', label: 'Program Sertifikasi' },
            { number: '30+', label: 'Negara' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-gold font-extrabold text-2xl">{stat.number}</div>
              <div className="text-white/50 text-xs mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-gold font-extrabold">D</div>
            <span className="font-extrabold text-navy text-lg">DigiBlueCamp</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
