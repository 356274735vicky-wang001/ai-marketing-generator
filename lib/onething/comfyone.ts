/**
 * OneThingAI ComfyOne 低层 HTTP 客户端（仅服务端使用）。
 * 文档：https://docs.onethingai.com/78614/91a0d
 *
 * 安全：API Key 只在此处通过 process.env 读取，放入 Authorization 头，永不下发前端、不打日志。
 */

const DEFAULT_BASE = "https://pandora-server-cf.onethingai.com";

function baseUrl(): string {
  return (process.env.ONETHING_BASE_URL || DEFAULT_BASE).replace(/\/+$/, "");
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`缺少环境变量 ${name}`);
  return v;
}

function authHeader(): Record<string, string> {
  return { Authorization: `Bearer ${requireEnv("ONETHING_API_KEY")}` };
}

/** ComfyOne 统一响应包装 */
interface Envelope<T> {
  code: number;
  msg?: string;
  data: T;
}

async function parseEnvelope<T>(res: Response, what: string): Promise<T> {
  let json: Envelope<T> | undefined;
  const text = await res.text();
  try {
    json = JSON.parse(text) as Envelope<T>;
  } catch {
    throw new Error(`${what} 返回非 JSON（HTTP ${res.status}）`);
  }
  if (!res.ok) throw new Error(`${what} 失败：HTTP ${res.status} ${json?.msg ?? ""}`.trim());
  if (json.code !== 0) throw new Error(`${what} 失败：code=${json.code} ${json.msg ?? ""}`.trim());
  return json.data;
}

/** 上传一张图片，返回可作为图片输入的 path/URL（写入 LoadImage 的 image 字段） */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  contentType = "image/png"
): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: contentType }), filename);
  const res = await fetch(`${baseUrl()}/v1/files`, {
    method: "POST",
    headers: authHeader(), // 不要手动设 Content-Type，让 fetch 带 multipart boundary
    body: form,
  });
  const data = await parseEnvelope<Record<string, unknown>>(res, "上传图片");
  // ComfyOne 实际返回 data.Path（大写）；兼容其它常见命名
  const ref =
    data?.Path ?? data?.path ?? data?.url ?? data?.URL ?? data?.filename ?? data?.name;
  if (typeof ref !== "string" || !ref) {
    throw new Error(`上传图片失败：响应缺少文件地址字段（实际键：${Object.keys(data ?? {}).join(",")}）`);
  }
  return ref;
}

export interface ComfyOnePromptInput {
  id: string;
  params: Record<string, unknown>;
}

/** 提交任务到已注册的工作流，返回 taskId */
export async function submitPrompt(args: {
  workflowId: string;
  inputs: ComfyOnePromptInput[];
  backend?: string;
  freeCache?: boolean;
}): Promise<string> {
  const body = {
    workflow_id: args.workflowId,
    inputs: args.inputs,
    free_cache: args.freeCache ?? false,
    ...(args.backend ? { backend: args.backend } : {}),
  };
  const res = await fetch(`${baseUrl()}/v1/prompts`, {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseEnvelope<{ taskId: string }>(res, "提交任务");
  if (!data?.taskId) throw new Error("提交任务失败：响应缺少 taskId");
  return data.taskId;
}

export type ComfyOneStatus =
  | "pendding"
  | "pending"
  | "running"
  | "finished"
  | "failed"
  | "cancel";

export interface ComfyOneStatusResult {
  status: ComfyOneStatus;
  images: string[];
  costTime?: number;
}

/** 查询任务状态 */
export async function getStatus(taskId: string): Promise<ComfyOneStatusResult> {
  const res = await fetch(`${baseUrl()}/v1/prompts/${encodeURIComponent(taskId)}/status`, {
    method: "GET",
    headers: authHeader(),
  });
  const data = await parseEnvelope<{
    status: ComfyOneStatus;
    images?: string[];
    cost_time?: number;
  }>(res, "查询任务状态");
  return { status: data.status, images: data.images ?? [], costTime: data.cost_time };
}

/** 下载结果图片（带鉴权），返回二进制 */
export async function fetchImage(url: string): Promise<Buffer> {
  // 结果可能是绝对 URL，也可能是相对 path
  const full = /^https?:\/\//i.test(url) ? url : `${baseUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
  const res = await fetch(full, { headers: authHeader() });
  if (!res.ok) throw new Error(`下载结果图失败：HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
