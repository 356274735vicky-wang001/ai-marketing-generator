/**
 * OneThingAI ComfyOne 低层 HTTP 客户端（仅服务端使用）。
 * 文档：https://docs.onethingai.com/78614/91a0d
 *
 * 安全：API Key 只在此处通过 process.env 读取，放入 Authorization 头，永不下发前端、不打日志。
 *
 * 稳定性 / 可观测性（v1.0.x 增强，不改业务逻辑）：
 * - 所有外部 fetch 统一走 instrumentedFetch：显式超时、详细日志、对「socket 断开」类
 *   瞬时网络错误自动重试（仅幂等调用）。
 * - 日志默认开启，可用 ONETHING_VERBOSE=false 关闭。Authorization 头永远脱敏。
 */

const DEFAULT_BASE = "https://pandora-server-cf.onethingai.com";

/** 详细日志开关：默认开启，ONETHING_VERBOSE=false 时关闭 */
const VERBOSE = (process.env.ONETHING_VERBOSE ?? "true").toLowerCase() !== "false";

/** 各类请求的超时时间（毫秒）。上传/下载可能是 ~10MB 大文件，给足时长。 */
const TIMEOUT = {
  upload: 120_000, // 素材上传
  submit: 30_000, // 提交任务
  status: 30_000, // 轮询状态
  download: 120_000, // 下载结果图
} as const;

/** 瞬时网络错误特征：命中则可对幂等请求重试（直接对应「socket 断开」报错） */
const TRANSIENT_RE =
  /UND_ERR_SOCKET|ECONNRESET|ETIMEDOUT|ECONNREFUSED|EPIPE|ENOTFOUND|EAI_AGAIN|socket connection was closed|other side closed|terminated|fetch failed|network|aborted/i;

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

/** 日志用：脱敏 Authorization，绝不打印真实 Key */
function redactHeaders(headers?: HeadersInit): Record<string, string> {
  const out: Record<string, string> = {};
  if (headers) {
    for (const [k, v] of Object.entries(headers as Record<string, string>)) {
      out[k] = /authorization/i.test(k) ? "Bearer ***" : v;
    }
  }
  return out;
}

/** 把任意 error 拍平成可读、可序列化的诊断对象（含 undici 的 cause.code） */
function describeError(e: unknown) {
  const err = e as { name?: string; message?: string; code?: string; cause?: { code?: string; message?: string } };
  return {
    name: err?.name,
    message: err?.message ?? String(e),
    code: err?.code ?? err?.cause?.code,
    causeMessage: err?.cause?.message,
  };
}

function isTransient(e: unknown): boolean {
  const d = describeError(e);
  const hay = `${d.name} ${d.message} ${d.code ?? ""} ${d.causeMessage ?? ""}`;
  return d.name === "TimeoutError" || TRANSIENT_RE.test(hay);
}

interface FetchOpts extends RequestInit {
  /** 调用语义，用于日志，如「上传图片」 */
  what: string;
  /** 超时毫秒 */
  timeoutMs: number;
  /** 失败重试次数（仅用于幂等调用；提交任务等非幂等调用必须为 0） */
  retries: number;
}

/**
 * 统一的外部请求封装：显式超时 + 详细日志 + 瞬时错误重试。
 * 不改变成功路径的返回值（仍是原生 Response），仅增强可观测性与稳定性。
 */
