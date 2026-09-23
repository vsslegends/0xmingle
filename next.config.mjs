/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== "production";

// Wallet + media endpoints the app legitimately talks to.
const CONNECT = [
  "'self'",
  "ws:",
  "wss:",
  "https://api.giphy.com",
  "https://media1.giphy.com",
  "https://media2.giphy.com",
  "https://media3.giphy.com",
  "https://media4.giphy.com",
  "https://media.giphy.com",
  "https://translate.googleapis.com",
  "wss://relay.walletconnect.com",
  "wss://relay.walletconnect.org",
  "https://explorer-api.walletconnect.com",
  "https://pulse.walletconnect.org",
  "https://api.web3modal.org",
  "https://rpc.testnet.chain.robinhood.com",
  "https://rpc.mainnet.chain.robinhood.com",
].join(" ");

const SCRIPT = isDev
  ? "'self' 'unsafe-inline' 'unsafe-eval'"
  : "'self' 'unsafe-inline'";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "frame-src 'self'",
  `script-src ${SCRIPT}`,
  "style-src 'self' 'unsafe-inline'",
  "worker-src 'self'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src ${CONNECT}`,
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Voice notes + video need mic/camera on our own pages only.
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=(), payment=()",
  },
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]),
];

const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
