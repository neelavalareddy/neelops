const isDev = process.env.NODE_ENV === "development";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep dev and production artifacts separate so switching between
  // `next dev` and `next build` does not leave stale server chunks behind.
  distDir: isDev ? ".next-dev" : ".next",
};
module.exports = nextConfig;
