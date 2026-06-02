/**
 * Provider 工厂：按环境变量 ONETHING_PROVIDER 选择适配器。
 * 仅服务端使用（读取 process.env）。
 */
import type { OneThingProvider } from "./provider";
import { MockProvider } from "./mock-provider";
import { RealOneThingProvider } from "./real-provider";

let cached: OneThingProvider | null = null;

export function getProvider(): OneThingProvider {
  if (cached) return cached;
  const mode = (process.env.ONETHING_PROVIDER ?? "mock").toLowerCase();
  cached = mode === "real" ? new RealOneThingProvider() : new MockProvider();
  return cached;
}
