import type { NextConfig } from "next";

// Every page under (site)/[lang]/ is also requested WITHOUT the locale prefix
// in the wild -- people type and link /smartphones, not /de/smartphones. Those
// were returning 404: Search Console listed 40 such URLs as "Not found",
// including /smartphones, /laptops and /device-conditions. With only 18
// referring domains, throwing away an inbound link is expensive.
// 'impressum' is omitted because it already has an explicit redirect below.
const LOCALE_ROUTES = [
  'about', 'accessories', 'cart', 'checkout', 'contact', 'delivery-returns',
  'device-conditions', 'faq', 'gaming', 'gebrauchte-handys', 'gebrauchte-iphones',
  'iphone-17', 'laptops', 'open-box', 'privacy', 'repairs', 'smartphones',
  'store', 'tablets', 'terms', 'withdrawal', 'ratgeber/smartphone-laenger-nutzen',
] as const;

const localePrefixRedirects = LOCALE_ROUTES.flatMap((route) => [
  { source: `/${route}`, destination: `/de/${route}`, permanent: true },
  { source: `/${route}/:path*`, destination: `/de/${route}/:path*`, permanent: true },
]);

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    proxyClientMaxBodySize: '35mb',
  },
  
  // Generate unique build IDs to help with cache invalidation
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },

  // Image optimization settings
  images: {
    // Enable modern image formats for better compression
    formats: ['image/avif', 'image/webp'],
    localPatterns: [
      {
        pathname: '/uploads/**',
      },
      {
        pathname: '/branding/**',
      },
      {
        pathname: '/images/**',
      },
      {
        pathname: '/favicon.ico',
      },
    ],
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    // Image sizes for next/image
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimum cache TTL for optimized images (1 year)
    minimumCacheTTL: 31536000,
  },
  
  // 301s for legacy WordPress-era URLs still in Google's index (each maps to
  // the closest relevant page; never blanket-redirect everything to home).
  async redirects() {
    return [
      { source: '/urun/:slug*', destination: '/de/store', permanent: true },
      { source: '/product/:slug*', destination: '/de/store', permanent: true },
      { source: '/product-category/:path*', destination: '/de/store', permanent: true },
      { source: '/shop', destination: '/de/store', permanent: true },
      { source: '/shop/:path*', destination: '/de/store', permanent: true },
      { source: '/tech-help', destination: '/de/repairs', permanent: true },
      { source: '/tech-help/:path*', destination: '/de/repairs', permanent: true },
      { source: '/service/smartphone-reparatur', destination: '/de/repairs', permanent: true },
      { source: '/service/smartphone-reparatur/:path*', destination: '/de/repairs', permanent: true },
      { source: '/handy-reparatur-hamburg', destination: '/de/repairs', permanent: true },
      { source: '/smartphone-reparatur-hamburg', destination: '/de/repairs', permanent: true },
      { source: '/iphone-reparatur-hamburg', destination: '/de/repairs/apple', permanent: true },
      { source: '/category/:path*', destination: '/de/store', permanent: true },
      { source: '/team-member/:path*', destination: '/de/about', permanent: true },
      { source: '/home-onepage', destination: '/de', permanent: true },
      { source: '/contact-us', destination: '/de/contact', permanent: true },
      { source: '/kontakt', destination: '/de/contact', permanent: true },
      { source: '/about-us', destination: '/de/about', permanent: true },
      { source: '/our-team', destination: '/de/about', permanent: true },
      { source: '/impressum', destination: '/de/impressum', permanent: true },
      { source: '/privacy-policy', destination: '/de/privacy', permanent: true },
      { source: '/datenschutz', destination: '/de/privacy', permanent: true },
      { source: '/cdn-cgi/l/:path*', destination: '/de/contact', permanent: false },
      ...localePrefixRedirects,
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
