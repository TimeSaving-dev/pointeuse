/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Ignore les problèmes ESLint en production (temporairement)
    ignoreDuringBuilds: true,
  }
};

module.exports = nextConfig;
