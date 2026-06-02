import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/onething/client";
import { buildWorkflow, type UploadedRefs } from "@/lib/onething/workflow-builder";
import { outputsForMode } from "@/lib/onething/node-map";
import { textFieldsSchema, MAX_UPLOAD_BYTES, ACCEPTED_IMAGE_TYPES } from "@/lib/form-schema";
import { createTask } from "@/lib/task-store";
import type { GenerateTextFields, UploadFieldKey } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REQUIRED_UPLOADS: { field: UploadFieldKey; label: string }[] = [
  { field: "backgroundImage", label: "背景图" },
  { field: "productImage", label: "主视觉产品图" },
  { field: "logoImage", label: "Logo" },
  { field: "doodleImage", label: "Doodle PNG 素材" },
];

function err(message: string, status = 400) {
  return NextResponse.json({ error: "bad_request", message }, { status });
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return err("请求格式错误，需使用 multipart/form-data。");
  }

  // 1) 校验并读取文件
  const uploads: Partial<Record<UploadFieldKey, File>> = {};
  for (const { field, label } of REQUIRED_UPLOADS) {
    const f = form.get(field);
    if (!(f instanceof File) || f.size === 0) {
      return err(`请先上传${label}。`);
    }
    if (f.size > MAX_UPLOAD_BYTES) {
      return err("图片过大，请压缩后重新上传（单张上限 10MB）。");
    }
    if (f.type && !ACCEPTED_IMAGE_TYPES.includes(f.type)) {
      return err(`${label}格式不支持，请使用 PNG / JPG / WebP。`);
    }
    uploads[field] = f;
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

  try {
    const provider = getProvider();

    // 3) 上传素材，取回写入 LoadImage 的引用
    const refs = {} as UploadedRefs;
    for (const { field } of REQUIRED_UPLOADS) {
      const file = uploads[field]!;
      const buffer = Buffer.from(await file.arrayBuffer());
      refs[field] = await provider.uploadImage(buffer, file.name || `${field}.png`, field);
    }

    // 4) 动态替换工作流节点
    const { workflow, warnings } = buildWorkflow(refs, fields);
    if (warnings.length) console.warn("[generate] workflow warnings:", warnings);

    // 5) 提交运行
    const outputs = outputsForMode(fields.doodleMode);
    const ctx = { outputs, doodleMode: fields.doodleMode };
    const providerTaskId = await provider.submit(workflow, ctx);

    // 6) 落库任务
    const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    createTask({
      taskId,
      providerTaskId,
      status: "running",
      doodleMode: fields.doodleMode,
      outputs,
      images: new Map(),
      createdAt: Date.now(),
    });

    return NextResponse.json({ taskId, status: "running" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "生成提交失败，请稍后重试。";
    console.error("[generate] error:", e);
    return NextResponse.json({ error: "generate_failed", message }, { status: 502 });
  }
}
