import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost"
  ],
  experimental: {
    outputFileTracingIncludes: {
      "/api/**/*": [
        "./node_modules/@shelby-protocol/clay-codes/dist/clay.wasm"
      ]
    },
    serverComponentsExternalPackages: [
      "@xenova/transformers",
      "onnxruntime-node",
      "pdf-parse",
      "sharp"
    ]
  },
  webpack(config, { isServer }) {
    if (isServer) {
      config.resolve.alias["@shelby-protocol/clay-codes"] = path.resolve(
        process.cwd(),
        "lib/shelby-clay-codes.mjs"
      );
    }

    return config;
  }
};

export default nextConfig;
