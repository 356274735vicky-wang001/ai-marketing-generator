/**
 * ComfyOne 输入/输出映射（真实调用专用）。
 *
 * 字段名与输出节点 ID 已根据 workflow/一键换图生图_API.json（ComfyUI API 格式）核对确认。
 * 节点 ID 来源：lib/onething/node-map.ts（与编辑器格式一致）。
 */
import {
  IMAGE_BINDINGS,
  TEXT_BINDINGS,
  COLOR_BINDINGS,
  DOODLE_NODES,
} from "./node-map";
import { normalizeHexForComfy } from "./hex";
import type { GenerateTextFields, UploadFieldKey } from "@/lib/types";
import type { ComfyOnePromptInput } from "./comfyone";

/** 各节点类型在 API 格式里的真实 input 字段名（已核对）。 */
export const PARAM_KEYS = {
  loadImage: "image", // LoadImage 图片
  crText: "text", // CR Text 文本
  overlayText: "text", // CR Overlay Text 文本
  overlayColor: "font_color_hex", // CR Overlay Text 文字颜色（hex，不带 #）
  panelColor: "fill_color_hex", // CR Color Panel 颜色（hex，不带 #）
} as const;

/**
 * 注册工作流时声明的 outputs 顺序（固定）。
 * 真实任务返回的 images[] 严格按此顺序回填。包含两个 Doodle 输出，
 * 上层再按当前模式只保留对应那一张。
 */
export const REGISTERED_OUTPUTS: { ourId: string; nodeId: string }[] = [
  { ourId: "marketing_750x750_1", nodeId: "24" }, // 750×750 方图（终端 Image Overlay #22）
  { ourId: "marketing_530x706", nodeId: "54" }, // 530×706 竖图（终端 #52）
  { ourId: "marketing_750x400", nodeId: "68" }, // 750×400 横版（终端 #69）
  { ourId: "marketing_750x750_2", nodeId: "80" }, // 二楼图（终端 Image Overlay #79）
  { ourId: "marketing_342x514", nodeId: "107" }, // 342×514 轮播图（终端 #104）
  { ourId: "doodle_single", nodeId: "135" }, // Doodle 单行 SaveImage
  { ourId: "doodle_double", nodeId: "121" }, // Doodle 双行 SaveImage
];

/** ComfyUI 颜色字段用不带 # 的 hex（与工作流默认值一致，如 "003074"/"FFE648"）。 */
function hex(v: string): string {
  return normalizeHexForComfy(v, false);
}

/**
 * 文案清洗（传给 ComfyUI 前）：
 * - CRLF/CR → LF（textarea 提交会带 \r，ComfyUI 会把 \r 渲染成方块 □）
 * - 去除除 \n 外的所有 C0/C1 控制字符与 DEL
 * - 去除零宽字符 / BOM
 * - 去首尾空白；不拼接任何额外字符
 */
export function sanitizeText(s: string): string {
  return s
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

/**
 * 构建 POST /v1/prompts 的 inputs：按节点 ID 聚合 params（一个节点可同时有文本+颜色）。
 */
export function buildPromptInputs(
  uploaded: Record<UploadFieldKey, string>,
  fields: GenerateTextFields,
  mode: "single" | "double"
): ComfyOnePromptInput[] {
  const byNode = new Map<string, Record<string, unknown>>();
  const put = (nodeId: number | string, key: string, value: unknown) => {
    const id = String(nodeId);
    const cur = byNode.get(id) ?? {};
    cur[key] = value;
    byNode.set(id, cur);
  };

  // 图片
  (Object.keys(IMAGE_BINDINGS) as UploadFieldKey[]).forEach((field) => {
    const ref = uploaded[field];
    if (ref) put(IMAGE_BINDINGS[field], PARAM_KEYS.loadImage, ref);
  });

  // 营销图文案（清洗后再传）
  for (const b of TEXT_BINDINGS) {
    const v = fields[b.field];
    if (typeof v !== "string") continue;
    const key = b.op === "crText" ? PARAM_KEYS.crText : PARAM_KEYS.overlayText;
    put(b.nodeId, key, sanitizeText(v));
  }

  // 颜色
  for (const b of COLOR_BINDINGS) {
    const v = fields[b.field];
    if (typeof v !== "string" || !v) continue;
    const key = b.op === "panelColor" ? PARAM_KEYS.panelColor : PARAM_KEYS.overlayColor;
    put(b.nodeId, key, hex(v));
  }

  // Doodle（按模式只改对应节点，文案同样清洗）
  if (mode === "single") {
    put(DOODLE_NODES.singleTextNode, PARAM_KEYS.overlayText, sanitizeText(fields.doodleSingleText));
    if (fields.doodleTextColor)
      put(DOODLE_NODES.singleTextNode, PARAM_KEYS.overlayColor, hex(fields.doodleTextColor));
  } else {
    const line1 = sanitizeText(fields.doodleDoubleLine1);
    const line2 = sanitizeText(fields.doodleDoubleLine2);
    put(DOODLE_NODES.doubleTextNode, PARAM_KEYS.overlayText, `${line1}\n${line2}`);
    if (fields.doodleTextColor)
      put(DOODLE_NODES.doubleTextNode, PARAM_KEYS.overlayColor, hex(fields.doodleTextColor));
  }

  return [...byNode.entries()].map(([id, params]) => ({ id, params }));
}
