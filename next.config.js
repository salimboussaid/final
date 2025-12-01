/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '212.220.105.29',
        port: '8079',
        pathname: '/api/**',
      },
    ],
  },
  // Optional: Use Next.js rewrites as a fallback if CORS issues persist
  async rewrites() {
    return [
      {
        source: '/proxy-api/:path*',
        destination: 'http://212.220.105.29:8079/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig
