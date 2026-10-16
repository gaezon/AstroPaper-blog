# Repository Agent Guidance

## Task routing

Read the guide that serves the task; these are entry points, not required pre-reading.

| Task                                            | Reference                            |
| ----------------------------------------------- | ------------------------------------ |
| Setup and everyday commands                     | [README.md](README.md)               |
| Articles, frontmatter, translations             | [WRITING.md](WRITING.md)             |
| Module boundaries and shared rendering          | [Architecture](docs/architecture.md) |
| Local checks, generators, maintenance tools     | [Development](docs/development.md)   |
| CI, Vercel output, deployment                   | [Deployment](docs/deployment.md)     |
| Language switching, comments, Markdown, Mermaid | [Feature index](docs/README.md)      |

## Project constraints

- Use pnpm with Node.js `24.x` and pnpm `>=11 <12`. If needed, use `fnm use` or `fnm exec --using 24 pnpm <command>`. Package scripts, source, and workflows define current behavior.
- Chinese posts live in `src/data/blog/`, English posts in `src/data/blog/en/`. Chinese routes have no locale prefix; English routes use `/en/`. Keep locale route wrappers thin and share rendering in components/layouts and behavior in utilities.
- English `originalTitle` pairs translations with Chinese titles. Regenerate with `pnpm generate:bilingual-mapping` after pairing changes and check affected navigation.
- Regenerate tracked files in `src/utils/generated/` from their sources; include relevant generated changes. Do not hand-edit them or commit build/test artifacts.
- Put new bundled browser modules in `src/scripts/`; keep inline code limited to essential first-paint behavior. Preserve `zh-CN`/`en` support and accessible names, state, and keyboard behavior for controls.
- Security/discovery headers belong in `src/utils/http-headers.ts`; prebuilt Vercel routing belongs in `scripts/apply-vercel-routes.ts`. Development middleware alone does not cover deployed responses.
- Keep the required CI check named `build`: do not add `jobs.build.name` in `.github/workflows/ci.yml`.

## Completion

Preserve unrelated local changes. Carry authorized work through implementation and appropriate verification; resolve routine choices without pausing for approval. Clarify only consequential ambiguity or an external action outside the authorized scope.

Choose checks by affected behavior using [development guidance](docs/development.md#验证选择). For documentation-only edits, check links, source references, formatting, and `git diff --check`; application tests are unnecessary. For code that changes navigation, locale switching, TOC, Mermaid, OG, or pagination, update affected browser coverage. Report changes, checks, and unverified scope, distinguishing local results from CI and deployed behavior.
