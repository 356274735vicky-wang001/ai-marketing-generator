#!/usr/bin/env node
/**
 * 一次性脚本：把 ComfyUI API 格式工作流注册到 ComfyOne，拿到 workflow_id。
 *
 * 用法（自动读取项目根目录 .env.local 里的 ONETHING_API_KEY，无需写进命令）：
 *   node scripts/register-comfyone-workflow.mjs
 *   # 可选：自定义 workflow 文件路径作为第 1 个参数
 *
 * 成功后会打印 workflow_id，把它配到 .env.local 的 ONETHING_WORKFLOW_INSTANCE_ID。
 */
import fs from "node:fs";
import path from "node:path";

/** 读取 .env.local（已被 gitignore），把其中变量注入 process.env（不覆盖已存在的） */
function loadEnvLocal() {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    const i = s.indexOf("=");
    if (i === -1) continue;
    const k = s.slice(0, i).trim();
    let v = s.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}
loadEnvLocal();

const BASE = (process.env.ONETHING_BASE_URL || "https://pandora-server-cf.onethingai.com").replace(/\/+$/, "");
const KEY = process.env.ONETHING_API_KEY;
if (!KEY || KEY === "replace_me_locally") {
  console.error("未在 .env.local 找到有效的 ONETHING_API_KEY（请先填好真实 Key）");
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
