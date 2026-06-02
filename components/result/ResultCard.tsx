"use client";

import * as React from "react";
import { Download, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { downloadJpg, downloadPng, pngDataUrl } from "@/lib/client/download";
import type { GeneratedImage } from "@/lib/types";

interface Props {
  /** 输出位元信息（用于占位骨架阶段也能显示尺寸） */
  spec: { id: string; name: string; width: number; height: number; isDoodle: boolean };
  image?: GeneratedImage;
  loading: boolean;
}

export function ResultCard({ spec, image, loading }: Props) {
  const src = image ? pngDataUrl(image) : undefined;

  async function handleDownload(format: "png" | "jpg") {
    if (!image) return;
    if (format === "png") {
      downloadPng(image);
      return;
    }
    if (spec.isDoodle) {
      toast.warning("JPG 不支持透明背景，Doodle 的透明区域将被填充为白色。");
    }
    try {
      await downloadJpg(image);
    } catch {
      toast.error("JPG 转换失败，请重试。");
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        <div className="mb-2">
          <span className="text-sm font-medium">{spec.name}</span>
        </div>

        <div
          className={cn(
            "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border bg-muted/40",
            spec.isDoodle && "checkerboard"
          )}
        >
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : image ? (
            <Dialog>
              <DialogTrigger asChild>
                <button className="group relative h-full w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={spec.name}
                    className="h-full w-full object-contain"
                  />
                  <span className="absolute inset-0 hidden items-center justify-center bg-black/30 text-white group-hover:flex">
                    <Maximize2 className="h-5 w-5" />
                  </span>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{spec.name}</DialogTitle>
                </DialogHeader>
                <div className={cn("flex justify-center rounded-md", spec.isDoodle && "checkerboard")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={spec.name} className="max-h-[70vh] object-contain" />
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <span className="text-xs text-muted-foreground">待生成</span>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={!image}
            onClick={() => handleDownload("png")}
          >
            <Download /> PNG
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={!image}
            onClick={() => handleDownload("jpg")}
          >
            <Download /> JPG
          </Button>
        </div>

        {spec.isDoodle && (
          <p className="mt-2 text-[11px] leading-tight text-muted-foreground">
            PNG 保留透明背景；JPG 不支持透明背景。
          </p>
        )}
      </CardContent>
    </Card>
  );
}
