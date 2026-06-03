#!/usr/bin/env node
/**
 * 一次性脚本：把 ComfyUI API 格式工作流注册到 ComfyOne，拿到 workflow_id。
 *
 * 用法（API Key 通过环境变量传入，不要写进代码/文件）：
 *   ONETHING_API_KEY=你的key node scripts/register-comfyone-workflow.mjs
 *   # 可选：ONETHING_BASE_URL=...  自定义 workflow 文件路径作为第 1 个参数
 *
 * 成功后会打印 workflow_id，把它配到环境变量 ONETHING_WORKFLOW_INSTANCE_ID。
 */
import fs from "node:fs";
import path from "node:path";

const BASE = (process.env.ONETHING_BASE_URL || "https://pandora-server-cf.onethingai.com").replace(/\/+$/, "");
const KEY = process.env.ONETHING_API_KEY;
if (!KEY) {
  console.error("缺少环境变量 ONETHING_API_KEY");
  process.exit(1);
}
const wfPath = process.argv[2] || path.join(process.cwd(), "workflow", "一键换图生图_API.json");
const workflow = JSON.parse(fs.readFileSync(wfPath, "utf8"));

// 可被前端参数覆盖的输入：每条 = {id: 节点ID, name: 该节点的 input 字段名, type}
const imageNodes = ["15", "12", "23", "109"];
const crTextNodes = ["53", "66", "93", "103"];
const overlayTextNodes = ["19", "42", "74", "86", "88", "133", "134"];
const overlayColorNodes = ["19", "42", "74", "86", "88", "52", "69", "104", "133", "134"];
const panelColorNodes = ["48", "65", "90", "101"];

const inputs = [
  ...imageNodes.map((id) => ({ id, name: "image", type: "image" })),
  ...crTextNodes.map((id) => ({ id, name: "text", type: "string" })),
  ...overlayTextNodes.map((id) => ({ id, name: "text", type: "string" })),
  ...overlayColorNodes.map((id) => ({ id, name: "font_color_hex", type: "string" })),
  ...panelColorNodes.map((id) => ({ id, name: "fill_color_hex", type: "string" })),
];

// 输出顺序必须与 lib/onething/comfyone-map.ts 的 REGISTERED_OUTPUTS 一致
const outputs = ["24", "54", "68", "80", "107", "135", "121"];

const body = { name: "ai-marketing-generator", inputs, outputs, workflow };

const res = await fetch(`${BASE}/v1/workflows`, {
  method: "POST",
  headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const text = await res.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  console.error("返回非 JSON：", res.status, text.slice(0, 300));
  process.exit(1);
}
if (!res.ok || json.code !== 0) {
  console.error("注册失败：", res.status, json.code, json.msg);
  process.exit(1);
}
console.log("✅ 注册成功");
console.log("workflow_id =", json.data?.id);
console.log("\n把它配到环境变量：ONETHING_WORKFLOW_INSTANCE_ID =", json.data?.id);
