/**
 * POST /api/generate/start
 * 短请求：校验输入 → 上传 4 张素材 → 提交 OneThingAI 任务 → 立即返回 taskId。
 * 不在此等待生成完成（避免单个 Serverless 函数长时间阻塞触发 504）。
 */
import { NextRequest, NextResponse } from "next/server";
import { getProvider, getMockProvider, fallbackToMockEnabled } from "@/lib/onething/client";
import { logOneThingDiagnostics } from "@/lib/onething/comfyone";
import { rememberTask } from "@/lib/onething/task-store";
import {
  readUploads,
  parseFields,
  buildSubmitContext,
  badRequest,
  type UploadEntry,
} from "@/lib/onething/generate-flow";
import type { OneThingProvider } from "@/lib/onething/provider";
import type { GenerateTextFields, StartResponse, UploadFieldKey } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 仅做上传 + 提交，实测约 0.5s；保留较宽上限以容忍大图上传，但绝不在此等待生成。
export const maxDuration = 60;

/** 上传素材 + 提交任务，返回 taskId，并记下 ctx 供 status 复用。 */
async function uploadAndSubmit(
  provider: OneThingProvider,
  uploads: UploadEntry[],
  fields: GenerateTextFields
): Promise<string> {
  const refs = {} as Record<UploadFieldKey, string>;
  for (const u of uploads) {
    refs[u.field] = await provider.uploadImage(u.buffer, u.name, u.field);
  }
  const ctx = buildSubmitContext(refs, fields);
  const taskId = await provider.submit(ctx);
  rememberTask(taskId, provider.name, ctx);
  return taskId;
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return badRequest("请求格式错误，需使用 multipart/form-data。");
  }

  const u = await readUploads(form);
  if ("error" in u) return badRequest(u.error);
  const p = parseFields(form);
  if ("error" in p) return badRequest(p.error);

  const provider = getProvider();
  if (provider.name === "real") logOneThingDiagnostics();

  const started = Date.now();
  try {
    const taskId = await uploadAndSubmit(provider, u.uploads, p.fields);
    console.info(
      `[generate/start] provider=${provider.name} 上传+提交完成 | taskId=${taskId} | 耗时 ${Date.now() - started}ms`
    );
    return NextResponse.json({ taskId } satisfies StartResponse);
  } catch (e) {
    const message = e instanceof Error ? e.message : "提交任务失败，请稍后重试。";
    console.error(
      `[generate/start] provider=${provider.name} 失败 | 耗时 ${Date.now() - started}ms |`,
      e instanceof Error ? { name: e.name, message: e.message, cause: (e as { cause?: unknown }).cause, stack: e.stack } : e
    );
    // 真实失败时按开关回退 Mock（默认关闭）
    if (provider.name !== "mock" && fallbackToMockEnabled()) {
      console.warn("[generate/start] 回退到 Mock 提交");
      try {
        const taskId = await uploadAndSubmit(getMockProvider(), u.uploads, p.fields);
        return NextResponse.json({ taskId } satisfies StartResponse);
      } catch (e2) {
        const m2 = e2 instanceof Error ? e2.message : "提交失败。";
        return NextResponse.json({ error: "start_failed", message: m2 }, { status: 502 });
      }
    }
    return NextResponse.json({ error: "start_failed", message }, { status: 502 });
  }
}
