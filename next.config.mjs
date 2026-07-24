/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdf-parse e libs de extração só rodam no server
  experimental: { serverComponentsExternalPackages: ['pdf-parse', 'mammoth', 'xlsx'] },
  webpack: (config, { dev }) => {
    // Workaround só no Windows: discos exFAT/FAT não suportam symlink/readlink,
    // o que quebra o build de produção do webpack ("EISDIR readlink").
    // No deploy Linux (Vercel) nada disso é aplicado — usa os padrões (mais rápido).
    if (process.platform === 'win32' && !dev) {
      config.resolve.symlinks = false;
      config.cache = false;
    }
    return config;
  },
};
export default nextConfig;
