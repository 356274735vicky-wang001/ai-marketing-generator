/**
 * OneThingAI 适配器接口。
 *
 * 全项目只通过此接口与「图片生成后端」交互；mock 与真实实现都满足它。
 * 接入真实 OneThingAI 时只需新增一个实现并在 client.ts 切换，前端与 API 路由无需改动。
 */
import type { OutputSpec } from "./node-map";
import type { GenerateTextFields, ProviderImage, UploadFieldKey } from "@/lib/types";

/** 适配器任务状态 */
export type ProviderStatus = "pending" | "running" | "success" | "failed";

export interface SubmitContext {
  /** 本次需要产出的输出位（含尺寸 / 是否 Doodle / 是否透明） */
  outputs: OutputSpec[];
  doodleMode: "single" | "double";
  /** 已上传素材的引用（真实适配器写入 LoadImage 输入；Mock 忽略） */
  uploaded: Record<UploadFieldKey, string>;
  /** 文案 + 颜色字段（真实适配器构建 params；Mock 用于渲染中文占位） */
  fields: GenerateTextFields;
  /**
   * 各输出图要展示的中文样例文案，键为输出 id（Mock 占位图渲染用，真实适配器忽略）。
   */
  labels?: Record<string, string>;
}

export interface PollResult {
  status: ProviderStatus;
  /** 成功时返回原始 PNG 图片 */
  images?: ProviderImage[];
  error?: string;
}

export interface OneThingProvider {
  readonly name: string;
  /** 上传一张素材，返回可写入 LoadImage 节点的引用（文件名 / 文件 ID） */
  uploadImage(
    buffer: Buffer,
    filename: string,
    field: UploadFieldKey
  ): Promise<string>;
  /** 提交任务，返回 provider 侧任务 ID */
  submit(ctx: SubmitContext): Promise<string>;
  /** 轮询一次任务状态 / 取结果（编排层负责循环直至终态） */
  poll(providerTaskId: string, ctx: SubmitContext): Promise<PollResult>;
}
