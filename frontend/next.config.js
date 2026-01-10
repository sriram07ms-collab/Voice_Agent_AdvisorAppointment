/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable static export for GitHub Pages
  output: process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true' ? 'export' : undefined,
  // Disable image optimization for static export
  images: process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true' ? {
    unoptimized: true
  } : undefined,
  // Set base path for GitHub Pages (if using custom domain, set to '/')
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  // Set asset prefix for GitHub Pages
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || '',
}

module.exports = nextConfig













