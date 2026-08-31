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

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self' https://www.paypal.com https://www.sandbox.paypal.com",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com https://connect.facebook.net https://analytics.tiktok.com https://www.google.com https://www.gstatic.com https://apis.google.com https://invitejs.trustpilot.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com https://www.gstatic.com https://*.googleusercontent.com https://maps.gstatic.com https://maps.googleapis.com https://www.facebook.com https://analytics.tiktok.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.stripe.com https://r.stripe.com https://m.stripe.network https://*.paypal.com https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://www.google.com https://*.google.com https://connect.facebook.net https://www.facebook.com https://analytics.tiktok.com https://*.tiktok.com https://cloudflareinsights.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://*.stripe.com https://www.google.com https://*.paypal.com https://widget.trustpilot.com",
  "worker-src 'self' blob:",
  "media-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    proxyClientMaxBodySize: '25mb',
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
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=(), usb=(), payment=(self "https://js.stripe.com" "https://hooks.stripe.com" "https://www.paypal.com" "https://www.sandbox.paypal.com")'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
