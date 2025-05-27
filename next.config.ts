import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    // Handle Node.js built-in modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        http2: false,
        process: false,
        stream: false,
        util: false,
        buffer: false,
        crypto: false,
        path: false,
        os: false,
        http: false,
        https: false,
        zlib: false,
      };
    }
    return config;
  },
  // Exclude firebase-admin from Edge Runtime (moved from experimental.serverComponentsExternalPackages)
  serverExternalPackages: ['firebase-admin'],
  experimental: {
    // Add any experimental features here
  },
  // Transpile packages that need to be processed by Next.js
  transpilePackages: [
    // Firebase-admin related packages that need transpilation
    'google-gax',
    'protobufjs',
    '@protobufjs/codegen',
    '@protobufjs/inquire',
    'lodash.clonedeep',
    'jwks-rsa'
  ]
};

export default nextConfig;
