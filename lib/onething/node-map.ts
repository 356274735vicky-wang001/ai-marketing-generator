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
  | "color750Square"
  | "button530BgColor"
  | "button530TextColor"
  | "button750BgColor"
  | "button750TextColor"
  | "tag342BgColor"
  | "tag342TextColor"
  | "button342BgColor"
  | "doodleTextColor"
>;

export interface ColorBinding {
  field: ColorFieldKey;
  nodeId: number;
  op: Extract<EditOp, "overlayColor" | "panelColor">;
}

/**
 * 颜色绑定：每个颜色字段精确作用于「它所属那张图」的单个节点，不跨图共用。
 * 不含 Doodle 文字颜色 —— 由 builder 按模式只作用于当前模式对应节点。
 */
export const COLOR_BINDINGS: ColorBinding[] = [
  // 营销图1（750×750）
  { field: "color750Square", nodeId: 19, op: "overlayColor" }, // 标题颜色
  // 营销图2（530×706）
  { field: "button530BgColor", nodeId: 48, op: "panelColor" }, // 按钮底色
  { field: "button530TextColor", nodeId: 52, op: "overlayColor" }, // 按钮文字颜色
  // 营销图3（750×400）
  { field: "button750BgColor", nodeId: 65, op: "panelColor" }, // 按钮底色
  { field: "button750TextColor", nodeId: 69, op: "overlayColor" }, // 按钮文字颜色
  // 营销图5（342×514）
  { field: "tag342BgColor", nodeId: 101, op: "panelColor" }, // 标签底色
  { field: "tag342TextColor", nodeId: 104, op: "overlayColor" }, // 标签文字颜色
  { field: "button342BgColor", nodeId: 90, op: "panelColor" }, // 按钮底色
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

/**
 * 统一展示名称（唯一数据源）。
 * 左侧配置卡标题、右侧预览卡标题、下载文件名三处都引用这里，保证完全一致。
 * 运营只需看「尺寸 + 用途」，无需理解营销图编号。
 */
export const OUTPUT_NAMES = {
  square750: "750×750 方图",
  vertical530: "530×706 竖图",
  banner750: "750×400 横版Banner",
  floor750: "750×750 二楼图",
  carousel342: "342×514 轮播图",
  doodle: "Doodle 162×162",
} as const;

export const MARKETING_OUTPUTS: OutputSpec[] = [
  { id: "marketing_750x750_1", name: OUTPUT_NAMES.square750, width: 750, height: 750, isDoodle: false, hasAlpha: false },
  { id: "marketing_530x706", name: OUTPUT_NAMES.vertical530, width: 530, height: 706, isDoodle: false, hasAlpha: false },
  { id: "marketing_750x400", name: OUTPUT_NAMES.banner750, width: 750, height: 400, isDoodle: false, hasAlpha: false },
  { id: "marketing_750x750_2", name: OUTPUT_NAMES.floor750, width: 750, height: 750, isDoodle: false, hasAlpha: false },
  { id: "marketing_342x514", name: OUTPUT_NAMES.carousel342, width: 342, height: 514, isDoodle: false, hasAlpha: false },
];

export const DOODLE_OUTPUT_SINGLE: OutputSpec = {
  id: "doodle_single",
  name: OUTPUT_NAMES.doodle,
  width: 162,
  height: 162,
  isDoodle: true,
  hasAlpha: true,
};

export const DOODLE_OUTPUT_DOUBLE: OutputSpec = {
  id: "doodle_double",
  name: OUTPUT_NAMES.doodle,
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
