# 部署与交付

用于修改工作流、Vercel 产物或准备发布。此处描述仓库声明的交付方式；线上分支保护、Vercel 设置、凭据权限和部署结果需要另行确认。

## 工作流职责

| 工作流                                                   | 触发条件                                 | 检查或产物                                                      |
| -------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------- |
| [CI](../.github/workflows/ci.yml)                        | `main` push、PR 打开/更新/重开、复用调用 | lint、format、Vitest、Twikoo SRI、严格构建、Playwright、sitemap |
| [Preview](../.github/workflows/deploy-preview.yml)       | 同仓库 PR 打开/更新/重开，或手动触发     | 严格构建、上传预构建产物、更新 PR 预览链接                      |
| [Production](../.github/workflows/deploy-production.yml) | `main` push，或在 `main` 手动触发        | 严格构建、上传生产产物                                          |

三个工作流都使用 `ubuntu-latest`、Node 24 和锁文件安装。GitHub Actions 中 Mermaid 使用系统 Chrome，路径通过 `MERMAID_CHROMIUM_EXECUTABLE_PATH` 指定；详情见 [Mermaid](mermaid-rendering.md)。

Preview 与 CI 独立运行，预览成功不代表 CI 已通过。fork PR 不获得 Vercel secrets，只运行常规 CI。生产工作流假设受保护的 `main` 已通过 PR 检查，不会等待同次 push 的 CI；分支保护应要求名为 `build` 的检查，不能为 `jobs.build` 设置其他显示名称。

当前工作流没有文档路径过滤，文档修改也会触发上述流程。`vercel.json` 的 `ignoreCommand` 不负责跳过 GitHub Actions。

## Vercel 构建与配置

仓库按断开 Vercel Git Integration、由 Actions 调用 Vercel CLI 的方式维护。Actions 执行 `pnpm build:strict`，再用 `vercel deploy --prebuilt` 上传 `.vercel/output/`，生产发布加 `--prod`。CLI 版本以工作流中的 `VERCEL_CLI_VERSION` 为准。

部署使用仓库 secrets `VERCEL_TOKEN`、`VERCEL_ORG_ID` 和 `VERCEL_PROJECT_ID`，不写入仓库。工作流意图是让 token 只上传本地构建结果；实际 scope 需要在凭据配置侧确认。

[`vercel.json`](../vercel.json) 仍记录安装命令、`pnpm build`、ignoreCommand、尾斜杠和阅读量代理。这些兼容配置不能代替 Actions 中的严格构建，也不能证明线上 Git Integration 的实际连接状态。

[`scripts/apply-vercel-routes.ts`](../scripts/apply-vercel-routes.ts) 在 Astro 构建后更新 `.vercel/output/config.json`：

- 应用 [`src/utils/http-headers.ts`](../src/utils/http-headers.ts) 中的安全与发现响应头。
- 将哈希静态资源缓存规则移至文件系统匹配前，并为 HTML 设置浏览器重验证及 CDN 缓存。
- 转发 `/api/article-views/` 到外部 Umami 服务并配置 CDN 缓存。
- 为 `/en/` 下的缺失页面选择英文 404，其余使用默认 404，保留 HTTP 404 状态。

Pagefind 随后为 `.vercel/output/static/` 建立搜索索引。不要直接编辑构建输出；更新源配置或后处理脚本再构建。

## 部署验证边界

本地开发中间件和 `pnpm preview` 不执行完整 Vercel 边缘路由。修改响应头、缓存、404 或代理时，本地测试与构建产物是第一层证据，部署后的 HTTP 响应才证明平台实际行为。

验证应针对变更：例如检查对应中英文页面、缺失路由状态、响应头、搜索或 OG 图片，不必为文档编辑访问生产服务。记录部署对应的提交、CI 状态和实际验证结果；Preview 可用、CI 通过和生产发布是不同状态。

阅读量代理的部署检查：

```bash
PREVIEW_URL=https://your-preview.example pnpm smoke:article-views
```

可用 `ARTICLE_PATH` 指定文章路径。脚本连续读取同一部署接口两次，要求 JSON 数值和第二次 `x-vercel-cache: HIT`；它会访问选定部署和后端读取接口。此结果只证明该端点与缓存路径，不证明整站或评论服务。脚本不内置受保护预览的认证，若遇到登录页应先解决该部署的访问权限。

准备发布时以当前提交的检查与部署状态为准；手动恢复入口是相应 workflow 的 `workflow_dispatch`，生产任务只接受 `main`。
