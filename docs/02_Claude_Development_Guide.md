# 02_Claude_Development_Guide｜Claude Code 开发说明

## 1. 推荐技术栈

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui
- Node.js API Route

## 2. 项目目标

开发一个网页工具，让运营人员通过可视化表单调用 OneThingAI 的 ComfyUI 工作流，生成 5 张营销图 + 1 张 Doodle 图。

## 3. 页面结构

建议使用左右布局。

### 左侧：配置区

模块一：营销图素材

- 背景图上传
- 主视觉产品图上传
- Logo 上传

模块二：Doodle 素材

- Doodle PNG 上传
- Doodle 文案模式：单行 / 双行
- Doodle 单行文案
- Doodle 双行第一行
- Doodle 双行第二行

模块三：文案

- 文案一
- 文案二
- 文案三
- 文案四
- 文案五
- 文案六
- 按钮文字一
- 按钮文字二
- 标签文案

模块四：颜色

- 主标题颜色
- 副标题颜色
- 按钮底色
- 按钮文字颜色
- 标签底色
- 标签文字颜色
- Doodle 文字颜色

模块五：操作

- 一键生成
- 清空输入
- 重置默认值

### 右侧：结果区

展示 6 个卡片：

- 750 × 750
- 530 × 706
- 750 × 400
- 750 × 750（二楼）
- 342 × 514
- 162 × 162 Doodle

每个卡片：

- 图片预览
- 下载 PNG
- 下载 JPG

右侧顶部或底部：

- 下载全部 ZIP

## 4. 前端状态结构建议

```ts
type MarketingGeneratorForm = {
  backgroundImage: File | null;
  productImage: File | null;
  logoImage: File | null;

  doodleImage: File | null;
  doodleMode: 'single' | 'double';
  doodleSingleText: string;
  doodleDoubleLine1: string;
  doodleDoubleLine2: string;

  copy1: string;
  copy2: string;
  copy3: string;
  copy4: string;
  copy5: string;
  copy6: string;
  buttonText1: string;
  buttonText2: string;
  tagText: string;

  titleColor: string;
  subtitleColor: string;
  buttonBgColor: string;
  buttonTextColor: string;
  tagBgColor: string;
  tagTextColor: string;
  doodleTextColor: string;
};
```

## 5. 后端职责

后端 API Route 负责：

1. 接收前端上传的图片和字段。
2. 上传图片到 OneThingAI / ComfyUI 可读取的位置。
3. 替换 ComfyUI workflow JSON 中对应节点的 `widgets_values`。
4. 调用 OneThingAI 工作流实例。
5. 轮询任务状态。
6. 获取生成结果图片。
7. 返回给前端。
8. 支持 PNG/JPG 转换和 ZIP 打包。

## 6. 安全要求

OneThingAI API Key 只能在服务端使用。

环境变量：

```env
ONETHING_API_KEY=your_api_key
ONETHING_WORKFLOW_INSTANCE_ID=your_instance_id
```

禁止：

- 将 API Key 写死在前端代码
- 将 API Key 提交到 GitHub
- 在浏览器 Network 中暴露 OneThingAI Key

## 7. API 路由建议

```text
POST /api/generate
```

用途：提交生成任务。

```text
GET /api/tasks/:taskId
```

用途：轮询任务状态。

```text
GET /api/download/:imageId?format=png
GET /api/download/:imageId?format=jpg
```

用途：下载单张图片。

```text
GET /api/download-zip?taskId=xxx
```

用途：下载全部 ZIP。

## 8. 生成逻辑

用户点击「一键生成」后：

```text
校验表单
↓
上传素材
↓
替换工作流节点参数
↓
调用 OneThingAI
↓
轮询生成状态
↓
解析输出结果
↓
展示 6 张预览图
```

## 9. Doodle 逻辑

Doodle 是独立分支。

必须牢记：

- Doodle 不共用背景图
- Doodle 不共用主视觉产品图
- Doodle 不共用 Logo
- Doodle 不使用按钮
- Doodle 不使用标签

Doodle 使用：

- Doodle PNG 节点
- Doodle 单行文字节点
- Doodle 双行文字节点

如果用户选择单行：

- 使用单行输出图

如果用户选择双行：

- 使用双行输出图

也可以在 MVP 阶段同时生成单行和双行两个 Doodle 预览，但前端默认只展示用户选择的模式。

## 10. 结果处理

当前工作流中：

- Doodle 分支包含 SaveImage 节点。
- 5 张营销图主要是 PreviewImage 节点。

开发时需要根据 OneThingAI 的返回格式确认如何取到 PreviewImage 的图像结果。

如果 OneThingAI 只能返回 SaveImage 输出，则需要在工作流中给 5 张营销图各补一个 SaveImage 节点，或在 API 调用时指定要返回的 PreviewImage 输出。

## 11. UI 体验要求

- 上传组件支持拖拽。
- 图片上传后展示缩略图。
- 颜色字段支持 HEX 输入和 Color Picker。
- 生成中显示 Loading。
- 生成失败显示错误原因。
- 图片可点击放大预览。
- 结果卡片清楚标注尺寸。
- Doodle 的 JPG 下载按钮旁提示：JPG 不支持透明背景。

## 12. 开发顺序建议

1. 搭页面静态 UI。
2. 完成表单状态管理。
3. 完成图片上传预览。
4. 完成后端环境变量读取。
5. 完成 workflow JSON 参数替换。
6. 接入 OneThingAI 调用。
7. 展示返回结果。
8. 做 PNG/JPG 下载。
9. 做 ZIP 打包。
10. 做错误处理和 Loading 状态。

## 10. 部署方案要求

推荐部署方式：

```text
GitHub 存放代码
Vercel 部署线上 MVP
OneThingAI 提供 ComfyUI 工作流能力
```

开发时必须遵守：

1. OneThingAI API Key 只能在 Next.js API Route 或服务端函数中读取。
2. 前端页面不能直接请求 OneThingAI。
3. 前端只能请求本项目自己的 `/api/generate` 等接口。
4. `.env.local` 仅用于本地开发，不能提交到 GitHub。
5. Vercel 生产环境使用 Environment Variables 配置密钥。
6. 所有图片上传、工作流调用、任务轮询、下载转换都应在后端完成或由后端签发安全 URL。

## 11. 环境变量命名

```env
ONETHING_API_KEY=your_onething_api_key
ONETHING_WORKFLOW_INSTANCE_ID=your_workflow_instance_id
```

注意：不要使用 `NEXT_PUBLIC_` 前缀保存 OneThingAI API Key。

## 12. MVP 上线验收

上线前必须验证：

- 本地 `.env.local` 可正常调用 OneThingAI。
- Vercel 环境变量配置后可正常生成图片。
- 5 张营销图可预览。
- Doodle 单行 / 双行可预览。
- Doodle PNG 保持 162×162 和透明背景。
- 单张 PNG 下载正常。
- 单张 JPG 下载正常。
- ZIP 打包下载正常。
- 浏览器 Network 中看不到 OneThingAI API Key。
