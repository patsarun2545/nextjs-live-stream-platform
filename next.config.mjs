/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compression (Next.js จัดการ gzip อัตโนมัติ)
  compress: true,

  // Static file cache headers
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;