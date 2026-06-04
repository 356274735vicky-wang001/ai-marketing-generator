/**
 * 生成流程共享逻辑（start / status 两个短请求路由复用）。
 *
 * 这里只承载「校验输入 / 构建 SubmitContext / 把 ProviderImage 映射成响应图片」这些
 * 与单次请求时长无关的纯逻辑；真正的编排（提交 vs 轮询）放在各自路由里。
 *
 * 不改变任何字段映射、尺寸命名、上传字段——与原 /api/generate 完全一致。
 */
import { NextResponse } from "next/server";
import { outputsForMode } from "./node-map";
import { textFieldsSchema, MAX_UPLOAD_BYTES, ACCEPTED_IMAGE_TYPES } from "@/lib/form-schema";
import type { SubmitContext } from "./provider";
import type {
  DoodleMode,
  GeneratedImage,
  GenerateTextFields,
  ProviderImage,
  UploadFieldKey,
} from "@/lib/types";

export const REQUIRED_UPLOADS: { field: UploadFieldKey; label: string }[] = [
  { field: "backgroundImage", label: "背景图" },
  { field: "productImage", label: "主视觉产品图" },
  { field: "logoImage", label: "Logo" },
  { field: "doodleImage", label: "Doodle PNG 素材" },
];

export interface UploadEntry {
  field: UploadFieldKey;
  buffer: Buffer;
  name: string;
}

export function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: "bad_request", message }, { status });
}

/** 校验并读取四个必传素材（一次性读入内存）。 */
export async function readUploads(
  form: FormData
): Promise<{ uploads: UploadEntry[] } | { error: string }> {
  const uploads: UploadEntry[] = [];
  for (const { field, label } of REQUIRED_UPLOADS) {
    const f = form.get(field);
    if (!(f instanceof File) || f.size === 0) return { error: `请先上传${label}。` };
    if (f.size > MAX_UPLOAD_BYTES)
      return { error: "图片过大，请压缩后重新上传（单张上限 10MB）。" };
    if (f.type && !ACCEPTED_IMAGE_TYPES.includes(f.type))
      return { error: `${label}格式不支持，请使用 PNG / JPG / WebP。` };
    uploads.push({
      field,
      buffer: Buffer.from(await f.arrayBuffer()),
      name: f.name || `${field}.png`,
    });
  }
  return { uploads };
}

/** 校验文案 + 颜色字段。 */
export function parseFields(form: FormData): { fields: GenerateTextFields } | { error: string } {
  const raw: Record<string, unknown> = {};
  for (const key of Object.keys(textFieldsSchema.shape)) {
    const v = form.get(key);
    if (v !== null) raw[key] = typeof v === "string" ? v : undefined;
  }
  const parsed = textFieldsSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { error: `字段「${first.path.join(".")}」无效：${first.message}` };
  }
  return { fields: parsed.data as GenerateTextFields };
}

/** 由已上传引用 + 文案构建 SubmitContext（labels 仅供 Mock 渲染占位图）。 */
export function buildSubmitContext(
  refs: Record<UploadFieldKey, string>,
  fields: GenerateTextFields
): SubmitContext {
  const outputs = outputsForMode(fields.doodleMode);
  const labels: Record<string, string> = {
    marketing_750x750_1: fields.copy750Square,
    marketing_530x706: fields.copy530x706,
    marketing_750x400: fields.copy750x400,
    marketing_750x750_2: "",
    marketing_342x514: fields.title342x514,
    doodle_single: fields.doodleSingleText,
    doodle_double: `${fields.doodleDoubleLine1} ${fields.doodleDoubleLine2}`,
  };
  return { outputs, doodleMode: fields.doodleMode, uploaded: refs, fields, labels };
}

/**
 * status 在另一个实例上取不到 store 时的兜底 ctx：
 * 真实 provider.poll 不读 ctx，这份最小 ctx 已足够；Mock 跨实例会缺 labels（仅本地演示场景）。
 */
export function minimalContext(mode: DoodleMode): SubmitContext {
  return {
    outputs: outputsForMode(mode),
    doodleMode: mode,
    uploaded: {} as Record<UploadFieldKey, string>,
    fields: {} as GenerateTextFields,
    labels: {},
  };
}

/** ProviderImage[]（id + 二进制）→ 响应用 GeneratedImage[]（含尺寸/命名/ base64）。 */
export function mapProviderImages(
  providerImages: ProviderImage[],
  mode: DoodleMode
): GeneratedImage[] {
  const specById = new Map(outputsForMode(mode).map((s) => [s.id, s]));
  const images: GeneratedImage[] = [];
  for (const img of providerImages) {
    const spec = specById.get(img.id);
    if (!spec) continue;
    images.push({
      id: spec.id,
      name: spec.name,
      width: spec.width,
      height: spec.height,
      isDoodle: spec.isDoodle,
      hasAlpha: spec.hasAlpha,
      pngBase64: img.buffer.toString("base64"),
    });
  }
  return images;
}
