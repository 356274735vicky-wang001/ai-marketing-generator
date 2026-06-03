/**
 * Mock 适配器：不调用任何外部服务，用 @napi-rs/canvas 合成占位图。
 * 中文文字用项目内打包的 Noto Sans SC 字体渲染（显式 registerFont），
 * 不依赖系统字体，确保在 Vercel Linux 环境也不会出现方块/乱码。
 */
import path from "node:path";
import fs from "node:fs";
import { createCanvas, GlobalFonts, type SKRSContext2D } from "@napi-rs/canvas";
import type { OneThingProvider, PollResult, SubmitContext } from "./provider";
import type { OutputSpec } from "./node-map";
import type { ProviderImage } from "@/lib/types";

const FONT_FAMILY = "Noto Sans SC";

// 进程内只注册一次。用 process.cwd() 拼绝对路径，兼容本地与 Vercel。
let fontReady = false;
function ensureFont() {
  if (fontReady) return;
  const fontPath = path.join(process.cwd(), "assets", "fonts", "NotoSansSC-Regular.otf");
  if (fs.existsSync(fontPath)) {
    GlobalFonts.registerFromPath(fontPath, FONT_FAMILY);
  } else {
    console.warn("[mock] 中文字体缺失:", fontPath);
  }
  fontReady = true;
}

const PALETTE = ["#2563EB", "#7C3AED", "#0EA5E9", "#10B981", "#F59E0B"];

/** 居中绘制多行文字 */
function drawCenteredLines(
  ctx: SKRSContext2D,
  lines: string[],
  cx: number,
  startY: number,
  lineHeight: number
) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((line, i) => {
    if (line) ctx.fillText(line, cx, startY + i * lineHeight);
  });
}

/** 营销占位图（不透明），叠加尺寸名 + 用户中文样例文案 */
function renderMarketing(spec: OutputSpec, i: number, label: string): Buffer {
  const { width, height } = spec;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, PALETTE[i % PALETTE.length]);
  grad.addColorStop(1, "#0f172a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, width - 16, height - 16);

  const base = Math.min(width, height);
  ctx.fillStyle = "#ffffff";

  // 顶部：MOCK + 尺寸名（中文）
  ctx.font = `700 ${Math.round(base / 10)}px "${FONT_FAMILY}"`;
  drawCenteredLines(ctx, ["MOCK"], width / 2, height * 0.26, 0);
  ctx.font = `500 ${Math.round(base / 16)}px "${FONT_FAMILY}"`;
  drawCenteredLines(ctx, [spec.name], width / 2, height * 0.4, 0);

  // 中部：用户输入的中文主文案（验证中文渲染）
  if (label.trim()) {
    const lines = label.split("\n");
    const fs2 = Math.round(base / 11);
    ctx.font = `700 ${fs2}px "${FONT_FAMILY}"`;
    drawCenteredLines(ctx, lines, width / 2, height * 0.62, fs2 * 1.3);
  }

  return canvas.toBuffer("image/png");
}

/**
 * Doodle 占位图：162×162，主体 158×158，四边 2px 透明边距，背景透明。
 */
function renderDoodle(spec: OutputSpec, mode: "single" | "double", label: string): Buffer {
  const subject = 158;
  const pad = 2;
  const total = subject + pad * 2; // 162

  const canvas = createCanvas(total, total); // 默认透明背景
  const ctx = canvas.getContext("2d");

  // 主体圆（绘制在 2px 内边距内）
  const cx = total / 2;
  const cy = total / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, subject / 2 - 6, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(37,99,235,0.92)";
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = `700 20px "${FONT_FAMILY}"`;
  drawCenteredLines(ctx, ["Doodle"], cx, cy - 18, 0);
  // 用户输入的 Doodle 中文（限制长度避免溢出）
  const text = (label.trim() || (mode === "single" ? "单行" : "双行")).slice(0, 6);
  ctx.font = `500 16px "${FONT_FAMILY}"`;
  drawCenteredLines(ctx, [text], cx, cy + 14, 0);

  return canvas.toBuffer("image/png");
}

export class MockProvider implements OneThingProvider {
  readonly name = "mock";

  async uploadImage(_buffer: Buffer, filename: string): Promise<string> {
    return `mock_${Date.now()}_${filename}`;
  }

  async submit(): Promise<string> {
    return `mock-task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  async poll(_providerTaskId: string, ctx: SubmitContext): Promise<PollResult> {
    ensureFont();
    const labels = ctx.labels ?? {};
    const images: ProviderImage[] = [];
    let i = 0;
    for (const spec of ctx.outputs) {
      const label = labels[spec.id] ?? "";
      const buffer = spec.isDoodle
        ? renderDoodle(spec, ctx.doodleMode, label)
        : renderMarketing(spec, i++, label);
      images.push({ id: spec.id, buffer });
    }
    return { status: "success", images };
  }
}
