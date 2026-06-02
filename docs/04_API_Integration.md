# 04_API_Integration｜OneThingAI API 接入说明

## 1. 基本原则

OneThingAI API Key 必须只在后端使用。

禁止：

- 前端直接请求 OneThingAI
- 在前端代码中写入 API Key
- 将 `.env.local` 提交到 GitHub

## 2. 环境变量

```env
ONETHING_API_KEY=your_api_key_here
ONETHING_WORKFLOW_INSTANCE_ID=your_workflow_instance_id_here
```

建议 `.gitignore`：

```gitignore
.env
.env.local
.env.*.local
```

## 3. 后端接口设计

### 3.1 提交生成任务

```text
POST /api/generate
```

请求类型：`multipart/form-data`

字段：

- backgroundImage
- productImage
- logoImage
- doodleImage
- copy750Square
- copy530x706
- copy750x400
- title342x514
- benefit342x514
- buttonText530x706
- buttonText750x400
- buttonText342x514
- tagText342x514
- doodleMode
- doodleSingleText
- doodleDoubleLine1
- doodleDoubleLine2
- titleColor
- subtitleColor
- buttonBgColor
- buttonTextColor
- tagBgColor
- tagTextColor
- doodleTextColor

响应：

```json
{
  "taskId": "xxx",
  "status": "pending"
}
```

### 3.2 查询任务状态

```text
GET /api/tasks/:taskId
```

响应：

```json
{
  "taskId": "xxx",
  "status": "success",
  "images": [
    {
      "id": "marketing_750x750_1",
      "name": "750×750",
      "width": 750,
      "height": 750,
      "pngUrl": "...",
      "jpgUrl": "..."
    }
  ]
}
```

### 3.3 下载单张图

```text
GET /api/download/:imageId?format=png
GET /api/download/:imageId?format=jpg
```

### 3.4 ZIP 下载

```text
GET /api/download-zip?taskId=xxx
```

## 4. 工作流替换流程

后端需要：

1. 读取 `workflow/一键换图生图_final.json`。
2. 深拷贝一份 workflow。
3. 上传用户图片，获得 OneThingAI 可识别的文件名或文件 ID。
4. 替换对应 LoadImage 节点。
5. 替换文字节点。
6. 替换颜色节点。
7. 提交工作流运行。
8. 轮询任务状态。
9. 取回图片结果。

## 5. 图片上传逻辑

营销图：

- `backgroundImage` → LoadImage #15
- `productImage` → LoadImage #12
- `logoImage` → LoadImage #23

Doodle：

- `doodleImage` → LoadImage #109

## 6. 文字替换逻辑

CR Text：替换 `widgets_values[0]`。

CR Overlay Text：替换 `widgets_values[0]`。

双行文本使用换行符：

```ts
const doodleDoubleText = `${line1}\n${line2}`;
```

## 7. 颜色替换逻辑

CR Color Panel：替换 `widgets_values[3]`。

CR Overlay Text 文字颜色：替换 `widgets_values[widgets_values.length - 1]`。

建议统一移除 `#` 后再写入，或兼容两种格式，因为当前 JSON 中同时存在：

- `ffffff`
- `#000000`

建议工具函数：

```ts
function normalizeHexForComfy(hex: string, withHash = false) {
  const clean = hex.replace('#', '').trim();
  return withHash ? `#${clean}` : clean;
}
```

## 8. 结果获取注意事项

当前 JSON 中只有 Doodle 分支有明确 SaveImage 节点：

- #121 doodle2
- #135 doodle1

5 张营销图主要通过 PreviewImage 预览。

接入 OneThingAI 时需要确认：

1. OneThingAI 是否返回 PreviewImage 结果。
2. 如果不返回，需要回到 ComfyUI 工作流中为 5 张营销图补 SaveImage 节点。
3. 每个输出建议使用稳定命名，方便前端识别。

推荐输出命名：

```text
marketing_750x750_1.png
marketing_530x706.png
marketing_750x400.png
marketing_750x750_2.png
marketing_342x514.png
doodle_single.png
doodle_double.png
```

## 9. JPG 转换

PNG 转 JPG 时：

- 普通营销图可以直接转 JPG。
- Doodle 如果有透明背景，转 JPG 前需要铺白底或提示用户透明会丢失。

## 10. ZIP 打包

建议使用：

- JSZip（前端打包）
- archiver（后端打包）

更推荐后端打包，避免大图片占用浏览器内存。

## 11. 错误处理

需要处理：

- 图片格式错误
- 图片上传失败
- OneThingAI API 失败
- 工作流运行失败
- 任务超时
- 结果图片为空
- ZIP 打包失败

前端展示文案示例：

```text
生成失败，请检查上传图片或稍后重试。
```

```text
Doodle 图片建议使用透明 PNG。
```
