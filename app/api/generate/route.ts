import { NextRequest, NextResponse } from "next/server";
import { getProvider, getMockProvider, fallbackToMockEnabled } from "@/lib/onething/client";
import type { OneThingProvider, SubmitContext } from "@/lib/onething/provider";
import { outputsForMode } from "@/lib/onething/node-map";
import { textFieldsSchema, MAX_UPLOAD_BYTES, ACCEPTED_IMAGE_TYPES } from "@/lib/form-schema";
import type {
  GenerateResponse,
  GeneratedImage,
  GenerateTextFields,
  ProviderImage,
  UploadFieldKey,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 真实生成是异步任务，函数需保持存活轮询；放宽时长上限
export const maxDuration = 60;

// 轮询参数（真实任务）
const POLL_INTERVAL_MS = 2000;
const POLL_BUDGET_MS = 55_000;

const REQUIRED_UPLOADS: { field: UploadFieldKey; label: string }[] = [
  { field: "backgroundImage", label: "背景图" },
  { field: "productImage", label: "主视觉产品图" },
  { field: "logoImage", label: "Logo" },
  { field: "doodleImage", label: "Doodle PNG 素材" },
];

function err(message: string, status = 400) {
  return NextResponse.json({ error: "bad_request", message }, { status });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 用某个 provider 跑完整流程：上传 → 提交 → 轮询直至终态 → 取回图片 */
async function runWith(
  provider: OneThingProvider,
  uploads: { field: UploadFieldKey; buffer: Buffer; name: string }[],
  fields: GenerateTextFields
): Promise<ProviderImage[]> {
  // 上传素材
  const refs = {} as Record<UploadFieldKey, string>;
  for (const u of uploads) {
    refs[u.field] = await provider.uploadImage(u.buffer, u.name, u.field);
  }

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
  const ctx: SubmitContext = {
    outputs,
    doodleMode: fields.doodleMode,
    uploaded: refs,
    fields,
    labels,
  };

  const taskId = await provider.submit(ctx);

  const start = Date.now();
  for (;;) {
    const r = await provider.poll(taskId, ctx);
    if (r.status === "success" && r.images) return r.images;
    if (r.status === "failed") throw new Error(r.error || "生成失败，请稍后重试。");
    if (Date.now() - start > POLL_BUDGET_MS) throw new Error("生成超时，请稍后重试。");
    await sleep(POLL_INTERVAL_MS);
  }
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return err("请求格式错误，需使用 multipart/form-data。");
  }

  // 1) 校验并读取文件（一次性读入内存，供真实/兜底两条路径复用）
  const uploads: { field: UploadFieldKey; buffer: Buffer; name: string }[] = [];
  for (const { field, label } of REQUIRED_UPLOADS) {
    const f = form.get(field);
    if (!(f instanceof File) || f.size === 0) return err(`请先上传${label}。`);
    if (f.size > MAX_UPLOAD_BYTES) return err("图片过大，请压缩后重新上传（单张上限 10MB）。");
    if (f.type && !ACCEPTED_IMAGE_TYPES.includes(f.type))
      return err(`${label}格式不支持，请使用 PNG / JPG / WebP。`);
    uploads.push({ field, buffer: Buffer.from(await f.arrayBuffer()), name: f.name || `${field}.png` });
  }

  // 2) 校验文案 + 颜色
  const raw: Record<string, unknown> = {};
  for (const key of Object.keys(textFieldsSchema.shape)) {
    const v = form.get(key);
    if (v !== null) raw[key] = typeof v === "string" ? v : undefined;
  }
  const parsed = textFieldsSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return err(`字段「${first.path.join(".")}」无效：${first.message}`);
  }
  const fields = parsed.data as GenerateTextFields;

  // 3) 生成（真实失败时按开关回退 Mock）
  const provider = getProvider();
  let providerImages: ProviderImage[];
  try {
    providerImages = await runWith(provider, uploads, fields);
  } catch (e) {
    const message = e instanceof Error ? e.message : "生成失败，请稍后重试。";
    console.error("[generate] provider error:", message);
    if (provider.name !== "mock" && fallbackToMockEnabled()) {
      console.warn("[generate] 回退到 Mock 生成");
      try {
        providerImages = await runWith(getMockProvider(), uploads, fields);
      } catch (e2) {
        const m2 = e2 instanceof Error ? e2.message : "生成失败。";
        return NextResponse.json({ error: "generate_failed", message: m2 }, { status: 502 });
      }
    } else {
      return NextResponse.json({ error: "generate_failed", message }, { status: 502 });
    }
  }

  // 4) 内联返回 base64（前端用 data URL 预览/下载，无跨实例状态依赖）
  const specById = new Map(outputsForMode(fields.doodleMode).map((s) => [s.id, s]));
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
  if (images.length === 0) {
    return NextResponse.json(
      { error: "empty_result", message: "生成结果为空，请稍后重试。" },
      { status: 502 }
    );
  }
  return NextResponse.json({ images } satisfies GenerateResponse);
}
