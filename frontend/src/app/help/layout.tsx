import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pusat Bantuan & FAQ',
  description:
    'Temukan jawaban seputar pendaftaran pelatihan, pembayaran, pelaksanaan studi kasus, oral exam, dan penerbitan sertifikat resmi di DigiBlueCamp.',
  alternates: {
    canonical: '/help',
  },
  openGraph: {
    title: 'Pusat Bantuan & FAQ | DigiBlueCamp',
    description:
      'Panduan lengkap dan FAQ mengenai program pelatihan dan sertifikasi Blue Economy DigiBlueCamp.',
    url: '/help',
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
