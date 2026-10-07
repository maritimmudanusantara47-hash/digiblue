import type { Metadata } from 'next';
import Script from 'next/script';
import PublicLayoutWrapper from '@/components/public/PublicLayoutWrapper';
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

import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="https://cdn.lineicons.com/5.0/lineicons.css" />
      </head>
      <body className="antialiased">
        <Script
          src={process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || 'https://app.sandbox.midtrans.com/snap/snap.js'}
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'Mid-client-iJaslbVJufkmXRhn'}
          strategy="afterInteractive"
        />
        <NextIntlClientProvider messages={messages}>
          <PublicLayoutWrapper>
            {children}
          </PublicLayoutWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
