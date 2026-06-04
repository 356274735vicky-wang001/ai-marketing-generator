/**
 * GET /api/generate/status?taskId=...&mode=single|double
 * 短请求：查询一次任务状态。
 * - running  → { status: "running" }（前端继续轮询）
 * - failed   → { status: "failed", message }（前端展示错误并停止）
 * - finished → 服务端下载结果图并返回 base64：{ status: "success", images }
 *
 * 真实 provider.poll 仅凭 taskId 查询 OneThingAI，不依赖请求间状态；mode 用于把结果映射回 6 个输出位。
 */
import { NextRequest, NextResponse } from "next/server";
import { getProvider, getMockProvider } from "@/lib/onething/client";
import { recallTask, forgetTask } from "@/lib/onething/task-store";
import { mapProviderImages, minimalContext } from "@/lib/onething/generate-flow";
import type { DoodleMode, StatusResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 单次查询（含完成时下载 6 张图）实测约 1s；远低于函数上限。
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");
  const mode: DoodleMode = searchParams.get("mode") === "double" ? "double" : "single";

  if (!taskId) {
    return NextResponse.json(
      { status: "failed", message: "缺少 taskId。" } satisfies StatusResponse,
      { status: 400 }
    );
  }

  const recalled = recallTask(taskId);
  const provider = recalled?.provider === "mock" ? getMockProvider() : getProvider();
  const ctx = recalled?.ctx ?? minimalContext(mode);

  const started = Date.now();
  try {
    const r = await provider.poll(taskId, ctx);
    const ms = Date.now() - started;

    if (r.status === "failed") {
      console.warn(`[generate/status] taskId=${taskId} status=failed | 耗时 ${ms}ms | ${r.error ?? ""}`);
      forgetTask(taskId);
      return NextResponse.json(
        { status: "failed", message: r.error || "生成失败，请稍后重试。" } satisfies StatusResponse
      );
    }

    if (r.status !== "success" || !r.images) {
      console.info(`[generate/status] taskId=${taskId} status=running | 耗时 ${ms}ms`);
      return NextResponse.json({ status: "running" } satisfies StatusResponse);
    }

    // finished：映射回 6 个输出位（按 mode 只保留对应 Doodle），返回 base64。
    const images = mapProviderImages(r.images, ctx.doodleMode);
    console.info(`[generate/status] taskId=${taskId} status=success | 耗时 ${ms}ms | ${images.length} 张`);
    forgetTask(taskId);
    if (images.length === 0) {
      return NextResponse.json(
        { status: "failed", message: "生成结果为空，请稍后重试。" } satisfies StatusResponse
      );
    }
    return NextResponse.json({ status: "success", images } satisfies StatusResponse);
  } catch (e) {
    // 单次查询异常（网络抖动等，底层 fetch 已对瞬时错误重试过）：不判死，返回 running 让前端继续轮询。
    // 任务仍在 OneThingAI 侧运行；持续失败由前端 4 分钟总预算兜底。
    const ms = Date.now() - started;
    console.error(
      `[generate/status] taskId=${taskId} 查询异常（继续轮询）| 耗时 ${ms}ms |`,
      e instanceof Error ? { name: e.name, message: e.message, cause: (e as { cause?: unknown }).cause } : e
    );
    return NextResponse.json({ status: "running" } satisfies StatusResponse);
  }
}
