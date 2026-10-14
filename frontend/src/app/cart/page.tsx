'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CartRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/student/cart');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
