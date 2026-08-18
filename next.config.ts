import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // 1. Dominio de Supabase (El que ya pusimos)
      {
        protocol: 'https',
        hostname: 'xmmuqwwfdnqvdreskrsj.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // 2. NUEVO Dominio de Unsplash (Para las imágenes de prueba)
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**', // Autoriza cualquier ruta dentro de unsplash
      },
    ],
  },
};

export default nextConfig;