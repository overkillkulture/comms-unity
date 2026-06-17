/** @type {import('next').NextConfig} */
const nextConfig = {
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
