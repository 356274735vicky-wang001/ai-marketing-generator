# AI 营销宣传图生成器｜Claude Code 开发交接包 V1.1

> ## ⚠️ 目录名 vs 代码状态
> 本文件夹名为 `AI-Marketing-Generator-Handoff-v1.1`，但**目录内代码状态实际为 `v1.0-real-generation-stable`**
> —— 已接入真实 OneThingAI / ComfyOne，线上 **https://generator.hellopeggywang.com** 运行的就是此版本。
>
> | 项 | 值 |
> |---|---|
> | 线上地址 | https://generator.hellopeggywang.com |
> | Vercel 项目 | `ai-marketing-generator`（本目录 `.vercel` 已关联）|
> | GitHub 仓库 | github.com/356274735vicky-wang001/ai-marketing-generator |
> | 分支 / Commit | `main` / `2773d88`（= origin/main，真实生成稳定版）|
> | 回滚点 | tag `mvp-mock-version-stable`（Mock 版）|
>
> **同级目录 `AI-Marketing-Generator-Handoff-v1.2` 只是一个文档包**（仅 `README/docs/workflow`，无 `app/`、无 `package.json`、非 git、未连 Vercel），**与线上代码无关**。开发代码请始终使用本 v1.1 目录。

## 项目简介

这是一个面向运营人员的 AI 设计生产工具。用户上传素材、填写文案、设置颜色后，系统调用 OneThingAI 上的 ComfyUI 工作流，一键生成 5 张营销宣传图 + 1 张 Doodle 图。

## 最终输出

- 750 × 750
- 530 × 706
- 750 × 400
- 750 × 750（二楼）
- 342 × 514（轮播图）
- 162 × 162 Doodle PNG，视觉主体 158 × 158，四边 2px 透明边距

## 推荐部署架构

```text
GitHub：代码仓库
↓
Vercel：线上部署与 MVP 演示
↓
Next.js API Route：服务端转发，隐藏 OneThingAI API Key
↓
OneThingAI：调用 ComfyUI 工作流实例
↓
返回生成图片
```

## 文档目录

- `docs/01_PRD.md`：产品需求文档
- `docs/02_Claude_Development_Guide.md`：Claude Code 开发说明
- `docs/03_Node_Mapping.md`：ComfyUI 节点映射表
- `docs/04_API_Integration.md`：OneThingAI API 接入说明
- `docs/05_UI_Reference.md`：UI 与交互参考说明
- `docs/06_Deployment_Guide.md`：GitHub + Vercel 部署说明
- `docs/07_Claude_Code_Prompt.md`：给 Claude Code 的最终开发提示词

## 工作流文件

- `workflow/一键换图生图_final.json`

## 环境变量

本地开发使用 `.env.local`，Vercel 部署时在 Project Settings → Environment Variables 中配置：

```env
ONETHING_API_KEY=your_onething_api_key
ONETHING_WORKFLOW_INSTANCE_ID=your_workflow_instance_id
```

`.env.local`、`.env` 必须加入 `.gitignore`，禁止提交到 GitHub。

## 重要说明

1. OneThingAI API Key 只能放在后端环境变量中，禁止写入前端代码。
2. 不要使用 `NEXT_PUBLIC_ONETHING_API_KEY`，否则密钥会暴露给浏览器。
3. Doodle 是独立素材上传，不共用营销图背景图、主视觉图、Logo、按钮。
4. 当前 ComfyUI JSON 中，Doodle 分支已有 `SaveImage` 节点；5 张营销图主要是 `PreviewImage`，开发时需要根据 OneThingAI 返回机制拿到对应图片输出。
5. 前端字段名称建议用「文案一、文案二……」这种通用名称；输入框默认值使用 JSON 中对应节点的示例文案。
6. MVP 展示推荐：GitHub 放代码，Vercel 放线上演示，自定义域名绑定到 Vercel。

---

## 已实现 MVP（Next.js 15 + TypeScript + Tailwind + shadcn/ui）

本仓库已包含一个可运行、可部署到 Vercel 的实现。当前默认运行在 **Mock 模式**：
不调用任何外部服务，由后端用 `sharp` 合成占位图，用于在拿到 OneThingAI 真实 API
规格前跑通完整链路（上传 → 生成 → 预览 → 单张 PNG/JPG 下载 → 全部 ZIP 下载）。

### 本地运行

```bash
npm install
npm run dev          # 默认 http://localhost:3000
```

`.env.local`（已被 .gitignore 忽略，禁止提交、禁止写真实 Key 到任何 Markdown）：

```env
ONETHING_PROVIDER=mock            # mock（默认）| real
ONETHING_API_KEY=replace_me_locally
ONETHING_WORKFLOW_INSTANCE_ID=replace_me_locally
# ONETHING_BASE_URL=https://api.onethingai.com
```

Mock 模式无需真实凭据。接入真实 OneThingAI 时：把 `ONETHING_PROVIDER` 改为 `real`，
填好 Key / 实例 ID，并实现 `lib/onething/real-provider.ts` 中标注 TODO 的三个方法
（上传 / 提交 / 轮询取结果）。前端与 API 路由无需改动。

### 关键目录

| 路径 | 说明 |
|---|---|
| `app/page.tsx` | 左配置 / 右结果 主页面（响应式） |
| `app/api/generate` · `tasks/[taskId]` · `download/[imageId]` · `download-zip` | 后端 API 路由（Node runtime） |
| `lib/onething/node-map.ts` | 字段↔节点映射配置（数据驱动，仅声明意图） |
| `lib/onething/workflow-builder.ts` | **运行时动态解析 JSON 节点**并替换，校验节点 type、保留颜色 `#` 风格 |
| `lib/onething/{provider,mock-provider,real-provider,client}.ts` | 适配器接口 + Mock + 真实骨架 + 工厂 |
| `lib/image/{transcode,zip}.ts` | PNG/JPG 转码（Doodle 转 JPG 自动铺白底）、服务端 ZIP 打包 |

### 安全

- `ONETHING_API_KEY` 只在 `lib/onething/real-provider.ts` 通过 `process.env` 读取，
  不下发前端；项目内无任何 `NEXT_PUBLIC_ONETHING_*`。
- 前端只请求本项目 `/api/*`，OneThingAI 结果图也经后端 `/api/download` 代理。

### Doodle 规范落地

独立分支，不共用营销图素材；支持单行 / 双行；输出 **162×162**、主体 158×158、
四边 2px 透明边距、保留透明背景；JPG 下载前端会提示透明背景将丢失。
