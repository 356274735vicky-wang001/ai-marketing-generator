# PROJECT_STRUCTURE｜项目结构说明

AI 营销宣传图生成器 —— Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui。
当前运行在 **Mock 模式**（后端用 sharp 合成占位图），OneThingAI 真实接入预留在
Provider 适配器层，后续替换即可，前端与 API 路由无需改动。

## 目录树

```text
.
├─ app/                              # Next.js App Router
│  ├─ layout.tsx                     # 根布局 + 全局 Toaster
│  ├─ page.tsx                       # 主页面（左配置 / 右结果，响应式，唯一客户端状态中心）
│  ├─ globals.css                    # Tailwind 基础层 + 主题变量 + 透明棋盘格
│  └─ api/                           # 后端 API 路由（全部 runtime = "nodejs"）
│     ├─ generate/route.ts           # POST 提交：校验→上传→动态替换工作流→submit→落库 taskId
│     ├─ tasks/[taskId]/route.ts     # GET 轮询：poll provider→转码落库→返回 6 张图元信息
│     ├─ download/[imageId]/route.ts # GET 单张下载：?format=png|jpg，服务端转码 + attachment
│     └─ download-zip/route.ts       # GET 全部 ZIP：服务端 archiver 打包
│
├─ components/
│  ├─ ui/                            # shadcn/ui 原子组件（button/card/input/label/
│  │                                 #   radio-group/dialog/progress/skeleton/sonner/textarea）
│  ├─ ImageDropzone.tsx              # 拖拽上传 + 缩略图 + 类型/大小校验
│  ├─ ColorField.tsx                 # HEX 输入 + react-colorful 取色 + 色块预览
│  ├─ config-panel/                  # 左侧配置区
│  │  ├─ MaterialUploadCard.tsx      #   营销图素材（背景/主视觉/Logo）
│  │  ├─ DoodleCard.tsx              #   Doodle 素材 + 单行/双行模式 + 文案
│  │  ├─ CopyFieldsCard.tsx          #   文案输入（主文案 Textarea + 按钮/标签 Input）
│  │  ├─ ColorFieldsCard.tsx         #   7 个颜色字段
│  │  └─ ActionBar.tsx               #   一键生成 / 重置默认值 / 清空输入
│  └─ result/                        # 右侧结果区
│     ├─ ResultGrid.tsx              #   6 卡片网格 + Loading + 下载全部 ZIP
│     └─ ResultCard.tsx              #   单卡片：预览/放大 Dialog/下载 PNG·JPG/Doodle 提示
│
├─ lib/
│  ├─ types.ts                       # 全局共享类型（表单字段 / 任务 / 输出图）
│  ├─ utils.ts                       # cn() className 合并
│  ├─ form-schema.ts                 # zod 校验 + 默认文案/颜色 + 上传约束
│  ├─ task-store.ts                  # 任务存储（MVP 内存版，标注 Vercel KV 替换点）
│  ├─ image/
│  │  ├─ transcode.ts                # PNG/JPG 转码（JPG 自动铺白底）
│  │  └─ zip.ts                      # 服务端 ZIP 打包
│  └─ onething/                      # ★ OneThingAI 适配层（与业务解耦）
│     ├─ provider.ts                 #   适配器接口 OneThingProvider（唯一对外契约）
│     ├─ mock-provider.ts            #   Mock 实现：sharp 合成占位图
│     ├─ real-provider.ts            #   真实实现骨架（3 个 TODO：upload/submit/poll）
│     ├─ client.ts                   #   工厂：按 ONETHING_PROVIDER 选择实现（唯一装配点）
│     ├─ node-map.ts                 #   字段↔节点映射配置（数据驱动，仅声明意图）
│     ├─ workflow-builder.ts         #   运行时动态解析 JSON 节点并替换
│     └─ hex.ts                      #   HEX 归一化 + # 风格保留（前后端共用的纯函数）
│
├─ workflow/
│  └─ 一键换图生图_final.json         # ComfyUI 工作流（构建器在运行时读取、深拷贝、替换）
│
├─ docs/                             # 交接文档（PRD / 节点映射 / API / UI / 部署）
├─ .env.example                     # 环境变量样例（不含真实值）
├─ .env.local                       # 本地变量（已 gitignore，禁止提交）
├─ .gitignore
├─ next.config.ts                   # serverExternalPackages: sharp / archiver
├─ tailwind.config.ts · postcss.config.mjs · tsconfig.json
├─ package.json
├─ README.md
└─ PROJECT_STRUCTURE.md              # 本文件
```

## 数据流

```text
[前端 page.tsx]
  files + fields  ──POST multipart──▶  /api/generate
                                          │ 1. zod 校验文案/颜色 + 文件校验
                                          │ 2. provider.uploadImage() ×4  → refs
                                          │ 3. buildWorkflow(refs, fields) 动态替换节点
                                          │ 4. provider.submit(workflow, ctx) → providerTaskId
                                          │ 5. createTask() 落库
                                          └─▶ { taskId }
  轮询 ──GET──▶ /api/tasks/[taskId]
                  │ provider.poll() → 原始 PNG[]
                  │ toPng() 落库 task-store
                  └─▶ { images: [{ id, name, w, h, pngUrl }] }   pngUrl = /api/download/...
  下载 ──GET──▶ /api/download/[imageId]?format=png|jpg  → transcode → attachment
  ZIP  ──GET──▶ /api/download-zip?taskId=...            → archiver  → attachment
```

## Provider 层解耦边界（重要）

适配层是本项目唯一与「图片生成后端」耦合的地方，边界严格：

| 角色 | 文件 | 约束 |
|---|---|---|
| 契约 | `lib/onething/provider.ts` | 定义 `OneThingProvider` 接口（upload/submit/poll） |
| 实现 | `mock-provider.ts` / `real-provider.ts` | 互不感知；**仅** 被 `client.ts` 引用 |
| 装配 | `lib/onething/client.ts` | 唯一工厂，按 `ONETHING_PROVIDER` 选择实现 |
| 消费 | `app/api/generate`、`app/api/tasks` | 只通过 `getProvider()` 拿接口，不 import 具体实现 |
| 前端 | `components/*`、`app/page.tsx` | 只 import 纯函数（`hex`、`node-map` 元数据），**不触碰 provider / 密钥** |

已用 grep 校验：除 `client.ts` 外无任何文件引用 `mock-provider`/`real-provider`；
`ONETHING_API_KEY` 仅出现在 `real-provider.ts` 服务端 `process.env` 读取处；
代码库无 `NEXT_PUBLIC_ONETHING_*`，构建产物 `.next/static` 不含密钥。

## 切换到真实 OneThingAI（后续）

1. 在 `lib/onething/real-provider.ts` 实现三个 TODO 方法（上传 / 提交 / 轮询取结果）。
2. 设置环境变量 `ONETHING_PROVIDER=real` 并填好 `ONETHING_API_KEY` / `ONETHING_WORKFLOW_INSTANCE_ID`。
3. 解决营销图取图问题：5 张营销图当前为 PreviewImage，确认 OneThingAI 返回机制，
   必要时在工作流中补 SaveImage 节点（命名见 docs/04）。
4. 前端、API 路由、workflow-builder、node-map **均无需改动**。
