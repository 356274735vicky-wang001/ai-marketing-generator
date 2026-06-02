/**
 * 任务存储（MVP：进程内内存）。
 *
 * ⚠️ Vercel Serverless 多实例 / 冷启动下内存不共享，生产建议替换为 Vercel KV / Redis
 * （存图片可配合对象存储）。此处用 globalThis 缓存，避免 dev HMR 重置。
 */
import type { OutputSpec } from "./onething/node-map";
import type { TaskStatus } from "./types";

export interface StoredImage {
  spec: OutputSpec;
  /** 原始 PNG 二进制 */
  png: Buffer;
}

export interface StoredTask {
  taskId: string;
  providerTaskId: string;
  status: TaskStatus;
  doodleMode: "single" | "double";
  outputs: OutputSpec[];
  images: Map<string, StoredImage>;
  error?: string;
  createdAt: number;
}

type Store = Map<string, StoredTask>;

const g = globalThis as unknown as { __taskStore?: Store };
const store: Store = g.__taskStore ?? (g.__taskStore = new Map());

const TTL_MS = 1000 * 60 * 30; // 30 分钟后清理

function gc() {
  const now = Date.now();
  for (const [id, t] of store) {
    if (now - t.createdAt > TTL_MS) store.delete(id);
  }
}

export function createTask(task: StoredTask) {
  gc();
  store.set(task.taskId, task);
}

export function getTask(taskId: string): StoredTask | undefined {
  return store.get(taskId);
}

export function setTaskImages(
  taskId: string,
  images: Map<string, StoredImage>,
  status: TaskStatus
) {
  const t = store.get(taskId);
  if (!t) return;
  t.images = images;
  t.status = status;
}

export function setTaskError(taskId: string, error: string) {
  const t = store.get(taskId);
  if (!t) return;
  t.status = "failed";
  t.error = error;
}

export function getImage(taskId: string, imageId: string): StoredImage | undefined {
  return store.get(taskId)?.images.get(imageId);
}
