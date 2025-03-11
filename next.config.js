/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Ignore les problèmes ESLint en production (temporairement)
    ignoreDuringBuilds: true,
  },
  // Configuration pour fonctionner correctement derrière un proxy HTTPS
  poweredByHeader: false
};

module.exports = nextConfig;
