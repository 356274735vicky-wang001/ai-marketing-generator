"use client";

import { PackageOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResultCard } from "./ResultCard";
import { outputsForMode } from "@/lib/onething/node-map";
import { downloadZip } from "@/lib/client/download";
import type { GeneratedImage } from "@/lib/types";

interface Props {
  mode: "single" | "double";
  generating: boolean;
  images: GeneratedImage[] | null;
}

export function ResultGrid({ mode, generating, images }: Props) {
  const specs = outputsForMode(mode);
  const imageById = new Map<string, GeneratedImage>(
    (images ?? []).map((img) => [img.id, img])
  );
  const hasResult = !!images && images.length > 0;

  async function handleZip() {
    if (!images || images.length === 0) return;
    try {
      await downloadZip(images);
      toast.success("已开始下载 ZIP。");
    } catch {
      toast.error("ZIP 打包失败，请重试。");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">生成结果</h2>
          <p className="text-xs text-muted-foreground">
            {generating
              ? "正在生成 6 张宣传图，请稍候…"
              : hasResult
                ? "点击图片可查看大图，支持单张 PNG / JPG 与全部 ZIP 下载。"
                : "上传素材、填写文案后点击「一键生成」，结果将展示在此。"}
          </p>
        </div>
        <Button size="sm" onClick={handleZip} disabled={!hasResult || generating}>
          <PackageOpen /> 下载全部 ZIP
        </Button>
      </div>

      {/* 默认即展示六宫格占位，生成后原位替换为真实图片 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {specs.map((spec) => (
          <ResultCard
            key={spec.id}
            spec={spec}
            image={imageById.get(spec.id)}
            loading={generating && !imageById.get(spec.id)}
          />
        ))}
      </div>
    </div>
  );
}
