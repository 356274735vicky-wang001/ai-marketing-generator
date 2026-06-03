/**
 * Provider 工厂：按环境变量 ONETHING_PROVIDER 选择适配器。
 * 仅服务端使用（读取 process.env）。
 */
import type { OneThingProvider } from "./provider";
import { MockProvider } from "./mock-provider";
import { RealOneThingProvider } from "./real-provider";

let cached: OneThingProvider | null = null;
let cachedMock: MockProvider | null = null;

export function getProvider(): OneThingProvider {
  if (cached) return cached;
  const mode = (process.env.ONETHING_PROVIDER ?? "mock").toLowerCase();
  cached = mode === "real" ? new RealOneThingProvider() : new MockProvider();
  return cached;
}

/** 兜底用的 Mock 适配器（真实接口失败时可临时切换，便于调试演示） */
export function getMockProvider(): OneThingProvider {
  if (!cachedMock) cachedMock = new MockProvider();
  return cachedMock;
}

/** 是否允许在真实接口失败时回退到 Mock（默认关闭，返回明确错误） */
export function fallbackToMockEnabled(): boolean {
  return (process.env.ONETHING_FALLBACK_TO_MOCK ?? "").toLowerCase() === "true";
}
