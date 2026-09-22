/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
  async redirects() {
    return [
      { source: "/studio", destination: "/", permanent: false },
      { source: "/studio/:path*", destination: "/", permanent: false },
    ];
  },
};
export default nextConfig;
