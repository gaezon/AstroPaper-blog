# Repository Agent Guidance

These repository-level defaults apply to coding agents. Keep instructions concise and specific to this project; consult only the files needed for the task instead of reading every guide before each change. For reversible repository changes, carry the requested work through using reasonable assumptions; ask only when missing information could change the outcome or an irreversible or external action lacks user authorization. Explicit user instructions take precedence over these defaults.

## Agent Workflow

- Treat these instructions as durable repository context, not a checklist. Read project docs and inspect code/tests when relevant rather than loading the full repository for every change.
- Use reasonable assumptions for routine choices and carry requested work through appropriate verification. Ask only when ambiguity could materially change the result or an impactful operation lacks authorization.
- Run the smallest meaningful local check for changed behavior. Expand verification when risk or failures warrant it; inspect commands first if they may access production services, modify content, or perform deployment or remote operations.
- Report changed files, checks run, and any remaining unverified scope clearly.

## Documentation and Sources of Truth

- Use [README.md](README.md) for setup, commands, and deployment; use [WRITING.md](WRITING.md) for article authoring and frontmatter; consult the relevant file under `docs/` for feature details.
- Treat `package.json`, the source code, and workflow files as the current source of truth. Update the relevant guide when a documented workflow or behavior changes.
- Preserve unrelated working-tree changes and review `git status` before editing.

## Runtime and Commands

- Use pnpm only. The supported toolchain is Node.js `24.x` and pnpm `>=11 <12`, as declared in `package.json` and `.node-version`.
- If Node.js is not `24.x`, use `fnm use` in the repository. For non-interactive commands, use `fnm exec --using 24 pnpm <command>`.
- `scripts/check-toolchain.mjs` guards the common project entry points. Keep it aligned with `package.json` and the setup instructions in `README.md`.
- For exact script names and behavior, check `package.json` and `README.md`.

## Architecture and Behavior

- Blog content lives in `src/data/blog/`; English content lives in `src/data/blog/en/`. Chinese routes have no locale prefix; English routes use `/en/`.
- Keep mirrored locale routes thin and put shared rendering or locale behavior in `src/components/`, `src/layouts/`, or `src/utils/` as appropriate.
- English article pairing uses `originalTitle`. After changing paired content or pairing logic, regenerate the mapping with `pnpm generate:bilingual-mapping` and check the affected localized navigation.
- Files under `src/utils/generated/` are generated. Change their source or generator, then regenerate; do not edit generated mappings by hand.
- Browser code that needs bundling belongs in `src/scripts/`. Keep only essential first-paint behavior inline.
- `src/utils/http-headers.ts` is the source of truth for security and discovery headers used by development middleware and the Vercel post-build step. Update that module when changing those values.
- `scripts/apply-vercel-routes.ts` patches the prebuilt Vercel output. Review its effects when changing localized 404 handling or response headers.

## Implementation and Accessibility

- Prefer TypeScript for new shared code. Use PascalCase for components, camelCase for helpers, and kebab-case for slugs and filenames.
- Keep Tailwind classes grouped by layout, spacing, then color.
- Locale-aware features should preserve support for `zh-CN` and `en`.
- Interactive controls need accessible names, state, and keyboard behavior. Diagrams should expose a meaningful accessible label.
- Keep browser runtime small when build-time output can provide the same behavior.

## Verification and Delivery

- Match verification to the change. Use focused Vitest checks for isolated utilities, Playwright for affected user flows, and `pnpm build:strict` for content, build, or deployment-configuration changes.
- Documentation-only changes do not need application tests; inspect changed links and paths and review `git diff --check`.
- Add or update browser coverage when a code change alters navigation, language switching, TOC, Mermaid, OpenGraph output, pagination, or another cross-page behavior. Broaden verification only when a failure or unresolved risk justifies it.
- Distinguish local checks from CI, device, and production evidence. A local build does not prove deployed behavior.
- Branch protection requires the GitHub Actions check named `build` (the job id in `.github/workflows/ci.yml`). Do not set a custom `jobs.build.name`, which changes the required check name.

## Maintaining These Instructions

Keep this file focused on repository-specific facts and decisions. Prefer linking to a detailed guide over copying it here, and remove instructions when the underlying workflow or code no longer supports them.
