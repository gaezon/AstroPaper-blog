import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const ignoreCommandPath = fileURLToPath(
  new URL("../../scripts/vercel-ignore-build.mjs", import.meta.url)
);

function runIgnoreCommand({
  changedFiles = [],
  gitFails = false,
}: {
  changedFiles?: string[];
  gitFails?: boolean;
} = {}) {
  const sandbox = mkdtempSync(join(tmpdir(), "vercel-ignore-build-"));
  const fakeBin = join(sandbox, "bin");
  const fakeGit = join(fakeBin, "git");

  mkdirSync(fakeBin);
  writeFileSync(
    fakeGit,
    `#!/bin/sh
if [ "$FAKE_GIT_FAILURE" = "1" ]; then
  echo "fatal: bad revision" >&2
  exit 128
fi
printf '%s\\n' "$FAKE_GIT_OUTPUT"
`
  );
  chmodSync(fakeGit, 0o755);

  const result = spawnSync(process.execPath, [ignoreCommandPath], {
    cwd: sandbox,
    encoding: "utf8",
    env: {
      ...process.env,
      FAKE_GIT_FAILURE: gitFails ? "1" : "0",
      FAKE_GIT_OUTPUT: changedFiles.join("\n"),
      PATH: `${fakeBin}${delimiter}${process.env.PATH ?? ""}`,
      VERCEL_GIT_PREVIOUS_SHA: "previous-sha",
    },
  });

  rmSync(sandbox, { force: true, recursive: true });
  return result;
}

describe("vercel-ignore-build", () => {
  it("skips the build when only README changes", () => {
    const result = runIgnoreCommand({ changedFiles: ["README.md"] });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("skip the Vercel build");
  });

  it("continues the build when a source file changes", () => {
    const result = runIgnoreCommand({
      changedFiles: ["src/pages/index.astro"],
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("continue with the Vercel build");
  });

  it("continues the build when package metadata changes", () => {
    const result = runIgnoreCommand({ changedFiles: ["package.json"] });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("continue with the Vercel build");
  });

  it("fails open when the previous revision cannot be resolved", () => {
    const result = runIgnoreCommand({ gitFails: true });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("continue with the Vercel build");
  });
});
