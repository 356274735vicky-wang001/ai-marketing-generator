import sharp from "sharp";

/** 直接输出 PNG（透明保留） */
export async function toPng(input: Buffer): Promise<Buffer> {
  return sharp(input).png().toBuffer();
}

/**
 * 输出 JPG。JPG 不支持透明：带 alpha 的图（如 Doodle）会先铺白底，
 * 避免透明区域变黑。前端会提示用户透明背景将丢失。
 */
export async function toJpg(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .jpeg({ quality: 92 })
    .toBuffer();
}

export async function transcode(
  input: Buffer,
  format: "png" | "jpg"
): Promise<Buffer> {
  return format === "jpg" ? toJpg(input) : toPng(input);
}

export function contentType(format: "png" | "jpg"): string {
  return format === "jpg" ? "image/jpeg" : "image/png";
}
