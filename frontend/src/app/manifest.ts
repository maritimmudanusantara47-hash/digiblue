import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DigiBlueCamp — Blue Economy Learning & Certification Platform',
    short_name: 'DigiBlueCamp',
    description: 'Platform pelatihan dan sertifikasi resmi Blue Economy bersama The Blue Economist International Association dan Maritim Muda Nusantara.',
    start_url: '/',
    display: 'standalone',
    background_color: '#021528',
    theme_color: '#002D5B',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
