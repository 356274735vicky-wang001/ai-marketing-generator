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
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">营销图素材</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-3">
        <ImageDropzone
          compact
          label="背景图"
          value={files.backgroundImage}
          onChange={(f) => setFile("backgroundImage", f)}
        />
        <ImageDropzone
          compact
          label="主视觉"
          value={files.productImage}
          onChange={(f) => setFile("productImage", f)}
        />
        <ImageDropzone
          compact
          label="Logo"
          value={files.logoImage}
          onChange={(f) => setFile("logoImage", f)}
        />
      </CardContent>
    </Card>
  );
}
