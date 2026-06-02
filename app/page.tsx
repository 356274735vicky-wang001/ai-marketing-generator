"use client";

import * as React from "react";
import { toast } from "sonner";
import { MaterialUploadCard } from "@/components/config-panel/MaterialUploadCard";
import { DoodleCard } from "@/components/config-panel/DoodleCard";
import { MarketingConfigCard } from "@/components/config-panel/MarketingConfigCard";
import { ActionBar } from "@/components/config-panel/ActionBar";
import { ResultGrid } from "@/components/result/ResultGrid";
import { DEFAULT_TEXT_FIELDS } from "@/lib/form-schema";
import { isValidHex } from "@/lib/onething/hex";
import type { GeneratedImage, GenerateResponse, GenerateTextFields, UploadFieldKey } from "@/lib/types";

type FilesState = Record<UploadFieldKey, File | null>;

const EMPTY_FILES: FilesState = {
  backgroundImage: null,
  productImage: null,
  logoImage: null,
  doodleImage: null,
};

export default function Home() {
  const [files, setFiles] = React.useState<FilesState>(EMPTY_FILES);
  const [fields, setFields] = React.useState<GenerateTextFields>(DEFAULT_TEXT_FIELDS);
  const [generating, setGenerating] = React.useState(false);
  const [images, setImages] = React.useState<GeneratedImage[] | null>(null);

  const setFile = React.useCallback((key: UploadFieldKey, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
  }, []);

  const setField = React.useCallback(
    <K extends keyof GenerateTextFields>(k: K, v: GenerateTextFields[K]) => {
      setFields((prev) => ({ ...prev, [k]: v }));
    },
    []
  );

  function validate(): string | null {
    if (!files.backgroundImage) return "请先上传背景图。";
    if (!files.productImage) return "请先上传主视觉产品图。";
    if (!files.logoImage) return "请先上传 Logo。";
    if (!files.doodleImage) return "请上传 Doodle PNG 素材。";
    // 校验所有颜色字段（字段名均以 Color 结尾）
    const colorKeys = (Object.keys(fields) as (keyof GenerateTextFields)[]).filter((k) =>
      k.endsWith("Color")
    );
    for (const k of colorKeys) {
      if (!isValidHex(fields[k] as string)) return `颜色「${k}」格式不正确（如 #2563EB）。`;
    }
    return null;
  }

  async function onGenerate() {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    setGenerating(true);
    setImages(null);
    try {
      const fd = new FormData();
      (Object.keys(files) as UploadFieldKey[]).forEach((k) => {
        if (files[k]) fd.append(k, files[k] as File);
      });
      (Object.keys(fields) as (keyof GenerateTextFields)[]).forEach((k) => {
        fd.append(k, String(fields[k]));
      });

      const res = await fetch("/api/generate", { method: "POST", body: fd });
      const data = (await res.json()) as GenerateResponse & { message?: string };
      if (!res.ok || !data.images) throw new Error(data.message || "生成失败，请稍后重试。");

      setImages(data.images);
      toast.success(`已生成 ${data.images.length} 张图片。`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "生成失败，请稍后重试。");
    } finally {
      setGenerating(false);
    }
  }

  function onReset() {
    setFields(DEFAULT_TEXT_FIELDS);
    toast.info("已重置为默认文案与颜色。");
  }

  function onClear() {
    // 清空所有文案，保留颜色与模式默认值
    setFields({
      ...DEFAULT_TEXT_FIELDS,
      copy750Square: "", copy530x706: "", copy750x400: "",
      title342x514: "", benefit342x514: "", tagText342x514: "",
      buttonText530x706: "", buttonText750x400: "", buttonText342x514: "",
      doodleSingleText: "", doodleDoubleLine1: "", doodleDoubleLine2: "",
    });
    setFiles(EMPTY_FILES);
    setImages(null);
    toast.info("已清空素材与文案。");
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* 顶部标题 */}
      <header className="z-40 shrink-0 border-b bg-background/80 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <h1 className="text-base font-semibold sm:text-lg">AI 营销宣传图生成器</h1>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            5 张营销图 + 1 张 Doodle · 一键生成
          </span>
        </div>
      </header>

      {/* 主体：移动端整体滚动；lg 起左右独立滚动 */}
      <div className="min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[440px_1fr] lg:overflow-hidden">
        {/* 左侧配置区：内容滚动 + 底部 Sticky 操作栏 */}
        <aside className="flex flex-col lg:h-full lg:min-h-0 lg:border-r">
          <div className="min-h-0 flex-1 space-y-3 p-4 lg:overflow-y-auto">
            <MaterialUploadCard files={files} setFile={setFile} />
            <DoodleCard
              doodleImage={files.doodleImage}
              setFile={setFile}
              fields={fields}
              setField={setField}
            />
            <MarketingConfigCard fields={fields} setField={setField} />
          </div>
          <div className="sticky bottom-0 shrink-0 border-t bg-background/95 p-3 backdrop-blur">
            <ActionBar
              generating={generating}
              onGenerate={onGenerate}
              onReset={onReset}
              onClear={onClear}
            />
          </div>
        </aside>

        {/* 右侧结果区：独立滚动 */}
        <main className="p-4 sm:p-6 lg:h-full lg:min-h-0 lg:overflow-y-auto">
          <ResultGrid mode={fields.doodleMode} generating={generating} images={images} />
        </main>
      </div>
    </div>
  );
}
