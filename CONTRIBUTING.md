# Contributing

Thanks for helping improve AstroPaper Blog. The project is a bilingual Astro site, so changes should preserve both the Chinese and English publishing paths whenever the affected feature is localized.

## Development environment

- Node.js `24.x`
- pnpm `>=11 <12`
- pnpm only; do not use npm, Yarn, or Bun for project commands

Install dependencies with:

```bash
pnpm install
```

## Making changes

- Create a focused branch from `main` and open a pull request.
- Follow the existing TypeScript, Astro, Tailwind, and locale-aware patterns.
- Read `WRITING.md` before adding or editing posts.
- Keep Chinese routes unprefixed and English routes under `/en/`.
- When changing bilingual content or pairing logic, regenerate the files under `src/utils/generated/` with the repository script rather than editing generated files by hand.
- Do not commit secrets, local environment files, generated build output, or test artifacts.

## Verification

Run the relevant checks before opening a pull request. For a broad change, run the same checks used by CI:

```bash
pnpm run lint
pnpm run format:check
pnpm run test:unit
pnpm run twikoo:sri:check
pnpm run build:strict
pnpm exec playwright test
pnpm exec playwright test --config=playwright.sitemap.config.ts
```

If a check is intentionally skipped, explain why in the pull request.

## Security reports

Please do not disclose security vulnerabilities in a public issue. Use the contact details on the [contact page](https://blog.gaazeon.com/contact/) instead.
