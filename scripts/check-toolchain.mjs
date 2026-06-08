#!/usr/bin/env node

const EXPECTED_NODE_MAJOR = 24;
const EXPECTED_PNPM_MAJOR = 11;

const failures = [];
const writeError = line => {
  process.stderr.write(`${line}\n`);
};

const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor !== EXPECTED_NODE_MAJOR) {
  failures.push(
    `Node.js 24.x is required, but ${process.version} is active at ${process.execPath}.`
  );
}

const userAgent = process.env.npm_config_user_agent ?? "";
if (userAgent) {
  const managerMatch = userAgent.match(/^([^/]+)\/([^\s]+)/);
  const managerName = managerMatch?.[1];
  const pnpmVersion = userAgent.match(/\bpnpm\/(\d+)\.(\d+)\.(\d+)\b/);

  if (managerName !== "pnpm" || !pnpmVersion) {
    failures.push(
      `pnpm 11.x is required, but this command is running under ${managerName ?? "an unknown package manager"}.`
    );
  } else if (Number(pnpmVersion[1]) !== EXPECTED_PNPM_MAJOR) {
    failures.push(
      `pnpm >=11 <12 is required, but pnpm ${pnpmVersion.slice(1).join(".")} is active.`
    );
  }
}

if (failures.length > 0) {
  writeError("Toolchain check failed:");
  for (const failure of failures) {
    writeError(`- ${failure}`);
  }
  writeError("");
  writeError("Expected: Node.js 24.x and pnpm >=11 <12.");
  writeError(
    "Fix: run `fnm use` in this repository, then retry the pnpm command."
  );
  writeError(
    "For non-interactive shells, use `fnm exec --using 24 pnpm <command>`."
  );
  process.exit(1);
}
