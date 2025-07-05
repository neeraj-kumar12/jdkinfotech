/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      }
    ]
  },

  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,

  env: {
    NEXT_PUBLIC_SITE_NAME: 'JDK Infotech',
    NEXT_PUBLIC_BASE_URL: process.env.NODE_ENV === 'production' ? 'https://jdkinfotech.in' : 'http://localhost:3000',
  }
};

export default nextConfig;