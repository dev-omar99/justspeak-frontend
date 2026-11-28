/** @type {import('next').NextConfig} */
// Report-only: the browser logs violations to the console but blocks nothing. Tighten later, once the log is clean.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "connect-src 'self' https: wss:",
  "frame-src https://accounts.google.com",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY }] }];
  },
};

module.exports = nextConfig;
