import { execFileSync } from "node:child_process";

const SITE_PATH_PREFIXES = ["src/", "public/", "assets/", "scripts/"];
const SITE_FILES = new Set([
  ".node-version",
  "astro.config.ts",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "tsconfig.json",
  "vercel.json",
]);

const previousRevision = process.env.VERCEL_GIT_PREVIOUS_SHA || "HEAD^";

function changedFiles() {
  const output = execFileSync(
    "git",
    ["diff", "--name-only", previousRevision, "HEAD", "--"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );

  return output.split(/\r?\n/u).filter(Boolean);
}

function affectsSite(file) {
  return (
    SITE_FILES.has(file) ||
    SITE_PATH_PREFIXES.some(prefix => file.startsWith(prefix))
  );
}

try {
  const files = changedFiles();

  if (files.some(affectsSite)) {
    process.stdout.write(
      "Deployable site files changed; continue with the Vercel build.\n"
    );
    // Vercel continues the build when the Ignore Command exits with 1.
    process.exit(1);
  }

  process.stdout.write(
    "No deployable site files changed; skip the Vercel build.\n"
  );
  // Vercel skips the build when the Ignore Command exits with 0.
  process.exit(0);
} catch (error) {
  process.stderr.write(
    `Could not determine the changed files; continue with the Vercel build. ${
      error instanceof Error ? error.message : String(error)
    }\n`
  );
  // A failed change check must fail open so a deployment is never skipped.
  process.exit(1);
}
