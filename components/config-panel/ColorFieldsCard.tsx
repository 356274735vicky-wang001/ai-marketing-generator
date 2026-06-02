"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorField } from "@/components/ColorField";
import type { GenerateTextFields } from "@/lib/types";

interface Props {
  fields: GenerateTextFields;
  setField: <K extends keyof GenerateTextFields>(k: K, v: GenerateTextFields[K]) => void;
}

const COLORS: { key: keyof GenerateTextFields; label: string }[] = [
  { key: "titleColor", label: "主标题颜色" },
  { key: "subtitleColor", label: "副标题颜色" },
  { key: "buttonBgColor", label: "按钮底色" },
  { key: "buttonTextColor", label: "按钮文字颜色" },
  { key: "tagBgColor", label: "标签底色" },
  { key: "tagTextColor", label: "标签文字颜色" },
  { key: "doodleTextColor", label: "Doodle 文字颜色" },
];

export function ColorFieldsCard({ fields, setField }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">颜色配置</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {COLORS.map(({ key, label }) => (
          <ColorField
            key={key}
            label={label}
            value={fields[key] as string}
            onChange={(hex) => setField(key, hex as never)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
