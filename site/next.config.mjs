/** @type {import('next').NextConfig} */
const nextConfig = {
  // Case studies are static pages with relative image paths, so they need the trailing slash.
  trailingSlash: true,
  poweredByHeader: false,
  async rewrites() {
    return { beforeFiles: [{ source: "/work/:slug/", destination: "/work/:slug/index.html" }] };
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
