"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageDropzone } from "@/components/ImageDropzone";
import type { UploadFieldKey } from "@/lib/types";

interface Props {
  files: Record<UploadFieldKey, File | null>;
  setFile: (key: UploadFieldKey, file: File | null) => void;
}

export function MaterialUploadCard({ files, setFile }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">营销图素材</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ImageDropzone
          label="背景图"
          value={files.backgroundImage}
          onChange={(f) => setFile("backgroundImage", f)}
          hint="用于 5 张营销图"
        />
        <ImageDropzone
          label="主视觉产品图"
          value={files.productImage}
          onChange={(f) => setFile("productImage", f)}
          hint="建议透明 PNG"
        />
        <ImageDropzone
          label="Logo"
          value={files.logoImage}
          onChange={(f) => setFile("logoImage", f)}
          hint="建议透明 PNG"
        />
      </CardContent>
    </Card>
  );
}
