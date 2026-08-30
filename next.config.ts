import type { NextConfig } from "next";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

// Dev email/pdf preview pages need to embed iframes from the same origin
const DEV_PREVIEW_CSP = CSP
  .replace("frame-src 'none'", "frame-src 'self'")
  .replace("object-src 'none'", "object-src 'self'");

const nextConfig: NextConfig = {
  experimental: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      // Base rule — applied to every route
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
      // Dev preview UI pages — must be after the base rule to override it
      // Allows embedding same-origin iframes (email srcdoc + PDF API)
      {
        source: "/dev/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: DEV_PREVIEW_CSP },
        ],
      },
      // Dev API responses — allow same-origin embedding (for the preview iframe)
      {
        source: "/api/dev/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: DEV_PREVIEW_CSP },
        ],
      },
    ];
  },
};

export default nextConfig;
