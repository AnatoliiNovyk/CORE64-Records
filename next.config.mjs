/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
  async redirects() {
    return [
      { source: "/studio", destination: "/", permanent: true },
      { source: "/studio/:path*", destination: "/", permanent: true },
    ];
  },
};
export default nextConfig;
