/**
 * ComfyOne 输入/输出映射（真实调用专用）。
 *
 * ⚠️ 待核对（需要 ComfyUI「API 格式」导出的工作流 JSON 才能定稿）：
 *   ComfyOne 的 inputs[].params 的键名 = 各节点在 API 格式里的真实 input 字段名。
 *   下面的 PARAM_KEYS 与 OUTPUT_NODES 是依据现有编辑器格式 JSON 的「最佳推断」，
 *   拿到 API 格式 JSON 后只需在本文件订正这两处即可，其余调用逻辑无需改动。
 *
 * 节点 ID 来源：lib/onething/node-map.ts（已与编辑器格式 JSON 核对）。
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

/** ⚠️ 待核对：各节点类型在 API 格式里的 input 字段名 */
export const PARAM_KEYS = {
  loadImage: "image", // LoadImage 的图片输入
  crText: "text", // CR Text 文本
  overlayText: "text", // CR Overlay Text 文本
  overlayColor: "font_color", // CR Overlay Text 文字颜色（待核对）
  panelColor: "panel_color", // CR Color Panel 颜色（待核对）
} as const;

/** ⚠️ 待核对：每张图最终输出节点 ID（应为分支末端 Save/PreviewImage） */
export const MARKETING_OUTPUT_NODES: { ourId: string; nodeId: string }[] = [
  { ourId: "marketing_750x750_1", nodeId: "24" },
  { ourId: "marketing_530x706", nodeId: "54" },
  { ourId: "marketing_750x400", nodeId: "68" },
  { ourId: "marketing_750x750_2", nodeId: "80" },
  { ourId: "marketing_342x514", nodeId: "107" },
];
export const DOODLE_OUTPUT_NODE = { single: "135", double: "121" } as const;

/** 当前模式下，提交给 ComfyOne 的 outputs（节点 ID）+ 回填用的 ourId（顺序一致） */
export function outputNodesForMode(mode: "single" | "double"): { ourId: string; nodeId: string }[] {
  return [
    ...MARKETING_OUTPUT_NODES,
    {
      ourId: mode === "single" ? "doodle_single" : "doodle_double",
      nodeId: DOODLE_OUTPUT_NODE[mode],
    },
  ];
}

function withHash(hex: string): string {
  return `#${normalizeHexForComfy(hex)}`;
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

  // 营销图文案
  for (const b of TEXT_BINDINGS) {
    const v = fields[b.field];
    if (typeof v !== "string") continue;
    const key = b.op === "crText" ? PARAM_KEYS.crText : PARAM_KEYS.overlayText;
    put(b.nodeId, key, v);
  }

  // 颜色
  for (const b of COLOR_BINDINGS) {
    const v = fields[b.field];
    if (typeof v !== "string" || !v) continue;
    const key = b.op === "panelColor" ? PARAM_KEYS.panelColor : PARAM_KEYS.overlayColor;
    put(b.nodeId, key, withHash(v));
  }

  // Doodle（按模式只改对应节点）
  if (mode === "single") {
    put(DOODLE_NODES.singleTextNode, PARAM_KEYS.overlayText, fields.doodleSingleText);
    if (fields.doodleTextColor)
      put(DOODLE_NODES.singleTextNode, PARAM_KEYS.overlayColor, withHash(fields.doodleTextColor));
  } else {
    put(DOODLE_NODES.doubleTextNode, PARAM_KEYS.overlayText, `${fields.doodleDoubleLine1}\n${fields.doodleDoubleLine2}`);
    if (fields.doodleTextColor)
      put(DOODLE_NODES.doubleTextNode, PARAM_KEYS.overlayColor, withHash(fields.doodleTextColor));
  }

  return [...byNode.entries()].map(([id, params]) => ({ id, params }));
}
