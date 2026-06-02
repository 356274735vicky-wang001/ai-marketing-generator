/**
 * Mock 适配器：不调用任何外部服务，本地直接用 sharp 合成占位图。
 * 用于在拿到真实 OneThingAI API 规格前跑通全链路（上传→生成→预览→下载→ZIP）。
 */
import sharp from "sharp";
import type { OneThingProvider, PollResult, SubmitContext } from "./provider";
import type { OutputSpec } from "./node-map";
import type { ProviderImage } from "@/lib/types";

const PALETTE = ["#2563EB", "#7C3AED", "#0EA5E9", "#10B981", "#F59E0B"];

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!)
  );
}

/** 生成一张营销占位图（不透明） */
async function renderMarketing(spec: OutputSpec, i: number): Promise<Buffer> {
  const { width, height } = spec;
  const bg = PALETTE[i % PALETTE.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/><stop offset="100%" stop-color="#0f172a"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <rect x="8" y="8" width="${width - 16}" height="${height - 16}" fill="none" stroke="#ffffff" stroke-opacity="0.4" stroke-width="2" rx="12"/>
    <text x="50%" y="46%" fill="#ffffff" font-size="${Math.round(Math.min(width, height) / 9)}" font-family="sans-serif" font-weight="700" text-anchor="middle">MOCK</text>
    <text x="50%" y="60%" fill="#ffffff" font-size="${Math.round(Math.min(width, height) / 14)}" font-family="sans-serif" text-anchor="middle">${escapeXml(spec.name)}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * 生成 Doodle 占位图：162×162，主体 158×158，四边 2px 透明边距，背景透明。
 * 符合 PRD 第 8 节规范。
 */
async function renderDoodle(spec: OutputSpec, mode: "single" | "double"): Promise<Buffer> {
  const subject = 158;
  const pad = 2;
  const label = mode === "single" ? "单行" : "双行";
  const subjectSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${subject}" height="${subject}">
    <circle cx="${subject / 2}" cy="${subject / 2}" r="${subject / 2 - 6}" fill="#2563EB" fill-opacity="0.9"/>
    <text x="50%" y="44%" fill="#ffffff" font-size="20" font-family="sans-serif" font-weight="700" text-anchor="middle">Doodle</text>
    <text x="50%" y="62%" fill="#ffffff" font-size="16" font-family="sans-serif" text-anchor="middle">${label}</text>
  </svg>`;
  const subjectPng = await sharp(Buffer.from(subjectSvg)).png().toBuffer();
  // 四边补 2px 透明边距 → 162×162，保留 alpha
  return sharp(subjectPng)
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

export class MockProvider implements OneThingProvider {
  readonly name = "mock";

  async uploadImage(buffer: Buffer, filename: string): Promise<string> {
    // Mock 不真正上传，返回带时间戳的文件名占位
    return `mock_${Date.now()}_${filename}`;
  }

  async submit(): Promise<string> {
    return `mock-task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  async poll(_providerTaskId: string, ctx: SubmitContext): Promise<PollResult> {
    // Mock 直接同步出图（真实场景会经历 pending/running）
    const images: ProviderImage[] = [];
    let i = 0;
    for (const spec of ctx.outputs) {
      const buffer = spec.isDoodle
        ? await renderDoodle(spec, ctx.doodleMode)
        : await renderMarketing(spec, i++);
      images.push({ id: spec.id, buffer });
    }
    return { status: "success", images };
  }
}
