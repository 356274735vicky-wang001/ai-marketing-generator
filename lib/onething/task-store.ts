/**
 * 进程内任务上下文暂存（start → status 之间传递 SubmitContext）。
 *
 * 用途：
 * - Mock provider 的 poll 需要 ctx（输出位 / 文案 labels）才能渲染占位图；start 与 status 是
 *   两次独立请求，故在 start 时按 taskId 记下 ctx，status 时取回。
 * - 真实 provider 的 poll 不依赖 ctx（只用 taskId），即使本 store 在另一个 Serverless 实例上
 *   取不到，也能凭 taskId + mode 正常查询；故此 store 仅为「尽力而为」的优化，丢失不影响真实生成。
 *
 * 注意：纯内存、按实例隔离、带 TTL；不持久化，不放任何密钥。
 */
import type { SubmitContext } from "./provider";

interface Entry {
  provider: string;
  ctx: SubmitContext;
  createdAt: number;
}

const store = new Map<string, Entry>();
const TTL_MS = 10 * 60 * 1000; // 10 分钟

function gc() {
  const now = Date.now();
  for (const [k, e] of store) {
    if (now - e.createdAt > TTL_MS) store.delete(k);
  }
}

export function rememberTask(taskId: string, provider: string, ctx: SubmitContext): void {
  gc();
  store.set(taskId, { provider, ctx, createdAt: Date.now() });
}

export function recallTask(taskId: string): { provider: string; ctx: SubmitContext } | undefined {
  const e = store.get(taskId);
  return e ? { provider: e.provider, ctx: e.ctx } : undefined;
}

export function forgetTask(taskId: string): void {
  store.delete(taskId);
}
