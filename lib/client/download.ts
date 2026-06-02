"use client";

import JSZip from "jszip";
import type { GeneratedImage } from "@/lib/types";

/** base64(PNG) → data URL，用于 <img src> 与下载 */
export function pngDataUrl(image: Pick<GeneratedImage, "pngBase64">): string {
  return `data:image/png;base64,${image.pngBase64}`;
}

function base64ToUint8(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** PNG 下载（保留透明） */
export function downloadPng(image: GeneratedImage) {
  const blob = new Blob([base64ToUint8(image.pngBase64) as BlobPart], {
    type: "image/png",
  });
  triggerDownload(blob, `${image.name}.png`);
}

/** 把 PNG data URL 画到铺白底的 canvas，导出 JPG（JPG 不支持透明） */
function pngToJpegBlob(dataUrl: string, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("无法创建画布"));
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("JPG 转换失败"))),
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = dataUrl;
  });
}

/** JPG 下载（带透明的图会被铺白底） */
export async function downloadJpg(image: GeneratedImage) {
  const blob = await pngToJpegBlob(pngDataUrl(image));
  triggerDownload(blob, `${image.name}.jpg`);
}

/** 全部打包为 ZIP（营销图与 Doodle 均用 PNG，保留 Doodle 透明） */
export async function downloadZip(images: GeneratedImage[]) {
  const zip = new JSZip();
  for (const img of images) {
    zip.file(`${img.name}.png`, base64ToUint8(img.pngBase64));
  }
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  triggerDownload(blob, "marketing_images.zip");
}
