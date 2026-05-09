import WatchClient from './WatchClient';

// Next.js SSR — ดึง video data ฝั่ง server เพื่อ inject meta tags
export async function generateMetadata({ params }) {
  try {
    const res = await fetch(
      `${process.env.SITE_URL}/api/videos/${params.slug}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return { title: 'ไม่พบ stream' };
    const { video } = await res.json();
    return {
      title:       video.title,
      description: video.metaDescription || video.description,
      openGraph: {
        title:       video.title,
        description: video.metaDescription,
        images:      video.thumbnail ? [video.thumbnail] : [],
        type:        'video.other',
      },
      twitter: { card: 'summary_large_image', title: video.title },
      alternates: { canonical: `${process.env.SITE_URL}/watch/${params.slug}` },
    };
  } catch {
    return { title: 'StreamLive' };
  }
}

// เพิ่ม JSON-LD ใน layout หรือ page component
export default function WatchPage({ params }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type':    'VideoObject',
            name:       'ชื่อ stream',     // ดึงจาก video data
            description: '...',
            // ดึงค่าจริงจาก generateMetadata หรือ fetch ซ้ำ
          }),
        }}
      />
      <WatchClient slug={params.slug} />
    </>
  );
}