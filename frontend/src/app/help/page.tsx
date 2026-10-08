'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { useTranslations } from 'next-intl';

interface FaqItem {
  category: 'account' | 'payment' | 'exam' | 'lms';
  categoryLabel: string;
  q: string;
  a: string;
}

export default function HelpCenterPage() {
  const t = useTranslations('HelpPage');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Form states
  const [ticketName, setTicketName] = useState('');
  const [ticketEmail, setTicketEmail] = useState('');
  const [ticketPhone, setTicketPhone] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Pembayaran & Midtrans');
  const [ticketMessage, setTicketMessage] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');

  const categories = useMemo(() => [
    { id: 'all', label: t('cat_all'), icon: 'layout-9' },
    { id: 'account', label: t('cat_account'), icon: 'user-4' },
    { id: 'payment', label: t('cat_payment'), icon: 'credit-card-multiple' },
    { id: 'exam', label: t('cat_exam'), icon: 'certificate-badge-1' },
    { id: 'lms', label: t('cat_lms'), icon: 'book-1' },
  ], [t]);

  const allFaqs: FaqItem[] = useMemo(() => [
    {
      category: 'account',
      categoryLabel: t('cat_account'),
      q: 'Bagaimana cara membuat akun pembelajar di DigiBlue?',
      a: 'Klik tombol "Daftar" di sudut kanan atas halaman. Masukkan nama lengkap sesuai identitas resmi Anda, email aktif, negara asal, dan kata sandi. Setelah pendaftaran selesai, akun Anda langsung aktif dan dapat digunakan untuk memilih kursus.',
    },
    {
      category: 'account',
      categoryLabel: t('cat_account'),
      q: 'Bagaimana jika saya lupa kata sandi akun?',
      a: 'Pada halaman Masuk (Login), klik tautan "Lupa Kata Sandi". Masukkan alamat email Anda, dan sistem akan mengirimkan tautan pemulihan kata sandi ke kotak masuk email Anda.',
    },
    {
      category: 'payment',
      categoryLabel: t('cat_payment'),
      q: 'Metode pembayaran apa saja yang didukung oleh DigiBlue?',
      a: 'DigiBlue terintegrasi secara resmi dengan payment gateway Midtrans. Kami menerima transfer Bank Virtual Account (BCA, Mandiri, BNI, BRI, Permata), QRIS (GoPay, OVO, ShopeePay, Dana), serta Kartu Kredit/Debit berlogo Visa dan Mastercard.',
    },
    {
      category: 'payment',
      categoryLabel: t('cat_payment'),
      q: 'Apakah verifikasi pembayaran berlangsung otomatis?',
      a: 'Ya, seluruh transaksi melalui sistem Midtrans terkonfirmasi secara real-time dalam hitungan detik. Modul kursus Anda akan langsung terbuka secara otomatis di dashboard peserta segera setelah pembayaran berhasil.',
    },
    {
      category: 'payment',
      categoryLabel: t('cat_payment'),
      q: 'Bagaimana cara mendapatkan invoice resmi untuk institusi atau perusahaan?',
      a: 'Setiap transaksi berhasil akan menghasilkan invoice digital dengan rincian PPN yang dapat diunduh langsung dari Dashboard Siswa bagian Riwayat Pembayaran. Jika memerlukan invoice khusus institusi, hubungi halo@digibluecamp.id.',
    },
    {
      category: 'exam',
      categoryLabel: t('cat_exam'),
      q: 'Kapan saya bisa mengikuti ujian kelulusan (assessment)?',
      a: 'Anda dapat mengikuti ujian kapan saja secara fleksibel setelah menyelesaikan seluruh modul bacaan dan materi pelatihan yang ditentukan pada dashboard LMS Anda.',
    },
    {
      category: 'exam',
      categoryLabel: t('cat_exam'),
      q: 'Berapa nilai kelulusan minimal (passing grade) untuk mendapatkan sertifikat?',
      a: 'Nilai kelulusan standar untuk program Foundation Level dan Specialization adalah 70%. Jika belum mencapai nilai kelulusan, Anda diberikan kesempatan remedial untuk mengulang ujian.',
    },
    {
      category: 'exam',
      categoryLabel: t('cat_exam'),
      q: 'Bagaimana cara memverifikasi keaslian sertifikat yang telah saya dapatkan?',
      a: 'Setiap sertifikat resmi DigiBlue dilengkapi Nomor Seri Kredensial unik dan QR Code. Siapa pun dapat memverifikasinya melalui halaman Portal Verifikasi di /verify dengan mengetikkan nomor seri atau memindai kode QR.',
    },
    {
      category: 'lms',
      categoryLabel: t('cat_lms'),
      q: 'Apakah materi kursus dapat diakses seumur hidup (lifetime)?',
      a: 'Ya, seluruh peserta yang telah terdaftar pada program pelatihan memiliki akses berkelanjutan terhadap materi modul bacaan dan pembaruan silabus di masa mendatang tanpa biaya tambahan.',
    },
    {
      category: 'lms',
      categoryLabel: t('cat_lms'),
      q: 'Apakah LMS DigiBlue dapat diakses melalui smartphone?',
      a: 'Ya, antarmuka DigiBlue sepenuhnya responsif dan dioptimalkan untuk dibuka di smartphone Android, iOS, tablet, maupun laptop tanpa perlu mengunduh aplikasi tambahan dari Play Store atau App Store.',
    },
  ], [t]);

  const filteredFaqs = useMemo(() => {
    return allFaqs.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.q.toLowerCase().includes(q) ||
        item.a.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [allFaqs, selectedCategory, searchQuery]);

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketName || !ticketEmail || !ticketMessage) return;

    setIsSubmittingTicket(true);
    setTimeout(() => {
      setIsSubmittingTicket(false);
      setTicketSubmitted(true);
      setTicketNumber(`TKT-${Math.floor(100000 + Math.random() * 900000)}`);
    }, 800);
  };

  const handleResetTicketForm = () => {
    setTicketSubmitted(false);
    setTicketName('');
    setTicketEmail('');
    setTicketPhone('');
    setTicketMessage('');
  };

  return (
    <div className="bg-[#f9f9ff] min-h-screen text-slate-700">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#00162d] via-[#0f2b48] to-[#00162d] text-white py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-sky-500 rounded-full filter blur-[100px] opacity-25" />
          <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-cyan-400 rounded-full filter blur-[100px] opacity-20" />
        </div>

        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-xs font-semibold tracking-wider uppercase text-sky-200 mb-6 font-mono">
              <Icon name="headphone-1" size={15} className="text-amber-400" />
              <span>{t('badge')}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight font-heading">
              {t('title')}
            </h1>
            <p className="text-slate-300 text-base sm:text-lg mb-10 leading-relaxed font-normal">
              {t('desc')}
            </p>

            {/* Live Search Box */}
            <div className="relative max-w-2xl mx-auto shadow-2xl">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon name="search-1" size={20} />
              </span>
              <input
                id="help-faq-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full h-14 pl-14 pr-24 bg-white text-slate-900 placeholder:text-slate-400 text-sm sm:text-base font-medium rounded-2xl sm:rounded-3xl border border-white/50 focus:outline-none focus:ring-4 focus:ring-sky-400/20 shadow-lg"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer font-mono"
                >
                  {t('btn_clear')}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills & Interactive Filters */}
      <section className="container py-10 -mt-6 relative z-20">
        <div className="flex items-center justify-center flex-wrap gap-2.5 bg-white p-2 rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200/80 max-w-4xl mx-auto">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setActiveFaq(null);
                }}
                className={`px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer font-heading ${
                  isActive
                    ? 'bg-[#00162d] text-white shadow-md shadow-navy/20 scale-[1.02]'
                    : 'text-slate-600 hover:text-navy hover:bg-slate-100'
                }`}
              >
                <Icon name={cat.icon} size={15} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* FAQ Accordion List */}
      <section className="container py-8 sm:py-12 max-w-4xl">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#00162d] font-heading">
              {t('faq_title')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {t('faq_showing')} {filteredFaqs.length} {t('faq_articles')}
            </p>
          </div>
          {searchQuery && (
            <span className="text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full">
              {t('faq_search_for')} &quot;{searchQuery}&quot;
            </span>
          )}
        </div>

        {filteredFaqs.length > 0 ? (
          <div className="space-y-3.5">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-sky-200 transition-colors"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 hover:text-sky-600 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                      <span className="text-sm sm:text-base leading-snug">{faq.q}</span>
                    </div>
                    <span
                      className={`text-slate-400 transition-transform shrink-0 ${
                        isOpen ? 'rotate-180 text-sky-600' : ''
                      }`}
                    >
                      <Icon name="chevron-down" size={16} />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-slate-600 text-sm leading-relaxed border-t border-slate-100 bg-slate-50/50">
                      <p>{faq.a}</p>
                      <div className="mt-3.5 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-400">
                        <span>{t('faq_category')} {faq.categoryLabel}</span>
                        <span className="text-emerald-600 font-semibold">{t('faq_synced')}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <Icon name="search-1" size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {t('empty_title')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6">
              {t('empty_desc')} &quot;{searchQuery}&quot;. {t('empty_sub')}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              {t('btn_reset')}
            </button>
          </div>
        )}
      </section>

      {/* Support Ticket & Helpdesk Contact */}
      <section className="container py-14 sm:py-20 border-t border-slate-200/80">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 max-w-6xl mx-auto">
          {/* Left Column: Direct Contact Info (span 5) */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-100/70 px-3 py-1 rounded-full mb-3 inline-block font-mono">
                {t('contact_badge')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#00162d] tracking-tight mb-4 font-heading">
                {t('contact_title')}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-8">
                {t('contact_desc')}
              </p>

              <div className="space-y-4">
                {/* WhatsApp */}
                <a
                  href="https://wa.me/6285710914949"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Icon name="whatsapp" size={24} />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block font-mono">
                      {t('wa_title')}
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                      +62 857-1091-4949
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {t('wa_desc')}
                    </span>
                  </div>
                </a>

                {/* Email */}
                <a
                  href="mailto:halo@digibluecamp.id"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-sky-400 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Icon name="envelope-1" size={20} />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-700 block font-mono">
                      {t('email_title')}
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                      halo@digibluecamp.id
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {t('email_desc')}
                    </span>
                  </div>
                </a>

                {/* Office Info */}
                <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200/80 text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800 flex items-center gap-2">
                    <Icon name="buildings-1" size={14} className="text-slate-500" />
                    <span>{t('office_title')}</span>
                  </p>
                  <p>Indonesia Blue Economy Center (IBEC), Kampus C STIE Indonesia</p>
                  <p>Jalan Pratekan No. 9A, Rawamangun, Jakarta Timur 13220</p>
                  <p className="text-slate-400 pt-1">{t('office_hours')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Support Ticket Form (span 7) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl">
              {ticketSubmitted ? (
                <div className="text-center py-10 animate-fadeup">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                    <Icon name="check-circle-1" size={32} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full mb-2 inline-block font-mono">
                    {t('success_badge')}
                  </span>
                  <h3 className="text-2xl font-extrabold text-[#00162d] mb-2 font-heading">
                    {t('success_title')}
                  </h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto mb-4 leading-relaxed">
                    {t('success_ref')}{' '}
                    <span className="font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {ticketNumber}
                    </span>
                    . {t('success_sent_to')} <strong className="text-slate-900">{ticketEmail}</strong>.
                  </p>
                  <button
                    onClick={handleResetTicketForm}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    {t('btn_new_ticket')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#00162d] mb-1 font-heading">
                      {t('form_title')}
                    </h3>
                    <p className="text-xs text-slate-500 mb-5">
                      {t('form_desc')}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        {t('lbl_name')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="ticket-name"
                        type="text"
                        required
                        value={ticketName}
                        onChange={(e) => setTicketName(e.target.value)}
                        placeholder={t('ph_name')}
                        className="h-11 px-3.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all"
                      />
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        {t('lbl_email')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="ticket-email"
                        type="email"
                        required
                        value={ticketEmail}
                        onChange={(e) => setTicketEmail(e.target.value)}
                        placeholder="nama@email.com"
                        className="h-11 px-3.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* WhatsApp */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        {t('lbl_phone')}
                      </label>
                      <input
                        id="ticket-phone"
                        type="tel"
                        value={ticketPhone}
                        onChange={(e) => setTicketPhone(e.target.value)}
                        placeholder="0812-xxxx-xxxx"
                        className="h-11 px-3.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all"
                      />
                    </div>

                    {/* Category */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        {t('lbl_cat')} <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="ticket-category"
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value)}
                        className="h-11 px-3.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all"
                      >
                        <option value="Pembayaran & Midtrans">{t('cat_payment')}</option>
                        <option value="Pendaftaran & Akun">{t('cat_account')}</option>
                        <option value="Ujian & Sertifikat CBEc">{t('cat_exam')}</option>
                        <option value="Akses Materi LMS">{t('cat_lms')}</option>
                        <option value="Kemitraan Institusi / Kampus">Kemitraan Institusi / Kampus</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      {t('lbl_msg')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="ticket-message"
                      required
                      rows={4}
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder={t('ph_msg')}
                      className="p-3.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    id="btn-submit-ticket"
                    type="submit"
                    disabled={isSubmittingTicket}
                    className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-[#0f2b48] font-bold text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-heading"
                  >
                    {isSubmittingTicket ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-[#0f2b48]" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        <span>{t('btn_submitting')}</span>
                      </>
                    ) : (
                      <>
                        <span>{t('btn_submit')}</span>
                        <Icon name="arrow-right" size={15} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Direct link back to courses or verification */}
      <section className="bg-slate-100/70 border-t border-slate-200/80 py-8 text-center text-xs text-slate-500">
        <div className="container flex items-center justify-center gap-6 flex-wrap">
          <Link href="/courses" className="hover:text-navy font-semibold transition-colors">
            {t('footer_courses')}
          </Link>
          <span>•</span>
          <Link href="/verify" className="hover:text-navy font-semibold transition-colors">
            {t('footer_verify')}
          </Link>
          <span>•</span>
          <Link href="/about" className="hover:text-navy font-semibold transition-colors">
            {t('footer_about')}
          </Link>
        </div>
      </section>
    </div>
  );
}
