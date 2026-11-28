/** @type {import('next').NextConfig} */
// Report-only: the browser logs violations to the console but blocks nothing. Tighten later, once the log is clean.
// 'unsafe-eval' is only needed by the Next dev server, so it is left out of production builds.
// YouTube is listed because the Shadowing page loads the YouTube IFrame API and embeds clips.
const isProd = process.env.NODE_ENV === "production";
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isProd ? "" : "'unsafe-eval' "}https://accounts.google.com https://apis.google.com https://www.youtube.com https://s.ytimg.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "connect-src 'self' https: wss:",
  "frame-src https://accounts.google.com https://www.youtube.com https://www.youtube-nocookie.com",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Same value as vercel.json (DENY) and as frame-ancestors 'none': nothing may frame the app.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // The app needs the microphone and camera on its own origin; everything else stays off.
          { key: "Permissions-Policy", value: "microphone=(self), camera=(self), geolocation=(), payment=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
