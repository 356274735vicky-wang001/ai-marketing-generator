# 07_Claude_Code_Prompt｜给 Claude Code 的最终开发提示词

> 使用方法：打开 Claude Code 后，把下面整段提示词粘贴给它。建议先让 Claude 输出开发计划和文件结构，不要直接开始编码。

```text
你是一位资深全栈工程师，请根据当前项目文档开发一个可部署到 Vercel 的 Next.js MVP。

请先阅读以下文档：

- README.md
- docs/01_PRD.md
- docs/02_Claude_Development_Guide.md
- docs/03_Node_Mapping.md
- docs/04_API_Integration.md
- docs/05_UI_Reference.md
- docs/06_Deployment_Guide.md
- workflow/一键换图生图_final.json

项目目标：

开发一个“AI 营销宣传图生成器”。运营人员上传素材、填写文案、设置颜色后，系统调用 OneThingAI 的 ComfyUI 工作流，一键生成 5 张营销图 + 1 张 Doodle 图。

技术要求：

1. 使用 Next.js 15。
2. 使用 TypeScript。
3. 使用 Tailwind CSS。
4. 优先使用 shadcn/ui 组件。
5. 支持响应式布局。
6. 前端提供素材上传、文案输入、颜色选择、生成按钮、结果预览、下载功能。
7. 后端通过 Next.js API Route 调用 OneThingAI。
8. OneThingAI API Key 必须从环境变量读取。
9. 禁止在前端暴露 API Key。
10. 禁止使用 NEXT_PUBLIC_ONETHING_API_KEY。
11. 支持单张 PNG 下载。
12. 支持单张 JPG 下载。
13. 支持全部 ZIP 下载。
14. Doodle 必须独立处理，不共用营销图背景、主视觉、Logo 和按钮。
15. Doodle 支持单行和双行模式。
16. Doodle 输出要求为 162×162，视觉主体 158×158，四边 2px 透明边距。

环境变量：

ONETHING_API_KEY
ONETHING_WORKFLOW_INSTANCE_ID

请先完成以下事情，不要直接开始写代码：

1. 阅读并总结项目需求。
2. 输出推荐项目结构。
3. 输出前端组件拆分方案。
4. 输出后端 API Route 设计。
5. 输出 OneThingAI 工作流字段替换方案。
6. 指出你还需要我提供哪些 OneThingAI API 文档或实例信息。

在我确认开发计划后，再开始编码。
```

## 额外提醒

当 Claude Code 开始实现 API 调用时，你需要在本地项目根目录创建 `.env.local`：

```env
ONETHING_API_KEY=你的真实 API Key
ONETHING_WORKFLOW_INSTANCE_ID=你的真实工作流实例 ID
```

不要把真实 API Key 粘贴进任何 Markdown 文档，也不要提交到 GitHub。
