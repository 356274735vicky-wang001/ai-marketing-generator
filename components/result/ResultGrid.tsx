"use client";

import { PackageOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResultCard } from "./ResultCard";
import { outputsForMode } from "@/lib/onething/node-map";
import type { GeneratedImage, TaskResult } from "@/lib/types";

interface Props {
  mode: "single" | "double";
  generating: boolean;
  result: TaskResult | null;
}

export function ResultGrid({ mode, generating, result }: Props) {
  const specs = outputsForMode(mode);
  const imageById = new Map<string, GeneratedImage>(
    (result?.images ?? []).map((img) => [img.id, img])
  );
  const hasResult = !!result && result.images.length > 0;

  function downloadZip() {
    if (!result) return;
    const a = document.createElement("a");
    a.href = `/api/download-zip?taskId=${encodeURIComponent(result.taskId)}&format=png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success("正在打包下载 ZIP…");
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
        <Button size="sm" onClick={downloadZip} disabled={!hasResult || generating}>
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
