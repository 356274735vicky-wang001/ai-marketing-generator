"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ImageDropzone } from "@/components/ImageDropzone";
import type { DoodleMode, GenerateTextFields, UploadFieldKey } from "@/lib/types";

interface Props {
  doodleImage: File | null;
  setFile: (key: UploadFieldKey, file: File | null) => void;
  fields: GenerateTextFields;
  setField: <K extends keyof GenerateTextFields>(k: K, v: GenerateTextFields[K]) => void;
}

export function DoodleCard({ doodleImage, setFile, fields, setField }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Doodle 素材</CardTitle>
        <p className="text-xs text-muted-foreground">
          独立分支，不共用背景图 / 主视觉 / Logo / 按钮 / 标签。输出 162×162 透明 PNG。
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-[220px]">
          <ImageDropzone
            label="Doodle PNG"
            value={doodleImage}
            onChange={(f) => setFile("doodleImage", f)}
            hint="请使用透明 PNG"
          />
        </div>

        <div className="space-y-2">
          <Label>文案模式</Label>
          <RadioGroup
            className="flex gap-6"
            value={fields.doodleMode}
            onValueChange={(v) => setField("doodleMode", v as DoodleMode)}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="single" id="doodle-single" />
              <Label htmlFor="doodle-single" className="font-normal">单行</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="double" id="doodle-double" />
              <Label htmlFor="doodle-double" className="font-normal">双行</Label>
            </div>
          </RadioGroup>
        </div>

        {fields.doodleMode === "single" ? (
          <div className="space-y-1.5">
            <Label htmlFor="doodleSingleText">单行文案</Label>
            <Input
              id="doodleSingleText"
              value={fields.doodleSingleText}
              onChange={(e) => setField("doodleSingleText", e.target.value)}
              placeholder="加入会员"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="doodleDoubleLine1">第一行</Label>
              <Input
                id="doodleDoubleLine1"
                value={fields.doodleDoubleLine1}
                onChange={(e) => setField("doodleDoubleLine1", e.target.value)}
                placeholder="为爱投票"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doodleDoubleLine2">第二行</Label>
              <Input
                id="doodleDoubleLine2"
                value={fields.doodleDoubleLine2}
                onChange={(e) => setField("doodleDoubleLine2", e.target.value)}
                placeholder="领20元津贴"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
