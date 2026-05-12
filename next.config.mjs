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
  }
};

export default nextConfig;
