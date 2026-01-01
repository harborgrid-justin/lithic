/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // TypeScript - ignore build errors for next-auth v5 beta compatibility
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint - ignore build errors during build (warnings are informational only)
  eslint: {
    ignoreDuringBuilds: true,
  },

  //Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "lithic-healthcare-assets.s3.amazonaws.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // PWA Configuration
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=(self), payment=(self)",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.lithic.health wss://ws.lithic.health; worker-src 'self'; manifest-src 'self';",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=86400",
          },
        ],
      },
    ];
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // DICOM and medical imaging support
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    // HL7 message parsing
    config.module.rules.push({
      test: /\.hl7$/,
      type: "asset/source",
    });

    return config;
  },

  // Experimental features
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "app.lithic.health"],
      bodySizeLimit: "10mb", // For medical image uploads
    },
    instrumentationHook: true,
  },

  // Environment variables available to browser
  env: {
    NEXT_PUBLIC_APP_NAME: "Lithic",
    NEXT_PUBLIC_APP_VERSION: "1.0.0",
  },

  // Redirects for old routes
  async redirects() {
    return [
      {
        source: "/login",
        destination: "/auth/signin",
        permanent: true,
      },
      {
        source: "/register",
        destination: "/auth/signup",
        permanent: true,
      },
    ];
  },

  // Production optimizations
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Output configuration for containerization
  output: "standalone",
};

module.exports = nextConfig;
