import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
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
        minio: false,
      };
    }
    return config;
  },
  serverExternalPackages: ['firebase-admin', 'minio'],
  experimental: {
  },
  transpilePackages: [
    'google-gax',
    'protobufjs',
    '@protobufjs/codegen',
    '@protobufjs/inquire',
    'lodash.clonedeep',
    'jwks-rsa'
  ]
};

export default nextConfig;
