# AstroPaper Blog (Gaazeon)

[![Astro](https://img.shields.io/badge/Astro-7-FF5D01?logo=astro&logoColor=white)](https://astro.build/)
[![Node.js](https://img.shields.io/badge/Node.js-24.x-5FA04E?logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-11.x-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

Personal bilingual blog built on AstroPaper with Astro, TypeScript, and Tailwind CSS. Chinese pages use the root routes; English companion pages use `/en/`.

The site includes paired articles and shared comments, Pagefind search, generated OpenGraph images, and Mermaid diagrams rendered at build time in GitHub Actions with a browser fallback elsewhere.

## Quick start

Use Node.js `24.x` and pnpm `>=11 <12`; the exact pnpm version is recorded in [package.json](package.json). Common entry points check the toolchain with [check-toolchain.mjs](scripts/check-toolchain.mjs).

With fnm, run `fnm use` in this repository to select the version in [.node-version](.node-version). For non-interactive commands, use `fnm exec --using 24 pnpm <command>`.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:4321`. Use pnpm for all project commands.

## Everyday commands

| Command             | Purpose                                                  |
| ------------------- | -------------------------------------------------------- |
| `pnpm dev`          | Start the development server                             |
| `pnpm build:strict` | Validate types and build Vercel output plus search index |
| `pnpm build`        | Run the same build pipeline without `astro check`        |
| `pnpm preview`      | Preview the Astro build locally                          |
| `pnpm lint`         | Run ESLint                                               |
| `pnpm format:check` | Check files covered by the Prettier configuration        |

Builds regenerate tracked image-size and bilingual mapping files and may access remote images or missing fonts. Choose focused checks, generators, and maintenance commands from [development guidance](docs/development.md); article tasks start with [WRITING.md](WRITING.md).

## Find the right guide

| Goal                                                       | Start here                                          |
| ---------------------------------------------------------- | --------------------------------------------------- |
| Write or translate an article                              | [Writing guide](WRITING.md)                         |
| Understand module boundaries and directories               | [Architecture](docs/architecture.md)                |
| Choose checks or run a maintenance tool                    | [Development and verification](docs/development.md) |
| Change CI, response headers, routing, or deployment        | [Deployment](docs/deployment.md)                    |
| Work on language switching, comments, Markdown, or Mermaid | [Documentation index](docs/README.md)               |
| Report a vulnerability                                     | [Security policy](SECURITY.md)                      |

Content lives in `src/data/blog/` and `src/data/blog/en/`. Thin routes in `src/pages/` share components, layouts, and utilities; bundled browser modules live in `src/scripts/`. The [architecture guide](docs/architecture.md) maps source ownership, generated files, and external services.

## Deployment

GitHub Actions builds and uploads prebuilt Vercel output for trusted PR previews and `main` production releases. CI and Preview run independently; the production workflow assumes protected `main` has passed the required `build` check. Fork PRs remain CI-only. See [deployment guidance](docs/deployment.md) for workflow triggers, configuration, and what requires verification on a deployment.

## License

This repository uses separate license notices for source code and published content:

- Unless otherwise noted, source code is licensed under the MIT License. The original AstroPaper copyright and license notice are preserved in [LICENSE](LICENSE).
- Blog posts, translations, and other original site content are licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/), unless a post or asset states otherwise.
- Third-party code, fonts, images, and other assets remain under their respective licenses.

The root MIT license applies to the software and does not supersede these content-specific notices.
