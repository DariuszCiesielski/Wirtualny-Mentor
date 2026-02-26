import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
});

const nextConfig: NextConfig = {
  turbopack: {
    root: '.',
  },
  // mammoth uses native Node.js APIs — keep as external
  serverExternalPackages: ['mammoth'],
  experimental: {
    // Tree-shaking for icon libraries
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Modern image formats + Supabase Storage signed URLs
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/sign/**',
      },
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
