import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan Layanan',
  description:
    'Ketentuan dan syarat resmi penggunaan platform pembelajaran dan sertifikasi DigiBlueCamp.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
