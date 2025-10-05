---
author: gaazeon
pubDatetime: 2024-08-13T19:45:16.000+08:00
title: "Upgrade the AstroPaper theme with Git (safe workflow)"
featured: false
draft: false
tags:
  - git
  - astro
  - astropaper
description: "A practical guide to safely updating AstroPaper via Git: what to review, how to pull upstream, resolve conflicts and verify the site afterwards."
locale: en
originalTitle: 使用 git 升级更新 Astropaper theme 主题
---

AstroPaper is actively maintained. If your blog was scaffolded from it, you may want to follow upstream improvements and fixes.

## Table of contents

## Files to review carefully

If you customized these, resolve conflicts with care when updating:

- `src/content/blog/`
- `src/config.ts`
- `src/pages/about.md`
- `public/`
- `src/styles/base.css`

## Update via Git

> Only do this if you’re comfortable resolving conflicts.

1) Add the upstream remote:

```sh
git remote add astro-paper https://github.com/satnaing/astro-paper.git
```

2) Work on a dedicated branch:

```sh
git checkout -b build/update-astro-paper
```

3) Pull upstream changes:

```sh
git pull astro-paper main
```

If you see `refusing to merge unrelated histories`:

```sh
git pull astro-paper main --allow-unrelated-histories
```

4) Resolve conflicts and test locally:

```sh
npm run build
npm run preview
```

5) Merge the branch after verification.

## Notes

Keeping dependencies and templates up‑to‑date is essential for security and new features. Always create a backup and verify your site thoroughly after upgrades.

## Reference

1. [How to update dependencies of AstroPaper](https://astro-paper.pages.dev/posts/how-to-update-dependencies/)
