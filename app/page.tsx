"use client";

import * as React from "react";
import { toast } from "sonner";
import { MaterialUploadCard } from "@/components/config-panel/MaterialUploadCard";
import { DoodleCard } from "@/components/config-panel/DoodleCard";
import { CopyFieldsCard } from "@/components/config-panel/CopyFieldsCard";
import { ColorFieldsCard } from "@/components/config-panel/ColorFieldsCard";
import { ActionBar } from "@/components/config-panel/ActionBar";
import { ResultGrid } from "@/components/result/ResultGrid";
import { DEFAULT_TEXT_FIELDS } from "@/lib/form-schema";
import { isValidHex } from "@/lib/onething/hex";
import type { GenerateTextFields, TaskResult, UploadFieldKey } from "@/lib/types";

type FilesState = Record<UploadFieldKey, File | null>;

const EMPTY_FILES: FilesState = {
  backgroundImage: null,
  productImage: null,
  logoImage: null,
  doodleImage: null,
};

const POLL_INTERVAL = 1200;
const POLL_TIMEOUT = 90_000;

export default function Home() {
  const [files, setFiles] = React.useState<FilesState>(EMPTY_FILES);
  const [fields, setFields] = React.useState<GenerateTextFields>(DEFAULT_TEXT_FIELDS);
  const [generating, setGenerating] = React.useState(false);
  const [result, setResult] = React.useState<TaskResult | null>(null);

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
    const colorKeys: (keyof GenerateTextFields)[] = [
      "titleColor", "subtitleColor", "buttonBgColor", "buttonTextColor",
      "tagBgColor", "tagTextColor", "doodleTextColor",
    ];
    for (const k of colorKeys) {
      if (!isValidHex(fields[k] as string)) return `颜色「${k}」格式不正确（如 #2563EB）。`;
    }
    return null;
  }

  async function pollTask(taskId: string): Promise<TaskResult> {
    const start = Date.now();
    while (Date.now() - start < POLL_TIMEOUT) {
      const res = await fetch(`/api/tasks/${taskId}`, { cache: "no-store" });
      const data = (await res.json()) as TaskResult;
      if (data.status === "success") return data;
      if (data.status === "failed") throw new Error(data.error || "生成失败，请稍后重试。");
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    }
    throw new Error("生成超时，请稍后重试。");
  }

  async function onGenerate() {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    setGenerating(true);
    setResult(null);
    try {
      const fd = new FormData();
      (Object.keys(files) as UploadFieldKey[]).forEach((k) => {
        if (files[k]) fd.append(k, files[k] as File);
      });
      (Object.keys(fields) as (keyof GenerateTextFields)[]).forEach((k) => {
        fd.append(k, String(fields[k]));
      });

      const res = await fetch("/api/generate", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "生成提交失败。");

      const final = await pollTask(data.taskId);
      setResult(final);
      toast.success(`已生成 ${final.images.length} 张图片。`);
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
    setFields({
      ...DEFAULT_TEXT_FIELDS,
      copy750Square: "", copy530x706: "", copy750x400: "",
      title342x514: "", benefit342x514: "",
      buttonText530x706: "", buttonText750x400: "", buttonText342x514: "",
      tagText342x514: "", doodleSingleText: "", doodleDoubleLine1: "", doodleDoubleLine2: "",
    });
    setFiles(EMPTY_FILES);
    setResult(null);
    toast.info("已清空素材与文案。");
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 sm:px-6">
          <h1 className="text-base font-semibold sm:text-lg">AI 营销宣传图生成器</h1>
          <span className="text-xs text-muted-foreground">5 张营销图 + 1 张 Doodle · 一键生成</span>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,460px)_1fr]">
        {/* 左侧配置区 */}
        <section className="space-y-4">
          <MaterialUploadCard files={files} setFile={setFile} />
          <DoodleCard
            doodleImage={files.doodleImage}
            setFile={setFile}
            fields={fields}
            setField={setField}
          />
          <CopyFieldsCard fields={fields} setField={setField} />
          <ColorFieldsCard fields={fields} setField={setField} />
          <ActionBar
            generating={generating}
            onGenerate={onGenerate}
            onReset={onReset}
            onClear={onClear}
          />
        </section>

        {/* 右侧结果区 */}
        <section>
          <ResultGrid mode={fields.doodleMode} generating={generating} result={result} />
        </section>
      </main>
    </div>
  );
}
