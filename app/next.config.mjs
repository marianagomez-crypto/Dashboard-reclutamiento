/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.airtableusercontent.com' },
      { protocol: 'https', hostname: 'dl.airtable.com' },
    ],
  },
  // En dev (Windows) la caché de webpack en disco a veces se corrompe
  // (errores "Cannot read properties of undefined (reading 'call')" y
  // fallos de rename de .pack.gz). La desactivamos en desarrollo para estabilidad.
  webpack: (config, { dev }) => {
    if (dev) config.cache = false;
    return config;
  },
};

export default nextConfig;
