import type { Metadata } from 'next';

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

  try {
    const res = await fetch(`${apiUrl}/courses/${slug}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      const course = json.data;
      if (course) {
        const title = `${course.title} — Sertifikasi Blue Economy`;
        const description =
          course.description?.slice(0, 160) ||
          `Pelajari dan raih sertifikat resmi untuk ${course.title} di DigiBlueCamp. Program komprehensif bersama The Blue Economist.`;

        return {
          title,
          description,
          alternates: {
            canonical: `/courses/${slug}`,
          },
          openGraph: {
            title,
            description,
            url: `/courses/${slug}`,
            type: 'article',
          },
          twitter: {
            card: 'summary_large_image',
            title,
            description,
          },
        };
      }
    }
  } catch {
    // fallback
  }

  return {
    title: 'Program Kursus Blue Economy',
    description: 'Pelatihan dan sertifikasi resmi Blue Economy di DigiBlueCamp.',
  };
}

export default async function CourseDetailLayout({ children, params }: Props) {
  const { slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://digibluecamp.id';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

  let courseSchema: Record<string, unknown> | null = null;
  try {
    const res = await fetch(`${apiUrl}/courses/${slug}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      const course = json.data;
      if (course) {
        courseSchema = {
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: course.title,
          description: course.description || `${course.title} di DigiBlueCamp`,
          provider: {
            '@type': 'EducationalOrganization',
            name: 'DigiBlueCamp',
            sameAs: siteUrl,
          },
          hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'online',
          },
          offers: {
            '@type': 'Offer',
            category: 'Paid',
            price: course.price || 0,
            priceCurrency: 'IDR',
          },
        };
      }
    }
  } catch {
    // ignore
  }

  return (
    <>
      {courseSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
        />
      )}
      {children}
    </>
  );
}
