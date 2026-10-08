"use client";

import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useLocale } from 'next-intl';

export default function LanguageSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const locale = useLocale();

  const changeLanguage = (newLocale: string) => {
    if (newLocale === locale) return;
    Cookies.set('NEXT_LOCALE', newLocale, { path: '/', expires: 365 });
    router.refresh();
    window.location.reload();
  };

  return (
    <div className={`flex items-center bg-slate-100 p-0.5 rounded-full border border-slate-200 ${className || ''}`}>
      <button 
        type="button"
        onClick={() => changeLanguage('id')}
        aria-label="Bahasa Indonesia"
        className={`px-3 py-1 text-xs rounded-full font-bold transition-all cursor-pointer ${
          locale === 'id' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-sky-600'
        }`}
      >
        ID
      </button>
      <button 
        type="button"
        onClick={() => changeLanguage('en')}
        aria-label="English"
        className={`px-3 py-1 text-xs rounded-full font-bold transition-all cursor-pointer ${
          locale === 'en' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-sky-600'
        }`}
      >
        EN
      </button>
    </div>
  );
}
