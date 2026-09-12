/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@autosite/shared", "@autosite/ui"],
};

export default nextConfig;
