// 全局共享类型定义

export type DoodleMode = "single" | "double";

/** 前端表单文本/颜色字段（不含文件，文件以 File 单独管理） */
export interface GenerateTextFields {
  // 营销图文案（字段名沿用文档 03/04 的语义命名，直接对应工作流节点）
  copy750Square: string; // #19  750×750 主文案
  copy530x706: string; // #42  530×706 主文案
  copy750x400: string; // #74  750×400 主文案
  title342x514: string; // #86  342×514 主标题
  benefit342x514: string; // #88  342×514 利益点

  buttonText530x706: string; // #53 按钮文字
  buttonText750x400: string; // #66 按钮文字
  buttonText342x514: string; // #93 按钮文字
  tagText342x514: string; // #103 标签文案

  // Doodle 文案
  doodleMode: DoodleMode;
  doodleSingleText: string; // #134
  doodleDoubleLine1: string; // #133 第一行
  doodleDoubleLine2: string; // #133 第二行

  // 颜色（HEX，可带或不带 #）
  titleColor: string; // 主标题文字颜色
  subtitleColor: string; // 副标题/利益点文字颜色
  buttonBgColor: string; // 按钮底色
  buttonTextColor: string; // 按钮文字颜色
  tagBgColor: string; // 标签底色
  tagTextColor: string; // 标签文字颜色
  doodleTextColor: string; // Doodle 文字颜色
}

/** 上传文件字段 */
export type UploadFieldKey =
  | "backgroundImage"
  | "productImage"
  | "logoImage"
  | "doodleImage";

export type TaskStatus = "pending" | "running" | "success" | "failed";

export interface GeneratedImage {
  id: string; // 稳定标识，如 marketing_750x750_1 / doodle_single
  name: string; // 展示名，如 "750×750"
  width: number;
  height: number;
  isDoodle: boolean;
  hasAlpha: boolean; // 是否带透明通道（Doodle = true）
  /** 后端代理下载地址（PNG 原图）；前端永远只接触本项目地址 */
  pngUrl: string;
}

export interface TaskResult {
  taskId: string;
  status: TaskStatus;
  images: GeneratedImage[];
  error?: string;
  createdAt: number;
}

/** OneThingAI 适配器从工作流执行后返回的单张原始图片 */
export interface ProviderImage {
  id: string;
  /** 原始 PNG 二进制 */
  buffer: Buffer;
}
