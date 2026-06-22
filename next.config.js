/** @type {import('next').NextConfig} */
const nextConfig = {
  // BasePath: serves the app under /hq when proxied through Netlify
  // Set HQ_MODE=true on Railway to enable, or leave unset for root-level serving
  ...(process.env.HQ_MODE === 'true' ? { basePath: '/hq' } : {}),
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    scrollRestoration: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'munia-s3-bucket.s3.us-east-1.amazonaws.com',
        port: '',
      },
    ],
  },
};

module.exports = nextConfig;
