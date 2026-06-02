# 03_Node_Mapping｜ComfyUI 节点映射表

> 基于最终版工作流：`workflow/一键换图生图_final.json`

## 1. 工作流分组

| 分组 | JSON Group Title | 说明 |
|---|---|---|
| 营销图 1 | 750*750 | 方图 |
| 营销图 2 | 530*706 | 竖图 |
| 营销图 3 | 750*400 | 横版 Banner |
| 营销图 4 | 二楼 | 第二个 750×750 类资源位 |
| 营销图 5 | 轮播图 | 342×514 轮播图 |
| Doodle | doodle | 独立 Doodle 分支 |

## 2. 图片输入节点

| 前端字段 | 节点 ID | 节点类型 | 当前默认文件 | 用途 |
|---|---:|---|---|---|
| backgroundImage | 15 | LoadImage | 背景渐变 (2).png | 5 张营销图共用背景图 |
| productImage | 12 | LoadImage | 元素750.png | 5 张营销图共用主视觉产品图 |
| logoImage | 23 | LoadImage | logo (4).png | 5 张营销图共用 Logo |
| doodleImage | 109 | LoadImage | doodle.png | Doodle 独立 PNG 素材 |
| carouselDotImage | 97 | LoadImage | 轮播点.png | 轮播图内静态装饰素材，通常不暴露给运营 |

说明：

- `backgroundImage`、`productImage`、`logoImage` 用于营销图分支。
- `doodleImage` 只用于 Doodle 分支。
- `carouselDotImage` 建议作为内置素材，不作为前端必填项。

## 3. 背景图尺寸节点

| 尺寸 | 节点 ID | 节点类型 | 关键参数 |
|---|---:|---|---|
| 530×706 | 28 | LayerUtility: ImageScaleByAspectRatio V2 | custom, 530, 706 |
| 750×400 | 55 | LayerUtility: ImageScaleByAspectRatio V2 | custom, 750, 400 |
| 342×514 | 84 | LayerUtility: ImageScaleByAspectRatio V2 | custom, 342, 514 |

说明：

- 750×750 相关背景处理在工作流上方分组中通过背景图和 overlay 组合完成。
- 需要开发时根据 OneThingAI 返回结果确认各分组最终输出节点。

## 4. 主视觉产品图处理节点

| 节点 ID | 节点类型 | 当前参数 | 说明 |
|---:|---|---|---|
| 36 | LayerUtility: ImageScaleByAspectRatio V2 | shortest 308 | 产品图用于 530×706 分支 |
| 57 | LayerUtility: ImageScaleByAspectRatio V2 | shortest 300 | 产品图用于 750×400 分支 |
| 81 | LayerUtility: ImageScaleByAspectRatio V2 | shortest 345 | 产品图用于二楼 / 750×750 类分支 |

## 5. 营销图文案节点

### 5.1 750×750 分支

| 前端字段 | 节点 ID | 节点类型 | 默认值 | 说明 |
|---|---:|---|---|---|
| copy_750_square | 19 | CR Overlay Text | 出行抽一抽 / 领假日券包 | 750×750 主文案 |

### 5.2 530×706 分支

| 前端字段 | 节点 ID | 节点类型 | 默认值 | 说明 |
|---|---:|---|---|---|
| copy_530_706 | 42 | CR Overlay Text | 出行抽一抽 / 领假日券包 | 530×706 主文案 |
| buttonText_530_706 | 53 | CR Text | 立即查看 | 按钮文字 |

### 5.3 750×400 分支

| 前端字段 | 节点 ID | 节点类型 | 默认值 | 说明 |
|---|---:|---|---|---|
| copy_750_400 | 74 | CR Overlay Text | 出行抽一抽 / 领假日券包 | 750×400 主文案 |
| buttonText_750_400 | 66 | CR Text | 立即查看 | 按钮文字 |

### 5.4 342×514 / 轮播图分支

| 前端字段 | 节点 ID | 节点类型 | 默认值 | 说明 |
|---|---:|---|---|---|
| title_342_514 | 86 | CR Overlay Text | 主题六个字内 | 主标题 |
| benefit_342_514 | 88 | CR Overlay Text | 利益点文案九个字内 | 利益点 / 副标题 |
| buttonText_342_514 | 93 | CR Text | 立即抢购 | 按钮文字 |
| tagText_342_514 | 103 | CR Text | 标签文案区 | 标签文案 |
| tagTextOverlay_342_514 | 104 | CR Overlay Text | text | 标签文字覆盖节点，实际文字来自 #103 |
| priceOrExtraText_342_514 | 94 | CR Overlay Text | text | 额外文字节点，默认蓝色 #1A92FA |

## 6. 按钮 / 标签色块节点

| 前端字段 | 节点 ID | 节点类型 | 默认值 | 用途 |
|---|---:|---|---|---|
| buttonBg_530_706 | 48 | CR Color Panel | FFE648 | 530×706 黄色按钮底色 |
| buttonBg_750_400 | 65 | CR Color Panel | FFE648 | 750×400 黄色按钮底色 |
| buttonBg_342_514_white | 90 | CR Color Panel | FFFFFF | 342×514 白色按钮底色 |
| tagBg_342_514 | 101 | CR Color Panel | 0055CC | 342×514 标签底色 |

说明：

- CR Color Panel 的 `widgets_values` 通常为 `[width, height, mode, color]`。
- 修改颜色时主要替换数组最后一项 color。

