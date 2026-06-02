"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { GenerateTextFields } from "@/lib/types";

interface Props {
  fields: GenerateTextFields;
  setField: <K extends keyof GenerateTextFields>(k: K, v: GenerateTextFields[K]) => void;
}

// 前端用通用「文案」命名，内部映射到具体节点字段
const TEXTAREAS: { key: keyof GenerateTextFields; label: string; ph: string }[] = [
  { key: "copy750Square", label: "文案一（750×750 主文案）", ph: "出行抽一抽\n领假日券包" },
  { key: "copy530x706", label: "文案二（530×706 主文案）", ph: "出行抽一抽\n领假日券包" },
  { key: "copy750x400", label: "文案三（750×400 主文案）", ph: "出行抽一抽\n领假日券包" },
];

const INPUTS: { key: keyof GenerateTextFields; label: string; ph: string }[] = [
  { key: "title342x514", label: "文案四（342×514 主标题）", ph: "主题六个字内" },
  { key: "benefit342x514", label: "文案五（342×514 利益点）", ph: "利益点文案九个字内" },
  { key: "tagText342x514", label: "标签文案", ph: "标签文案区" },
  { key: "buttonText530x706", label: "按钮文字一（530×706）", ph: "立即查看" },
  { key: "buttonText750x400", label: "按钮文字二（750×400）", ph: "立即查看" },
  { key: "buttonText342x514", label: "按钮文字三（342×514）", ph: "立即抢购" },
];

export function CopyFieldsCard({ fields, setField }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">文案输入</CardTitle>
        <p className="text-xs text-muted-foreground">主文案支持换行（每行为一句）。</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {TEXTAREAS.map(({ key, label, ph }) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key}>{label}</Label>
              <Textarea
                id={key}
                rows={2}
                value={fields[key] as string}
                onChange={(e) => setField(key, e.target.value as never)}
                placeholder={ph}
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {INPUTS.map(({ key, label, ph }) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                value={fields[key] as string}
                onChange={(e) => setField(key, e.target.value as never)}
                placeholder={ph}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
