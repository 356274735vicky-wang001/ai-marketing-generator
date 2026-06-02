/**
 * 工作流字段映射配置（数据驱动）。
 *
 * 设计原则（按用户要求）：
 * - 这里只声明「前端字段 ↔ 节点 ID ↔ 操作意图」。
 * - 不在此写死 widgets_values 的数组下标/长度。
 * - 真正的替换位置由 workflow-builder 在运行时读取实际 JSON 节点后动态解析，
 *   并校验节点 type 是否与预期一致，不一致则报错，避免改错位置。
 *
 * 节点 ID 来源：docs/03_Node_Mapping.md，且已与 workflow JSON 逐个核对。
 */

import type { GenerateTextFields, UploadFieldKey } from "@/lib/types";

/** 替换操作类型 */
export type EditOp =
  | "loadImage" // LoadImage：写入文件名到 widgets_values[0]
  | "crText" // CR Text：写入文本到 widgets_values[0]
  | "overlayContent" // CR Overlay Text：写入文本到 widgets_values[0]
  | "overlayColor" // CR Overlay Text：写入颜色到最后一个元素
  | "panelColor"; // CR Color Panel：写入颜色到最后一个元素

/** 期望的节点类型，用于运行时校验 */
export const EXPECTED_TYPE: Record<EditOp, string> = {
  loadImage: "LoadImage",
  crText: "CR Text",
  overlayContent: "CR Overlay Text",
  overlayColor: "CR Overlay Text",
  panelColor: "CR Color Panel",
};

/** 图片上传字段 → LoadImage 节点 */
export const IMAGE_BINDINGS: Record<UploadFieldKey, number> = {
  backgroundImage: 15,
  productImage: 12,
  logoImage: 23,
  doodleImage: 109,
};

type TextFieldKey = keyof GenerateTextFields;

export interface TextBinding {
  field: TextFieldKey;
  nodeId: number;
  op: Extract<EditOp, "crText" | "overlayContent">;
}

/**
 * 文案绑定（不含 Doodle —— Doodle 走独立分支，由 builder 按模式处理）。
 * 注意：按钮/标签文字「内容」在 CR Text 节点；其「颜色」在配对的 CR Overlay Text
 * 节点（见 COLOR_BINDINGS），后者 widgets_values[0] 是链接占位符，禁止改动。
 */
export const TEXT_BINDINGS: TextBinding[] = [
  { field: "copy750Square", nodeId: 19, op: "overlayContent" },
  { field: "copy530x706", nodeId: 42, op: "overlayContent" },
  { field: "copy750x400", nodeId: 74, op: "overlayContent" },
  { field: "title342x514", nodeId: 86, op: "overlayContent" },
  { field: "benefit342x514", nodeId: 88, op: "overlayContent" },

  { field: "buttonText530x706", nodeId: 53, op: "crText" },
  { field: "buttonText750x400", nodeId: 66, op: "crText" },
  { field: "buttonText342x514", nodeId: 93, op: "crText" },
  { field: "tagText342x514", nodeId: 103, op: "crText" },
];

type ColorFieldKey = Extract<
  TextFieldKey,
  | "titleColor"
  | "subtitleColor"
  | "buttonBgColor"
  | "buttonTextColor"
  | "tagBgColor"
  | "tagTextColor"
  | "doodleTextColor"
>;

export interface ColorBinding {
  field: ColorFieldKey;
  nodeId: number;
  op: Extract<EditOp, "overlayColor" | "panelColor">;
}

/**
 * 颜色绑定。前端按 PRD 第 6 节仅暴露 7 个颜色字段，
 * 一个字段可统一作用于多个同语义节点（用户选定颜色会覆盖各节点默认值）。
 * 不含 Doodle 文字颜色 —— 由 builder 按模式只作用于当前模式对应节点。
 */
export const COLOR_BINDINGS: ColorBinding[] = [
  // 主标题/主文案文字颜色
  { field: "titleColor", nodeId: 19, op: "overlayColor" },
  { field: "titleColor", nodeId: 42, op: "overlayColor" },
  { field: "titleColor", nodeId: 74, op: "overlayColor" },
  { field: "titleColor", nodeId: 86, op: "overlayColor" },
  // 副标题/利益点文字颜色
  { field: "subtitleColor", nodeId: 88, op: "overlayColor" },
  // 按钮文字颜色（CR Overlay Text）
  { field: "buttonTextColor", nodeId: 52, op: "overlayColor" },
  { field: "buttonTextColor", nodeId: 69, op: "overlayColor" },
  // 标签文字颜色（CR Overlay Text，文字来自 #103）
  { field: "tagTextColor", nodeId: 104, op: "overlayColor" },
  // 按钮底色（CR Color Panel）
  { field: "buttonBgColor", nodeId: 48, op: "panelColor" },
  { field: "buttonBgColor", nodeId: 65, op: "panelColor" },
  { field: "buttonBgColor", nodeId: 90, op: "panelColor" },
  // 标签底色（CR Color Panel）
  { field: "tagBgColor", nodeId: 101, op: "panelColor" },
];

/** Doodle 专用节点 */
export const DOODLE_NODES = {
  loadImage: 109,
  singleTextNode: 134, // CR Overlay Text 单行文案 + 颜色
  doubleTextNode: 133, // CR Overlay Text 双行文案 + 颜色
  singleSaveNode: 135, // SaveImage doodle1
  doubleSaveNode: 121, // SaveImage doodle2
} as const;

/**
 * 输出尺寸目录。营销图当前在工作流里都是 PreviewImage，
 * 真实输出节点的取图方式待接入 OneThingAI 时确认（见 README / 计划第六点）。
 * id 用作前端识别与下载文件名前缀。
 */
export interface OutputSpec {
  id: string;
  name: string;
  width: number;
  height: number;
  isDoodle: boolean;
  hasAlpha: boolean;
}

export const MARKETING_OUTPUTS: OutputSpec[] = [
  { id: "marketing_750x750_1", name: "750×750 方图", width: 750, height: 750, isDoodle: false, hasAlpha: false },
  { id: "marketing_530x706", name: "530×706 竖图", width: 530, height: 706, isDoodle: false, hasAlpha: false },
  { id: "marketing_750x400", name: "750×400 横版 Banner", width: 750, height: 400, isDoodle: false, hasAlpha: false },
  { id: "marketing_750x750_2", name: "750×750 二楼图", width: 750, height: 750, isDoodle: false, hasAlpha: false },
  { id: "marketing_342x514", name: "342×514 轮播图", width: 342, height: 514, isDoodle: false, hasAlpha: false },
];

export const DOODLE_OUTPUT_SINGLE: OutputSpec = {
  id: "doodle_single",
  name: "Doodle（单行）",
  width: 162,
  height: 162,
  isDoodle: true,
  hasAlpha: true,
};

export const DOODLE_OUTPUT_DOUBLE: OutputSpec = {
  id: "doodle_double",
  name: "Doodle（双行）",
  width: 162,
  height: 162,
  isDoodle: true,
  hasAlpha: true,
};

/** 根据 Doodle 模式返回最终要展示的 6 个输出位 */
export function outputsForMode(mode: "single" | "double"): OutputSpec[] {
  return [
    ...MARKETING_OUTPUTS,
    mode === "single" ? DOODLE_OUTPUT_SINGLE : DOODLE_OUTPUT_DOUBLE,
  ];
}
