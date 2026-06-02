import archiver from "archiver";

export interface ZipEntry {
  name: string; // 包内文件名，如 marketing_750x750_1.png
  data: Buffer;
}

/** 后端打包 ZIP，避免大图占用浏览器内存 */
export function buildZip(entries: ZipEntry[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks: Buffer[] = [];
    archive.on("data", (c: Buffer) => chunks.push(c));
    archive.on("warning", (err) => {
      if ((err as { code?: string }).code !== "ENOENT") reject(err);
    });
    archive.on("error", reject);
    archive.on("end", () => resolve(Buffer.concat(chunks)));

    for (const e of entries) archive.append(e.data, { name: e.name });
    archive.finalize();
  });
}
