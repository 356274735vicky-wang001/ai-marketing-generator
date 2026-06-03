/**
 * 真实 OneThingAI / ComfyOne 适配器。
 * 文档：https://docs.onethingai.com/78614/91a0d
 *
 * 流程：
 *   uploadImage  → POST /v1/files            （素材上传，返回 path）
 *   submit       → POST /v1/prompts          （提交任务，返回 taskId）
 *   poll         → GET  /v1/prompts/{id}/status（查询状态 + 取图 URL，下载为二进制）
 *
 * 安全：API Key / 实例 ID 只在服务端通过环境变量读取（见 comfyone.ts），不下发前端、不打日志。
 *
 * ⚠️ 节点→params 字段名、输出节点 ID 待用 API 格式工作流核对（见 comfyone-map.ts）。
 */
import * as comfyone from "./comfyone";
import { buildPromptInputs, outputNodesForMode } from "./comfyone-map";
import type { OneThingProvider, PollResult, SubmitContext } from "./provider";
import type { ProviderImage, UploadFieldKey } from "@/lib/types";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`缺少环境变量 ${name}`);
  return v;
}

export class RealOneThingProvider implements OneThingProvider {
  readonly name = "real";

  /** 已注册的工作流 ID（沿用既有环境变量名） */
  private get workflowId() {
    return requireEnv("ONETHING_WORKFLOW_INSTANCE_ID");
  }
  /** 可选：指定运行的 GPU 后端实例 */
  private get backend() {
    return process.env.ONETHING_BACKEND_ID || undefined;
  }

  async uploadImage(
    buffer: Buffer,
    filename: string,
    _field: UploadFieldKey
  ): Promise<string> {
    return comfyone.uploadFile(buffer, filename || "upload.png");
  }

  async submit(ctx: SubmitContext): Promise<string> {
    const inputs = buildPromptInputs(ctx.uploaded, ctx.fields, ctx.doodleMode);
    return comfyone.submitPrompt({
      workflowId: this.workflowId,
      inputs,
      backend: this.backend,
      freeCache: false,
    });
  }

  async poll(taskId: string, ctx: SubmitContext): Promise<PollResult> {
    const r = await comfyone.getStatus(taskId);

    if (r.status === "failed" || r.status === "cancel") {
      return { status: "failed", error: `OneThingAI 任务${r.status === "cancel" ? "已取消" : "失败"}` };
    }
    if (r.status !== "finished") {
      return { status: "running" }; // pendding / pending / running
    }

    // finished：按 outputs 顺序把图片 URL 映射回我们的输出 id，并下载为二进制
    const order = outputNodesForMode(ctx.doodleMode);
    const urls = r.images ?? [];
    const images: ProviderImage[] = [];
    for (let i = 0; i < order.length && i < urls.length; i++) {
      const buffer = await comfyone.fetchImage(urls[i]);
      images.push({ id: order[i].ourId, buffer });
    }
    if (images.length === 0) {
      return { status: "failed", error: "OneThingAI 返回结果为空" };
    }
    return { status: "success", images };
  }
}
