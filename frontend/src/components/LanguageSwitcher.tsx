"use client";

import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useLocale } from 'next-intl';

export default function LanguageSwitcher() {
  const router = useRouter();
  const locale = useLocale();

  const changeLanguage = (newLocale: string) => {
    Cookies.set('NEXT_LOCALE', newLocale, { path: '/', expires: 365 });
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={() => changeLanguage('id')}
        className={`px-2 py-1 text-sm rounded-md transition-colors ${locale === 'id' ? 'bg-blue-600 text-white font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
      >
        ID
      </button>
      <button 
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 text-sm rounded-md transition-colors ${locale === 'en' ? 'bg-blue-600 text-white font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
      >
        EN
      </button>
    </div>
  );
}
