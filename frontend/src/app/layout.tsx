import type { Metadata } from 'next';
import Script from 'next/script';
import PublicLayoutWrapper from '@/components/public/PublicLayoutWrapper';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://digibluecamp.id';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'DigiBlueCamp — Platform Kursus & Sertifikasi Blue Economy Resmi',
    template: '%s | DigiBlueCamp',
  },
  description:
    'Platform edukasi dan sertifikasi ekonomi biru (Blue Economy) terdepan di Indonesia bersama The Blue Economist International Association dan Maritim Muda Nusantara. Program Foundation & Specialization terakreditasi.',
  keywords: [
    'blue economy',
    'ekonomi biru',
    'sertifikasi blue economy',
    'kursus ekonomi biru',
    'pelatihan maritim',
    'CBEc',
    'Certified Blue Economist',
    'The Blue Economist',
    'Maritim Muda Nusantara',
    'karbon biru',
    'blue carbon',
    'bioteknologi laut',
    'perikanan berkelanjutan',
    'maritime certification',
    'sertifikat maritim online',
  ],
  authors: [{ name: 'DigiBlueCamp' }, { name: 'Maritim Muda Nusantara' }],
  creator: 'DigiBlueCamp & Maritim Muda Nusantara',
  publisher: 'DigiBlueCamp',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: '/',
    siteName: 'DigiBlueCamp',
    title: 'DigiBlueCamp — Platform Kursus & Sertifikasi Blue Economy Resmi',
    description:
      'Tingkatkan kompetensi dan raih sertifikat resmi Certified Blue Economist (CBEc) bersama The Blue Economist International Association dan Maritim Muda Nusantara.',
    images: [
      {
        url: '/images/indonesia_ocean_backdrop.jpg',
        width: 1200,
        height: 630,
        alt: 'DigiBlueCamp — Blue Economy Learning & Certification Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DigiBlueCamp — Platform Kursus & Sertifikasi Blue Economy Resmi',
    description:
      'Platform edukasi dan sertifikasi ekonomi biru terdepan di Indonesia bersama The Blue Economist International Association.',
    images: ['/images/indonesia_ocean_backdrop.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'DigiBlueCamp',
    url: siteUrl,
    logo: `${siteUrl}/images/hero_maritim_muda_transparent.png`,
    description: 'Platform edukasi dan sertifikasi resmi Blue Economy terkemuka di Indonesia.',
    sameAs: [
      'https://www.linkedin.com/company/maritim-muda-nusantara',
      'https://www.instagram.com/maritimmuda.id',
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'DigiBlueCamp',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/courses?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600&family=Space+Grotesk:wght@400..700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="https://cdn.lineicons.com/5.0/lineicons.css" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="antialiased">
        <Script
          src={process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || 'https://app.sandbox.midtrans.com/snap/snap.js'}
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'Mid-client-iJaslbVJufkmXRhn'}
          strategy="afterInteractive"
        />
        <NextIntlClientProvider messages={messages} locale={locale}>
          <PublicLayoutWrapper>
            {children}
          </PublicLayoutWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
