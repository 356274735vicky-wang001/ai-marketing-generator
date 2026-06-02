"use client";

import { Loader2, Sparkles, RotateCcw, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  generating: boolean;
  onGenerate: () => void;
  onReset: () => void;
  onClear: () => void;
}

export function ActionBar({ generating, onGenerate, onReset, onClear }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={onGenerate} disabled={generating} size="lg" className="flex-1 min-w-[160px]">
        {generating ? (
          <>
            <Loader2 className="animate-spin" /> 正在生成…
          </>
        ) : (
          <>
            <Sparkles /> 一键生成
          </>
        )}
      </Button>
      <Button variant="outline" onClick={onReset} disabled={generating}>
        <RotateCcw /> 重置默认值
      </Button>
      <Button variant="ghost" onClick={onClear} disabled={generating}>
        <Eraser /> 清空输入
      </Button>
    </div>
  );
}
