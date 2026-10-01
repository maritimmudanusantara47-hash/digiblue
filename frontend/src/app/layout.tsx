import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'DigiBlueCamp — Blue Economy Learning Platform',
    template: '%s | DigiBlueCamp',
  },
  description:
    'Platform pelatihan dan sertifikasi resmi Blue Economy bersama The Blue Economist International Association. Raih sertifikasi Foundation dan Specialization.',
  keywords: ['blue economy', 'sertifikasi', 'pelatihan', 'CBEc', 'The Blue Economist'],
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'DigiBlueCamp',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Script
          src={process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || 'https://app.sandbox.midtrans.com/snap/snap.js'}
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          strategy="lazyOnload"
        />
        {children}
      </body>
    </html>
  );
}
