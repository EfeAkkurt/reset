/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@adapters/core', '@shared/core', '@stellar/freighter-api', '@jsr/creit-tech__stellar-wallets-kit'],
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    esmExternals: "loose",
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  webpack: (config, { isServer }) => {
    // Exclude better-sqlite3 from browser bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
      config.externals = {
        ...config.externals,
        'better-sqlite3': 'commonjs better-sqlite3',
      };
    }

    return config;
  },
};

module.exports = nextConfig;