/**
 * 真实 OneThingAI 适配器（占位骨架）。
 *
 * ⚠️ 待补：当前项目文档未提供 OneThingAI 平台真实 API 规格，以下每个方法都标注了
 * 接入时需要确认的信息。拿到规格后实现这几个方法，并在 .env 设置 ONETHING_PROVIDER=real。
 *
 * 安全约束：API Key 只在此服务端文件通过 process.env 读取，永不下发前端。
 */
import type { OneThingProvider, PollResult, SubmitContext } from "./provider";
import type { UploadFieldKey } from "@/lib/types";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`缺少环境变量 ${name}`);
  return v;
}

export class RealOneThingProvider implements OneThingProvider {
  readonly name = "real";

  private get apiKey() {
    return requireEnv("ONETHING_API_KEY");
  }
  private get instanceId() {
    return requireEnv("ONETHING_WORKFLOW_INSTANCE_ID");
  }
  private get baseUrl() {
    return process.env.ONETHING_BASE_URL ?? "https://api.onethingai.com";
  }

  async uploadImage(
    _buffer: Buffer,
    _filename: string,
    _field: UploadFieldKey
  ): Promise<string> {
    // TODO(接入): 确认 OneThingAI 是否有独立上传接口；返回的是文件名 / URL / 文件ID？
    // 该返回值会被写入 ComfyUI LoadImage 节点的 widgets_values[0]。
    void this.apiKey;
    void this.baseUrl;
    throw new Error("RealOneThingProvider.uploadImage 未实现：需 OneThingAI 上传接口规格");
  }

  async submit(_workflow: unknown, _ctx: SubmitContext): Promise<string> {
    // TODO(接入): 确认提交工作流的 endpoint / 方法 / 请求体（传完整 workflow 还是
    // instanceId + 覆盖参数？），以及鉴权头格式。返回 provider 侧任务 ID。
    void this.instanceId;
    throw new Error("RealOneThingProvider.submit 未实现：需 OneThingAI 运行接口规格");
  }

  async poll(_providerTaskId: string, _ctx: SubmitContext): Promise<PollResult> {
    // TODO(接入): 确认任务状态查询 endpoint、状态枚举、结果取图方式（URL / base64 / /view），
    // 以及 5 张营销图（当前为 PreviewImage）如何取回（是否需补 SaveImage 节点）。
    throw new Error("RealOneThingProvider.poll 未实现：需 OneThingAI 任务/结果接口规格");
  }
}
