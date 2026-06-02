"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ImageDropzone } from "@/components/ImageDropzone";
import { ColorField } from "@/components/ColorField";
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
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Doodle 162×162</CardTitle>
        <p className="text-xs text-muted-foreground">独立分支 · 输出 162×162 透明 PNG</p>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          {/* 左：缩略图 */}
          <div className="w-[88px] shrink-0">
            <ImageDropzone
              compact
              label="Doodle PNG"
              value={doodleImage}
              onChange={(f) => setFile("doodleImage", f)}
            />
          </div>

          {/* 右：模式 + 文案 */}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <RadioGroup
              className="flex gap-5"
              value={fields.doodleMode}
              onValueChange={(v) => setField("doodleMode", v as DoodleMode)}
            >
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="single" id="doodle-single" />
                <Label htmlFor="doodle-single" className="font-normal">单行</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="double" id="doodle-double" />
                <Label htmlFor="doodle-double" className="font-normal">双行</Label>
              </div>
            </RadioGroup>

            {fields.doodleMode === "single" ? (
              <Input
                aria-label="Doodle 单行文案"
                value={fields.doodleSingleText}
                onChange={(e) => setField("doodleSingleText", e.target.value)}
                placeholder="加入会员"
              />
            ) : (
              <div className="flex flex-col gap-2">
                <Input
                  aria-label="Doodle 双行第一行"
                  value={fields.doodleDoubleLine1}
                  onChange={(e) => setField("doodleDoubleLine1", e.target.value)}
                  placeholder="为爱投票"
                />
                <Input
                  aria-label="Doodle 双行第二行"
                  value={fields.doodleDoubleLine2}
                  onChange={(e) => setField("doodleDoubleLine2", e.target.value)}
                  placeholder="领20元津贴"
                />
              </div>
            )}
          </div>
        </div>

        {/* Doodle 文字颜色（仅作用于 Doodle 当前模式文案节点） */}
        <div className="mt-3">
          <ColorField
            label="Doodle 文字颜色"
            value={fields.doodleTextColor}
            onChange={(hex) => setField("doodleTextColor", hex)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
