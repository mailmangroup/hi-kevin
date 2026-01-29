/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Optimize compilation
  swcMinify: true,
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },
  // Enable experimental features for faster compilation
  experimental: {
    optimizePackageImports: ['recharts', 'framer-motion', 'lucide-react'],
  },
  env: {
    // Expose KAWO credentials to the client for local development
    // This allows the client-side API calls to work with .env.local
    KAWO_TOKEN: process.env.KAWO_TOKEN,
    KAWO_ORG_ID: process.env.KAWO_ORG_ID,
    KAWO_BRAND_ID: process.env.KAWO_BRAND_ID,
    KAWO_API_URL: process.env.KAWO_API_URL,
  },
}

module.exports = nextConfig
