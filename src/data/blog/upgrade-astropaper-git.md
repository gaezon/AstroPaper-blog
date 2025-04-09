---
author: gaazeon
pubDatetime: 2024-08-13T19:45:16.000+08:00
modDatetime:
title: 使用 git 升级更新 Astropaper theme 主题
featured: false
draft: false
slug: upgrade-astropaper-git
tags:
  - git
  - astro
  - astropaper
description: 探索如何使用 Git 升级 Astropaper 主题，包括注意事项、步骤和测试方法。学习保持项目依赖和模板更新的重要性，确保博客始终保持最新状态
---

[Astropaper](https://github.com/satnaing/astro-paper) 作为一个开源项目，会不断进行错误修复和功能更新。如果你使用 AstroPaper 作为模板，可能希望保持最新版本。

截止 2024.8 Astropaper 最新主题为 `4.3.1`，作者在经历一段时间的停更，恢复更新（作者 Sat Naing 是一位来自缅甸的开发者，之前其在 GitHub 表示`由于祖国局势，作者被迫迁移到泰国`，处理完繁重事情后再更新，见 [Github discussion｜astro-paper](https://github.com/satnaing/astro-paper/discussions/309)

以下内容参考翻译自 Astropaper 主题作者 [satnaing](https://github.com/satnaing) 的文章 [How to update dependencies of AstroPaper](https://astro-paper.pages.dev/posts/[how-to-update-dependencies](https://astro-paper.pages.dev/posts/how-to-update-dependencies/)/)，仅翻译成中文并增加相关注释，版权归原作者所有

## Table of contents

## 需要注意的文件和目录

更新时需要特别注意的文件和目录包括（因为你可能已经自定义过其中某些博客样式文件）：

- `src/content/blog/`
- `src/config.ts`
- `src/pages/about.md`
- `public/`
- `src/styles/base.css`

 这些文件可能已经被你自定义，因此在更新时应小心处理。

## 使用 Git 更新 AstroPaper

> 重要提示: 只有在你熟悉解决合并冲突的情况下才执行以下操作。

1. 添加 AstroPaper 作为远程仓库：

```sh
git remote add astro-paper https://github.com/satnaing/astro-paper.git
```

2. 创建新分支进行更新：

```sh
git checkout -b build/update-astro-paper
```

3. 拉取 AstroPaper 的更改：

```sh
git pull astro-paper main
```

如果遇到 `refusing to merge unrelated histories` 错误，使用：

```sh
git pull astro-paper main --allow-unrelated-histories
```

4. 解决冲突并测试：

使用命令测试

```sh
npm run build
npm run prewview
```

5. 将更新分支合并到主分支

## 谨记

保持项目依赖项和模板的更新对于维护一个健康、安全的项目至关重要。通过遵循本文提供的步骤，你可以有效地管理 AstroPaper 项目的更新，确保它始终保持最新状态。

记住，在进行任何重大更新之前，务必备份你的项目并仔细测试所有功能。如果你有任何改进建议或替代方法，欢迎在 GitHub 仓库中开启讨论或提出问题。

## 参考

1. [How to update dependencies of AstroPaper｜Astropaper](https://astro-paper.pages.dev/posts/[how-to-update-dependencies](https://astro-paper.pages.dev/posts/how-to-update-dependencies/)/)
