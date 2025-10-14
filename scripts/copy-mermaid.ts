#!/usr/bin/env tsx

import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const source: string = resolve("node_modules/mermaid/dist/mermaid.min.js");
const target: string = resolve("public/mermaid.min.js");

if (!existsSync(source)) {
  console.error("❌ Mermaid source file not found:", source);
  process.exit(1);
}

try {
  copyFileSync(source, target);
  console.log("✅ Mermaid library copied to public directory");
} catch (error) {
  console.error("❌ Failed to copy Mermaid library:", error);
  process.exit(1);
}
