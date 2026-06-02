# 06_Deployment_Guide｜部署指南

## 1. 推荐部署方案

本项目推荐采用：

```text
GitHub：代码仓库
Vercel：线上部署 / MVP 演示
OneThingAI：ComfyUI 工作流执行
```

原因：

- GitHub 适合代码版本管理。
- Vercel 适合部署 Next.js 项目。
- OneThingAI API Key 可以放在 Vercel 环境变量中，不暴露到前端。
- 自定义域名可以绑定到 Vercel，用于正式展示。

## 2. 本地开发流程

```bash
npm install
npm run dev
```

本地环境变量文件：

```bash
.env.local
```

内容示例：

```env
ONETHING_API_KEY=your_onething_api_key
ONETHING_WORKFLOW_INSTANCE_ID=your_workflow_instance_id
```

## 3. GitHub 配置

必须确保 `.gitignore` 包含：

```gitignore
.env
.env.local
.env.*.local
```

禁止提交：

- OneThingAI API Key
- 工作流实例密钥
- 临时生成图片
- 用户上传素材

## 4. Vercel 部署流程

1. 将项目推送到 GitHub。
2. 打开 Vercel。
3. 选择 Import Project。
4. 选择 GitHub 仓库。
5. Framework Preset 选择 Next.js。
6. 添加环境变量：

```env
ONETHING_API_KEY=your_onething_api_key
ONETHING_WORKFLOW_INSTANCE_ID=your_workflow_instance_id
```

7. 点击 Deploy。
8. 部署完成后访问 `xxx.vercel.app` 验证功能。

## 5. 自定义域名绑定

当 Vercel 默认域名可正常使用后，再绑定自定义域名。

建议顺序：

```text
先跑通 xxx.vercel.app
↓
再绑定正式域名
↓
最后对外展示
```

域名绑定后需要在域名服务商后台配置 DNS。按 Vercel 提示添加：

- A Record
- CNAME Record

实际记录以 Vercel 项目中的提示为准。

## 6. 上线检查清单

上线前必须逐项检查：

- [ ] 首页可正常打开。
- [ ] 背景图上传正常。
- [ ] 主视觉产品图上传正常。
- [ ] Logo 上传正常。
- [ ] Doodle PNG 上传正常。
- [ ] 文案一至文案六可修改。
- [ ] 按钮文字可修改。
- [ ] 标签文案可修改。
- [ ] 文字颜色可修改。
- [ ] 按钮底色可修改。
- [ ] 一键生成成功。
- [ ] 5 张营销图均可预览。
- [ ] Doodle 单行输出正常。
- [ ] Doodle 双行输出正常。
- [ ] Doodle 输出为 162×162 PNG。
- [ ] Doodle 透明背景正常。
- [ ] 单张 PNG 下载正常。
- [ ] 单张 JPG 下载正常。
- [ ] ZIP 打包下载正常。
- [ ] 浏览器 Network 中看不到 OneThingAI API Key。
- [ ] Vercel Production 环境可正常生成。

## 7. 常见风险

### API Key 暴露

不要把 API Key 写入：

- README
- PRD
- 前端代码
- GitHub 仓库
- 截图

### 图片生成超时

如果 OneThingAI 生成耗时较长，前端需要展示：

```text
生成中，请稍候...
```

并通过任务轮询获取状态。

### Doodle JPG 透明背景丢失

JPG 不支持透明背景。Doodle 默认推荐 PNG 下载；JPG 下载需要提示用户背景会变为非透明。

## 8. 推荐 MVP 演示路径

```text
打开域名
↓
上传默认素材
↓
修改文案和颜色
↓
点击一键生成
↓
展示 6 张结果
↓
下载 ZIP
```
