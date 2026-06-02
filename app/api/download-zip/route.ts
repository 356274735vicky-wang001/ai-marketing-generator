import { NextRequest, NextResponse } from "next/server";
import { getTask } from "@/lib/task-store";
import { transcode } from "@/lib/image/transcode";
import { buildZip, type ZipEntry } from "@/lib/image/zip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get("taskId");
  // format=png（默认）| jpg：控制 ZIP 内图片格式
  const format = (req.nextUrl.searchParams.get("format") ?? "png").toLowerCase();

  if (!taskId) {
    return NextResponse.json({ error: "bad_request", message: "缺少 taskId。" }, { status: 400 });
  }
  if (format !== "png" && format !== "jpg") {
    return NextResponse.json({ error: "bad_request", message: "format 仅支持 png / jpg。" }, { status: 400 });
  }

  const task = getTask(taskId);
  if (!task || task.status !== "success" || task.images.size === 0) {
    return NextResponse.json({ error: "not_found", message: "结果不存在或尚未生成完成。" }, { status: 404 });
  }

  try {
    const entries: ZipEntry[] = [];
    for (const [id, stored] of task.images) {
      // Doodle 默认始终用 PNG 保留透明，即使整体选 jpg
      const useFormat = stored.spec.isDoodle ? "png" : (format as "png" | "jpg");
      const data = await transcode(stored.png, useFormat);
      entries.push({ name: `${id}.${useFormat}`, data });
    }
    const zip = await buildZip(entries);
    return new NextResponse(new Uint8Array(zip), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="marketing_images_${taskId}.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[download-zip] error:", e);
    return NextResponse.json({ error: "zip_failed", message: "ZIP 打包失败。" }, { status: 500 });
  }
}
