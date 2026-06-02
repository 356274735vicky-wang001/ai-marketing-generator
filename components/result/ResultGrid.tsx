"use client";

import { Download, PackageOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
        <h2 className="text-lg font-semibold">生成结果</h2>
        <Button size="sm" onClick={downloadZip} disabled={!hasResult || generating}>
          <PackageOpen /> 下载全部 ZIP
        </Button>
      </div>

      {generating && (
        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="text-sm text-muted-foreground">正在生成 6 张宣传图，请稍候…</p>
            <Progress value={66} />
          </CardContent>
        </Card>
      )}

      {!generating && !hasResult && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
            <Download className="h-6 w-6" />
            <p className="text-sm">上传素材、填写文案后点击「一键生成」，结果将展示在此。</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(generating || hasResult) &&
          specs.map((spec) => (
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
