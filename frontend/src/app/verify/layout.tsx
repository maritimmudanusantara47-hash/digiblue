import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verifikasi Keaslian Sertifikat CBEc',
  description:
    'Layanan verifikasi publik keaslian sertifikat Certified Blue Economist (CBEc) DigiBlueCamp. Periksa nomor seri sertifikat dan validasi akreditasi secara instan.',
  keywords: [
    'verifikasi sertifikat cbec',
    'cek sertifikat blue economist',
    'validasi sertifikat maritim',
    'certificate verification digibluecamp',
  ],
  alternates: {
    canonical: '/verify',
  },
  openGraph: {
    title: 'Verifikasi Keaslian Sertifikat CBEc | DigiBlueCamp',
    description:
      'Layanan verifikasi publik keaslian sertifikat Certified Blue Economist (CBEc) DigiBlueCamp.',
    url: '/verify',
  },
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
