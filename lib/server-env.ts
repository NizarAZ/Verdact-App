import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readLocalEnv(key: string) {
  const envPath = join(process.cwd(), ".env.local");

  if (!existsSync(envPath)) {
    return undefined;
  }

  const line = readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.startsWith(`${key}=`));

  if (!line) {
    return undefined;
  }

  return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "");
}

export function readServerEnv(key: string) {
  return readLocalEnv(key) || process.env[key];
}