async function instrumentedFetch(url: string, opts: FetchOpts): Promise<Response> {
  const { what, timeoutMs, retries, headers, ...init } = opts;
  const method = init.method ?? "GET";
  const maxAttempts = Math.max(1, retries + 1);
  let lastErr: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const started = Date.now();
    if (VERBOSE) {
      console.info(
        `[comfyone] → ${method} ${url} | ${what} | 第 ${attempt}/${maxAttempts} 次 | 超时 ${timeoutMs}ms | headers=${JSON.stringify(
          redactHeaders(headers)
        )}`
      );
    }
    try {
      const res = await fetch(url, { ...init, headers, signal: AbortSignal.timeout(timeoutMs) });
      const ms = Date.now() - started;
      if (VERBOSE) {
        console.info(`[comfyone] ← ${res.status} ${res.statusText} | ${method} ${url} | ${what} | ${ms}ms`);
      }
      return res;
    } catch (e) {
      const ms = Date.now() - started;
      lastErr = e;
      const d = describeError(e);
      console.error(
        `[comfyone] ✗ ${method} ${url} | ${what} | ${ms}ms 后失败 | ${JSON.stringify(d)}`
      );
      if (attempt < maxAttempts && isTransient(e)) {
        const backoff = 500 * attempt;
        console.warn(`[comfyone] ↻ 瞬时网络错误，${backoff}ms 后重试（${what}）…`);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

/** ComfyOne 统一响应包装 */
interface Envelope<T> {
  code: number;
  msg?: string;
  data: T;
}

async function parseEnvelope<T>(res: Response, what: string): Promise<T> {
  let text: string;
  try {
    text = await res.text();
  } catch (e) {
    // 读取响应体时 socket 断开也会落到这里——单独记录，便于区分「连接失败」与「响应体中断」
    console.error(`[comfyone] ✗ 读取「${what}」响应体失败（HTTP ${res.status}）| ${JSON.stringify(describeError(e))}`);
    throw new Error(`${what} 读取响应失败（HTTP ${res.status}）`);
  }
  let json: Envelope<T> | undefined;
  try {
    json = JSON.parse(text) as Envelope<T>;
  } catch {
    if (VERBOSE) console.error(`[comfyone] ✗ ${what} 返回非 JSON（HTTP ${res.status}）| body=${text.slice(0, 500)}`);
    throw new Error(`${what} 返回非 JSON（HTTP ${res.status}）`);
  }
  if (!res.ok) {
    if (VERBOSE) console.error(`[comfyone] ✗ ${what} HTTP ${res.status} | body=${text.slice(0, 500)}`);
    throw new Error(`${what} 失败：HTTP ${res.status} ${json?.msg ?? ""}`.trim());
  }
  if (json.code !== 0) {
    if (VERBOSE) console.error(`[comfyone] ✗ ${what} 业务错误 code=${json.code} | body=${text.slice(0, 500)}`);
    throw new Error(`${what} 失败：code=${json.code} ${json.msg ?? ""}`.trim());
  }
  return json.data;
}

/**
 * 一次性诊断日志：确认 provider / baseURL / 关键环境变量是否就绪（不打印密钥明文）。
 * 由路由在每次生成开始时调用，便于在排查「socket 断开」时确认是否真的连到了正确实例。
 */
let diagnosticsLogged = false;
export function logOneThingDiagnostics(): void {
  if (diagnosticsLogged) return;
  diagnosticsLogged = true;
  const key = process.env.ONETHING_API_KEY ?? "";
  console.info(
    `[comfyone] env 诊断 | provider=${process.env.ONETHING_PROVIDER ?? "(未设置)"} | baseURL=${baseUrl()} | ` +
      `API_KEY=${key ? `已配置(${key.length}位)` : "缺失!"} | ` +
      `WORKFLOW_INSTANCE_ID=${process.env.ONETHING_WORKFLOW_INSTANCE_ID ?? "缺失!"} | ` +
      `BACKEND_ID=${process.env.ONETHING_BACKEND_ID ?? "(未设置)"} | ` +
      `VERBOSE=${VERBOSE} | FALLBACK_TO_MOCK=${process.env.ONETHING_FALLBACK_TO_MOCK ?? "false"}`
  );
}

/** 上传一张图片，返回可作为图片输入的 path/URL（写入 LoadImage 的 image 字段） */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  contentType = "image/png"
): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: contentType }), filename);
  // 上传幂等（重复上传只是多产生一份文件，使用返回 path），允许重试
  const res = await instrumentedFetch(`${baseUrl()}/v1/files`, {
    method: "POST",
    headers: authHeader(), // 不要手动设 Content-Type，让 fetch 带 multipart boundary
    body: form,
    what: `上传图片(${filename})`,
    timeoutMs: TIMEOUT.upload,
    retries: 2,
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
  // 提交任务「非幂等」：失败重试可能产生重复任务，故 retries=0（仍有超时与详细日志）
  const res = await instrumentedFetch(`${baseUrl()}/v1/prompts`, {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    what: "提交任务",
    timeoutMs: TIMEOUT.submit,
    retries: 0,
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
  // 查询幂等，允许重试，避免单次 socket 抖动直接中断整轮轮询
  const res = await instrumentedFetch(
    `${baseUrl()}/v1/prompts/${encodeURIComponent(taskId)}/status`,
    {
      method: "GET",
      headers: authHeader(),
      what: `查询状态(${taskId})`,
      timeoutMs: TIMEOUT.status,
      retries: 2,
    }
  );
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
  // 下载幂等，允许重试
  const res = await instrumentedFetch(full, {
    headers: authHeader(),
    what: `下载结果图`,
    timeoutMs: TIMEOUT.download,
    retries: 2,
  });
  if (!res.ok) throw new Error(`下载结果图失败：HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
