// 全局共享类型定义

export type DoodleMode = "single" | "double";

/**
 * 前端表单文本/颜色字段（不含文件）。
 *
 * 设计原则：每个字段都归属一张具体输出图，颜色按节点逐一作用，不再跨图共用，
 * 避免运营猜测「这个颜色影响哪张图」。字段名沿用文档 03/04 的语义命名。
 */
export interface GenerateTextFields {
  // —— 营销图1（750×750）——
  copy750Square: string; // #19 主文案
  color750Square: string; // #19 标题颜色

  // —— 营销图2（530×706）——
  copy530x706: string; // #42 主文案
  buttonText530x706: string; // #53 按钮文字
  button530BgColor: string; // #48 按钮底色
  button530TextColor: string; // #52 按钮文字颜色

  // —— 营销图3（750×400）——
  copy750x400: string; // #74 主文案
  buttonText750x400: string; // #66 按钮文字
  button750BgColor: string; // #65 按钮底色
  button750TextColor: string; // #69 按钮文字颜色

  // —— 营销图4（750×750 二楼）：纯视觉合成，无独立文案/颜色节点 ——

  // —— 营销图5（342×514 轮播图）——
  title342x514: string; // #86 标题文案
  benefit342x514: string; // #88 利益点文案
  tagText342x514: string; // #103 标签文案
  tag342BgColor: string; // #101 标签底色
  tag342TextColor: string; // #104 标签文字颜色
  buttonText342x514: string; // #93 按钮文字
  button342BgColor: string; // #90 按钮底色

  // —— Doodle（162×162）——
  doodleMode: DoodleMode;
  doodleSingleText: string; // #134
  doodleDoubleLine1: string; // #133 第一行
  doodleDoubleLine2: string; // #133 第二行
  doodleTextColor: string; // #133/#134 Doodle 文字颜色
}

/** 上传文件字段 */
export type UploadFieldKey =
  | "backgroundImage"
  | "productImage"
  | "logoImage"
  | "doodleImage";

export interface GeneratedImage {
  id: string; // 稳定标识，如 marketing_750x750_1 / doodle_single
  name: string; // 统一展示名，如 "750×750 方图"
  width: number;
  height: number;
  isDoodle: boolean;
  hasAlpha: boolean; // 是否带透明通道（Doodle = true）
  /**
   * PNG 原图的 base64（不含 data: 前缀）。
   * 直接随生成响应内联返回，前端用 data URL 预览与下载，
   * 不依赖任何服务端会话状态 —— 在 Vercel 多实例 Serverless 下也始终可用。
   */
  pngBase64: string;
}

/** POST /api/generate 的同步响应 */
export interface GenerateResponse {
  images: GeneratedImage[];
}

/** OneThingAI 适配器从工作流执行后返回的单张原始图片 */
export interface ProviderImage {
  id: string;
  /** 原始 PNG 二进制 */
  buffer: Buffer;
}
