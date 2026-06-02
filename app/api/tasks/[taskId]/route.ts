import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/onething/client";
import { getTask, setTaskError, setTaskImages, type StoredImage, type StoredTask } from "@/lib/task-store";
import { toPng } from "@/lib/image/transcode";
import type { GeneratedImage, TaskResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const task = getTask(taskId);
  if (!task) {
    return NextResponse.json(
      { error: "not_found", message: "任务不存在或已过期。" },
      { status: 404 }
    );
  }

  // 已完成 / 已失败：直接返回
  if (task.status === "success") {
    return NextResponse.json(buildResult(task));
  }
  if (task.status === "failed") {
    return NextResponse.json({
      taskId: task.taskId,
      status: task.status,
      images: [],
      error: task.error,
      createdAt: task.createdAt,
    } satisfies TaskResult);
  }

  // 轮询 provider
  try {
    const provider = getProvider();
    const ctx = { outputs: task.outputs, doodleMode: task.doodleMode };
    const poll = await provider.poll(task.providerTaskId, ctx);

    if (poll.status === "failed") {
      setTaskError(task.taskId, poll.error ?? "生成失败，请稍后重试。");
      return NextResponse.json({
        taskId: task.taskId,
        status: "failed",
        images: [],
        error: poll.error ?? "生成失败，请稍后重试。",
        createdAt: task.createdAt,
      } satisfies TaskResult);
    }

    if (poll.status === "success" && poll.images) {
      const specById = new Map(task.outputs.map((s) => [s.id, s]));
      const stored = new Map<string, StoredImage>();
      for (const img of poll.images) {
        const spec = specById.get(img.id);
        if (!spec) continue;
        stored.set(img.id, { spec, png: await toPng(img.buffer) });
      }
      setTaskImages(task.taskId, stored, "success");
      return NextResponse.json(buildResult(getTask(task.taskId)!));
    }

    // 仍在进行
    return NextResponse.json({
      taskId: task.taskId,
      status: poll.status,
      images: [],
      createdAt: task.createdAt,
    } satisfies TaskResult);
  } catch (e) {
    const message = e instanceof Error ? e.message : "查询任务失败。";
    console.error("[tasks] error:", e);
    setTaskError(task.taskId, message);
    return NextResponse.json(
      { taskId: task.taskId, status: "failed", images: [], error: message, createdAt: task.createdAt } satisfies TaskResult,
      { status: 200 }
    );
  }
}

function buildResult(task: StoredTask): TaskResult {
  const images: GeneratedImage[] = [];
  for (const o of task.outputs) {
    const stored = task.images.get(o.id);
    if (!stored) continue;
    const { spec } = stored;
    images.push({
      id: spec.id,
      name: spec.name,
      width: spec.width,
      height: spec.height,
      isDoodle: spec.isDoodle,
      hasAlpha: spec.hasAlpha,
      pngUrl: `/api/download/${spec.id}?taskId=${encodeURIComponent(task.taskId)}&format=png`,
    });
  }
  return { taskId: task.taskId, status: "success", images, createdAt: task.createdAt };
}
