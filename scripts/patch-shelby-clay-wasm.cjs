const fs = require("node:fs");
const path = require("node:path");

const distDir = path.join(process.cwd(), "node_modules", "@shelby-protocol", "clay-codes", "dist");
const loaderPath = path.join(distDir, "index-node.js");
const wasmPath = path.join(distDir, "clay.wasm");

if (!fs.existsSync(loaderPath) || !fs.existsSync(wasmPath)) {
  console.warn("[verdact] Shelby clay-codes package not found; skipping WASM loader patch.");
  process.exit(0);
}

const marker = "const VERDACT_EMBEDDED_CLAY_WASM_BASE64";
let source = fs.readFileSync(loaderPath, "utf8");

if (source.includes(marker)) {
  console.log("[verdact] Shelby clay-codes WASM loader already patched.");
  process.exit(0);
}

const wasmBase64 = fs.readFileSync(wasmPath).toString("base64");
const importNeedle = 'import { readFile } from "fs/promises";';
const throwNeedle = `  if (!bytes) {
    throw new Error(\`Unable to locate clay.wasm. Tried: \${paths.join(", ")}\`);
  }`;
const fallback = `  if (!bytes) {
    bytes = Buffer.from(VERDACT_EMBEDDED_CLAY_WASM_BASE64, "base64");
  }`;

if (!source.includes(importNeedle) || !source.includes(throwNeedle)) {
  throw new Error("[verdact] Shelby clay-codes loader shape changed; patch was not applied.");
}

source = source.replace(
  importNeedle,
  `${importNeedle}\nconst VERDACT_EMBEDDED_CLAY_WASM_BASE64 = "${wasmBase64}";`
);
source = source.replace(throwNeedle, fallback);

fs.writeFileSync(loaderPath, source);
console.log("[verdact] Patched Shelby clay-codes WASM loader for serverless runtime.");
