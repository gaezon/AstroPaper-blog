---
author: gaazeon
pubDatetime: 2024-08-13T19:45:16.000+08:00
title: "How to Safely Upgrade Your AstroPaper Theme Using Git"
featured: false
draft: false
tags:
  - git
  - astro
  - astropaper
description: "Guide to safely upgrading AstroPaper theme using Git. Learn pre-upgrade checks, merge conflict resolution, and post-upgrade testing for maintaining your blog."
locale: en
originalTitle: 使用 git 升级更新 Astropaper theme 主题
---

As an open-source project, [AstroPaper](https://github.com/satnaing/astro-paper) continuously receives bug fixes and feature updates. If you're using AstroPaper as your template, you'll likely want to keep it current with the latest improvements.

As of August 2024, the latest AstroPaper theme version is `4.3.1`. After a period of development hiatus, the author has resumed updates. (Author Sat Naing is a developer from Myanmar who previously indicated on GitHub that "due to the situation in my home country, I was forced to relocate to Thailand." Updates resumed after handling these challenging circumstances. See [GitHub discussion｜astro-paper](https://github.com/satnaing/astro-paper/discussions/309))

The following content is a translation and adaptation of an article by AstroPaper theme author [satnaing](https://github.com/satnaing): [How to update dependencies of AstroPaper](https://astro-paper.pages.dev/posts/how-to-update-dependencies/). This version has been translated into English with additional explanatory notes. All rights remain with the original author.

## Table of contents

## Critical Files and Directories to Review

When updating, pay special attention to the following files and directories (as you may have already customized certain blog styling elements):

- `src/content/blog/`
- `src/config.ts`
- `src/pages/about.md`
- `public/`
- `src/styles/base.css`

These files may have been customized, so exercise caution during the update process.

## Updating AstroPaper Using Git

> Important Notice: Only proceed with the following steps if you're comfortable resolving merge conflicts.

1. Add AstroPaper as a remote repository:

```sh
git remote add astro-paper https://github.com/satnaing/astro-paper.git
```

2. Create a new branch for the update:

```sh
git checkout -b build/update-astro-paper
```

3. Pull changes from AstroPaper:

```sh
git pull astro-paper main
```

If you encounter a `refusing to merge unrelated histories` error, use:

```sh
git pull astro-paper main --allow-unrelated-histories
```

4. Resolve conflicts and test thoroughly:

Use these commands to test your changes:

```sh
npm run build
npm run preview
```

5. Merge the update branch into your main branch

## Key Reminders

Keeping your project dependencies and templates up-to-date is crucial for maintaining a healthy, secure project. By following the steps outlined in this article, you can effectively manage updates to your AstroPaper project and ensure it remains current.

Remember to always back up your project before performing any major updates and thoroughly test all functionality. If you have suggestions for improvements or alternative approaches, feel free to open a discussion or issue in the GitHub repository.

## References

1. [How to update dependencies of AstroPaper｜Astropaper](https://astro-paper.pages.dev/posts/how-to-update-dependencies/)
