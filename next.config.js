/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.externals.push('canvas', 'pdfkit');
    return config;
  },
};

module.exports = nextConfig;
