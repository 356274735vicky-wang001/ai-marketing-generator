/**
 * 动态工作流构建器。
 *
 * 不写死 widgets_values 结构：每次都读取实际 JSON 节点，按节点 type 校验后，
 * 动态决定替换位置（文本=首项，颜色=末项），并保留颜色原有的 # 风格。
 */
import workflowJson from "@/workflow/一键换图生图_final.json";
import type { GenerateTextFields, UploadFieldKey } from "@/lib/types";
import { applyHexPreservingStyle } from "./hex";
import {
  COLOR_BINDINGS,
  DOODLE_NODES,
  EXPECTED_TYPE,
  IMAGE_BINDINGS,
  TEXT_BINDINGS,
  type EditOp,
} from "./node-map";

/** ComfyUI 节点的最小结构 */
interface WorkflowNode {
  id: number;
  type: string;
  title?: string;
  widgets_values?: unknown[];
  [k: string]: unknown;
}
interface Workflow {
  nodes: WorkflowNode[];
  [k: string]: unknown;
}

/** 上传后用于写入 LoadImage 的引用（文件名或 OneThingAI 文件 ID） */
export type UploadedRefs = Record<UploadFieldKey, string>;

export interface BuildResult {
  workflow: Workflow;
  /** 记录所有改动，便于调试与单测 */
  edits: Array<{ nodeId: number; op: EditOp; index: number; value: unknown }>;
  warnings: string[];
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** 校验并返回节点；type 不匹配时抛错，缺失时记 warning 返回 undefined */
function resolveNode(
  index: Map<number, WorkflowNode>,
  nodeId: number,
  op: EditOp,
  warnings: string[]
): WorkflowNode | undefined {
  const node = index.get(nodeId);
  if (!node) {
    warnings.push(`节点 #${nodeId} 不存在，跳过 ${op}`);
    return undefined;
  }
  const expected = EXPECTED_TYPE[op];
  if (node.type !== expected) {
    throw new Error(
      `节点 #${nodeId} 类型不符：期望 ${expected}，实际 ${node.type}（操作 ${op}）`
    );
  }
  if (!Array.isArray(node.widgets_values)) {
    warnings.push(`节点 #${nodeId} 无 widgets_values，跳过 ${op}`);
    return undefined;
  }
  return node;
}

function setFirst(
  node: WorkflowNode,
  value: string,
  op: EditOp,
  edits: BuildResult["edits"]
) {
  node.widgets_values![0] = value;
  edits.push({ nodeId: node.id, op, index: 0, value });
}

function setColorLast(
  node: WorkflowNode,
  hex: string,
  op: EditOp,
  edits: BuildResult["edits"]
) {
  const wv = node.widgets_values!;
  const idx = wv.length - 1;
  wv[idx] = applyHexPreservingStyle(wv[idx], hex);
  edits.push({ nodeId: node.id, op, index: idx, value: wv[idx] });
}

/**
 * 构建一次工作流副本。
 * @param uploaded 各 LoadImage 节点要写入的图片引用
 * @param fields   文案 + 颜色字段
 */
export function buildWorkflow(
  uploaded: UploadedRefs,
  fields: GenerateTextFields
): BuildResult {
  const workflow = deepClone(workflowJson) as unknown as Workflow;
  const index = new Map<number, WorkflowNode>();
  for (const n of workflow.nodes) index.set(n.id, n);

  const edits: BuildResult["edits"] = [];
  const warnings: string[] = [];

  // 1) 图片节点
  (Object.keys(IMAGE_BINDINGS) as UploadFieldKey[]).forEach((field) => {
    const nodeId = IMAGE_BINDINGS[field];
    const ref = uploaded[field];
    if (!ref) {
      warnings.push(`上传字段 ${field} 无引用，LoadImage #${nodeId} 保留默认`);
      return;
    }
    const node = resolveNode(index, nodeId, "loadImage", warnings);
    if (node) setFirst(node, ref, "loadImage", edits);
  });

  // 2) 营销图文案
  for (const b of TEXT_BINDINGS) {
    const value = fields[b.field];
    if (typeof value !== "string") continue;
    const node = resolveNode(index, b.nodeId, b.op, warnings);
    if (node) setFirst(node, value, b.op, edits);
  }

  // 3) 营销图/标签颜色
  for (const b of COLOR_BINDINGS) {
    const value = fields[b.field];
    if (typeof value !== "string" || !value) continue;
    const node = resolveNode(index, b.nodeId, b.op, warnings);
    if (node) setColorLast(node, value, b.op, edits);
  }

  // 4) Doodle 独立分支：按模式只改对应文案节点 + 颜色
  applyDoodle(index, fields, edits, warnings);

  return { workflow, edits, warnings };
}

function applyDoodle(
  index: Map<number, WorkflowNode>,
  fields: GenerateTextFields,
  edits: BuildResult["edits"],
  warnings: string[]
) {
  const color = fields.doodleTextColor;

  if (fields.doodleMode === "single") {
    const node = resolveNode(index, DOODLE_NODES.singleTextNode, "overlayContent", warnings);
    if (node) {
      setFirst(node, fields.doodleSingleText, "overlayContent", edits);
      if (color) setColorLast(node, color, "overlayColor", edits);
    }
  } else {
    const node = resolveNode(index, DOODLE_NODES.doubleTextNode, "overlayContent", warnings);
    if (node) {
      const text = `${fields.doodleDoubleLine1}\n${fields.doodleDoubleLine2}`;
      setFirst(node, text, "overlayContent", edits);
      if (color) setColorLast(node, color, "overlayColor", edits);
    }
  }
}
