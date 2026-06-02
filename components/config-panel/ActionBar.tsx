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
    <div className="flex items-center gap-2">
      <Button onClick={onGenerate} disabled={generating} className="flex-1">
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
        <RotateCcw /> 恢复默认
      </Button>
      <Button variant="ghost" onClick={onClear} disabled={generating}>
        <Eraser /> 清空内容
      </Button>
    </div>
  );
}
