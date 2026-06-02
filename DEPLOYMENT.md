# DEPLOYMENT｜GitHub + Vercel 部署准备

> 本文聚焦当前实现（Mock 模式）的实际部署步骤。通用方案另见 `docs/06_Deployment_Guide.md`。

## 1. 推送到 GitHub

仓库已 `git init` 并完成首次提交（`.env.local` 已被忽略，不会上传）。在 GitHub 新建空仓库后：

```bash
git remote add origin git@github.com:<你的账号>/<仓库名>.git
git branch -M main
git push -u origin main
```

提交前已确认 `.gitignore` 覆盖：`node_modules`、`.next`、`.env`、`.env.local`、`.env.*.local`。
**禁止把真实 API Key 写进任何文件或提交历史。**

## 2. Vercel 部署

1. Vercel → **Add New → Project → Import** 选择该 GitHub 仓库。
2. Framework Preset 自动识别为 **Next.js**，Build/Output 用默认即可（无需 `vercel.json`）。
3. **Environment Variables** 添加（Production / Preview 均加）：

   | Key | Mock 演示值 | 接入真实 OneThingAI 时 |
   |---|---|---|
   | `ONETHING_PROVIDER` | `mock` | `real` |
   | `ONETHING_API_KEY` | 任意占位 | 真实 Key（只填 Vercel 后台，勿入代码） |
   | `ONETHING_WORKFLOW_INSTANCE_ID` | 任意占位 | 真实实例 ID |
   | `ONETHING_BASE_URL` | 留空 | OneThingAI API Base（如平台要求） |

4. **Deploy**，完成后访问 `xxx.vercel.app` 验证：上传素材→一键生成→预览 6 张→下载 PNG/JPG→ZIP。
5. 跑通默认域名后，再到 **Settings → Domains** 绑定自定义域名。

> 安全：`ONETHING_API_KEY` 仅服务端读取，浏览器 Network 中不会出现；项目无 `NEXT_PUBLIC_ONETHING_*`。

## 3. 运行时要点

- 所有 API 路由 `runtime = "nodejs"`（用到 `sharp`/`archiver`/读 JSON），已在 `next.config.ts`
  通过 `serverExternalPackages` 声明，Vercel 上 `sharp` 原生支持，无需额外配置。
- Node 版本：`.nvmrc` = 22，`package.json#engines` 要求 `>=18.18`。

## 4. 已知限制（Mock & 真实通用）：任务存储是进程内内存

`lib/task-store.ts` 当前用进程内 Map 保存任务与图片二进制。Vercel 是多实例 Serverless：
`/api/generate` 与随后的 `/api/tasks`、`/api/download` 可能落在**不同实例**，导致偶发
「任务不存在 / 图片已过期」。单人演示、实例预热时通常正常，但不保证稳定。

**生产前替换方案（不影响 Provider 解耦）：**
- 任务元数据 → **Vercel KV / Redis**（替换 `task-store.ts` 实现，接口不变）。
- 图片二进制 → 对象存储（Vercel Blob / S3 / OSS），`pngUrl` 改为签发的存储地址。

## 5. 上线自检（对应 docs/06 清单）

- [ ] 首页可打开，左配置 / 右结果布局正常（含移动端单列）
- [ ] 背景/主视觉/Logo/Doodle 上传与缩略图正常
- [ ] 文案、颜色可改；一键生成返回 6 张
- [ ] Doodle 单行 / 双行可切换，输出 162×162 透明 PNG
- [ ] 单张 PNG / JPG 下载正常；Doodle JPG 有透明丢失提示
- [ ] ZIP 打包下载正常（Doodle 在包内保持 PNG）
- [ ] 浏览器 Network 中无 OneThingAI Key
