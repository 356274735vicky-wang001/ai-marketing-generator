import { NextRequest, NextResponse } from "next/server";
import { getImage } from "@/lib/task-store";
import { transcode, contentType } from "@/lib/image/transcode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  const { imageId } = await params;
  const taskId = req.nextUrl.searchParams.get("taskId");
  const format = (req.nextUrl.searchParams.get("format") ?? "png").toLowerCase();

  if (!taskId) {
    return NextResponse.json({ error: "bad_request", message: "缺少 taskId。" }, { status: 400 });
  }
  if (format !== "png" && format !== "jpg") {
    return NextResponse.json({ error: "bad_request", message: "format 仅支持 png / jpg。" }, { status: 400 });
  }

  const stored = getImage(taskId, imageId);
  if (!stored) {
    return NextResponse.json({ error: "not_found", message: "图片不存在或已过期。" }, { status: 404 });
  }

  try {
    const out = await transcode(stored.png, format);
    // 文件名 = 统一展示名（与左侧标题 / 右侧预览标题一致）；
    // 用 RFC 5987 的 filename* 携带中文/×，并保留 ASCII filename 作为回退。
    const displayName = `${stored.spec.name}.${format}`;
    const asciiFallback = `${imageId}.${format}`;
    return new NextResponse(new Uint8Array(out), {
      status: 200,
      headers: {
        "Content-Type": contentType(format),
        "Content-Disposition": `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(displayName)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[download] transcode error:", e);
    return NextResponse.json({ error: "transcode_failed", message: "图片转换失败。" }, { status: 500 });
  }
}