## 7. 文字颜色节点

文字颜色位于 `CR Overlay Text` 的 `widgets_values` 最后一项。

| 节点 ID | 默认颜色 | 说明 |
|---:|---|---|
| 19 | 003074 | 750×750 主文案颜色 |
| 42 | 003074 | 530×706 主文案颜色 |
| 52 | 003074 | 530×706 按钮文字颜色 |
| 74 | 003074 | 750×400 主文案颜色 |
| 69 | 003074 | 750×400 按钮文字颜色 |
| 86 | ffffff | 342×514 主标题颜色 |
| 88 | ffffff | 342×514 利益点文字颜色 |
| 94 | 1A92FA | 342×514 额外文字颜色 |
| 104 | ffffff | 342×514 标签文字颜色 |
| 133 | 000000 | Doodle 双行文字颜色 |
| 134 | #000000 | Doodle 单行文字颜色 |

## 8. Doodle 节点

Doodle 是独立分支，不共用营销图素材。

### 8.1 Doodle 图片处理

| 前端字段 | 节点 ID | 节点类型 | 参数 | 说明 |
|---|---:|---|---|---|
| doodleImage | 109 | LoadImage | doodle.png | 上传 Doodle PNG |
| doodleScaleImage | 111 | ImageScale | 158×158 | 图像缩放到 158×158 |
| doodleMaskResize | 119 | JWMaskResize | 158×158 bicubic | 遮罩缩放 |
| doodleJoinAlpha | 120 | JoinImageWithAlpha | - | 合并透明通道 |
| doodlePadding | 132 | ImageTransformPaddingAbsolute | add_width 2, add_height 2, constant | 四边补 2px，最终 162×162 |

### 8.2 Doodle 双行文案

| 前端字段 | 节点 ID | 节点类型 | 默认值 | 说明 |
|---|---:|---|---|---|
| doodleDoubleText | 133 | CR Overlay Text | 为爱投票 / 领20元津贴 | 双行 Doodle 文案 |
| doodleDoubleOutput | 121 | SaveImage | ComfyUI | 双行输出保存节点，title 为 doodle2 |

### 8.3 Doodle 单行文案

| 前端字段 | 节点 ID | 节点类型 | 默认值 | 说明 |
|---|---:|---|---|---|
| doodleSingleText | 134 | CR Overlay Text | 加入会员 | 单行 Doodle 文案 |
| doodleSingleOutput | 135 | SaveImage | ComfyUI | 单行输出保存节点，title 为 doodle1 |

## 9. 输出节点建议

当前工作流里明确的 SaveImage：

| 输出 | 节点 ID | 节点类型 | title | 说明 |
|---|---:|---|---|---|
| Doodle 双行 | 121 | SaveImage | doodle2 | 保存双行 Doodle |
| Doodle 单行 | 135 | SaveImage | doodle1 | 保存单行 Doodle |

营销图当前多为 PreviewImage 节点：

| 分支 | 可能输出节点 | 说明 |
|---|---|---|
| 750×750 | PreviewImage #24 / #18 / #21 | 需按 OneThingAI 返回确认最终图 |
| 530×706 | PreviewImage #54 / #51 | 需按 OneThingAI 返回确认最终图 |
| 750×400 | PreviewImage #68 / #72 | 需按 OneThingAI 返回确认最终图 |
| 二楼 | PreviewImage #80 | 需按 OneThingAI 返回确认最终图 |
| 342×514 | PreviewImage #107 / #106 / #96 | 需按 OneThingAI 返回确认最终图 |

强烈建议：

- 如果 OneThingAI 可以返回 PreviewImage，则按分组内最终 PreviewImage 输出取图。
- 如果 OneThingAI 只返回 SaveImage，则在 ComfyUI 中为 5 张营销图补齐 SaveImage 节点，并命名为：
  - `marketing_750x750_1`
  - `marketing_530x706`
  - `marketing_750x400`
  - `marketing_750x750_2`
  - `marketing_342x514`

## 10. 前端字段建议

```ts
type WorkflowFieldMapping = {
  backgroundImage: 15;
  productImage: 12;
  logoImage: 23;
  doodleImage: 109;

  copy750Square: 19;
  copy530x706: 42;
  copy750x400: 74;
  title342x514: 86;
  benefit342x514: 88;

  buttonText530x706: 53;
  buttonText750x400: 66;
  buttonText342x514: 93;
  tagText342x514: 103;

  buttonBg530x706: 48;
  buttonBg750x400: 65;
  buttonBg342x514: 90;
  tagBg342x514: 101;

  doodleDoubleText: 133;
  doodleSingleText: 134;
};
```

## 11. 替换规则

### LoadImage 节点

替换：

```json
"widgets_values": ["新上传文件名.png", "image"]
```

### CR Text 节点

替换：

```json
"widgets_values": ["新的按钮或标签文案"]
```

### CR Overlay Text 节点

常见数组结构：

```json
[
  "文本内容",
  "字体文件.ttf",
  字号,
  "custom",
  "top/center",
  "left/center",
  0,
  行间距,
  x,
  y,
  0,
  "text center",
  "颜色HEX"
]
```

通常只替换：

- 第 0 项：文本内容
- 最后一项：文字颜色

不要随意改字体、字号、x/y，除非用户明确要求调整模板。

### CR Color Panel 节点

常见数组结构：

```json
[宽度, 高度, "custom", "颜色HEX"]
```

通常只替换最后一项颜色。
