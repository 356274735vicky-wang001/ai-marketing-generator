"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ColorField } from "@/components/ColorField";
import { OUTPUT_NAMES } from "@/lib/onething/node-map";
import type { GenerateTextFields } from "@/lib/types";

interface Props {
  fields: GenerateTextFields;
  setField: <K extends keyof GenerateTextFields>(k: K, v: GenerateTextFields[K]) => void;
}

type FieldDef = {
  key: keyof GenerateTextFields;
  label: string;
  kind: "text" | "textarea" | "color";
  ph?: string;
};

type Group = {
  value: string;
  /** 与右侧预览卡、下载文件名完全一致的统一名称 */
  title: string;
  fields: FieldDef[];
  note?: string;
};

/**
 * 每张卡片 = 一张具体输出图，卡内只放「实际影响该图」的配置项（文案 + 颜色）。
 * 卡片标题统一引用 OUTPUT_NAMES，与右侧预览标题、下载文件名三处一致。
 * 不按尺寸合并；两张 750×750（方图 / 二楼图）各自独立。
 */
const GROUPS: Group[] = [
  {
    value: "g1",
    title: OUTPUT_NAMES.square750,
    fields: [
      { key: "copy750Square", label: "主文案", kind: "textarea", ph: "出行抽一抽\n领假日券包" },
      { key: "color750Square", label: "标题颜色", kind: "color" },
    ],
  },
  {
    value: "g2",
    title: OUTPUT_NAMES.vertical530,
    fields: [
      { key: "copy530x706", label: "主文案", kind: "textarea", ph: "出行抽一抽\n领假日券包" },
      { key: "buttonText530x706", label: "按钮文字", kind: "text", ph: "立即查看" },
      { key: "button530BgColor", label: "按钮底色", kind: "color" },
      { key: "button530TextColor", label: "按钮文字颜色", kind: "color" },
    ],
  },
  {
    value: "g3",
    title: OUTPUT_NAMES.banner750,
    fields: [
      { key: "copy750x400", label: "主文案", kind: "textarea", ph: "出行抽一抽\n领假日券包" },
      { key: "buttonText750x400", label: "按钮文字", kind: "text", ph: "立即查看" },
      { key: "button750BgColor", label: "按钮底色", kind: "color" },
      { key: "button750TextColor", label: "按钮文字颜色", kind: "color" },
    ],
  },
  {
    value: "g4",
    title: OUTPUT_NAMES.floor750,
    fields: [],
    note: "二楼图为纯视觉合成，使用上方背景图 / 主视觉 / Logo，无独立文案与颜色节点。",
  },
  {
    value: "g5",
    title: OUTPUT_NAMES.carousel342,
    fields: [
      { key: "title342x514", label: "标题文案", kind: "text", ph: "主题六个字内" },
      { key: "benefit342x514", label: "利益点文案", kind: "text", ph: "利益点文案九个字内" },
      { key: "tagText342x514", label: "标签文案", kind: "text", ph: "标签文案区" },
      { key: "tag342BgColor", label: "标签底色", kind: "color" },
      { key: "tag342TextColor", label: "标签文字颜色", kind: "color" },
      { key: "buttonText342x514", label: "按钮文字", kind: "text", ph: "立即抢购" },
      { key: "button342BgColor", label: "按钮底色", kind: "color" },
    ],
  },
];

export function MarketingConfigCard({ fields, setField }: Props) {
  return (
    <div className="space-y-2">
      <h2 className="px-1 text-sm font-semibold">营销图配置</h2>
      <Accordion type="single" collapsible defaultValue="g1" className="space-y-2">
        {GROUPS.map((g) => (
          <AccordionItem key={g.value} value={g.value} className="border">
            <AccordionTrigger>{g.title}</AccordionTrigger>
            <AccordionContent className="space-y-3">
              {g.note && <p className="text-xs leading-relaxed text-muted-foreground">{g.note}</p>}
              {g.fields.map((f) =>
                f.kind === "color" ? (
                  <ColorField
                    key={f.key}
                    label={f.label}
                    value={fields[f.key] as string}
                    onChange={(hex) => setField(f.key, hex as never)}
                  />
                ) : (
                  <div key={f.key} className="space-y-1.5">
                    <Label htmlFor={f.key}>{f.label}</Label>
                    {f.kind === "textarea" ? (
                      <Textarea
                        id={f.key}
                        rows={2}
                        value={fields[f.key] as string}
                        onChange={(e) => setField(f.key, e.target.value as never)}
                        placeholder={f.ph}
                      />
                    ) : (
                      <Input
                        id={f.key}
                        value={fields[f.key] as string}
                        onChange={(e) => setField(f.key, e.target.value as never)}
                        placeholder={f.ph}
                      />
                    )}
                  </div>
                )
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
