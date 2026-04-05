const isDev = process.env.NODE_ENV === "development";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep dev and production artifacts separate so switching between
  // `next dev` and `next build` does not leave stale server chunks behind.
  distDir: isDev ? ".next-dev" : ".next",
  // World ID 4.0 packages load server-side assets that are safer to keep external
  // in production bundles, matching World's own Next.js template guidance.
  experimental: {
    serverComponentsExternalPackages: [
      "@worldcoin/idkit",
      "@worldcoin/idkit-core",
      "@worldcoin/idkit-server",
      "@worldcoin/minikit-js",
    ],
  },
};
module.exports = nextConfig;
