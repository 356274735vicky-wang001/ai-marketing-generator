#!/usr/bin/env node
/**
 * 一次性脚本：把你的 OneThingAI ComfyUI 实例注册为 ComfyOne 后端（backend）。
 * 解决提交任务报错 code=2006「该服务需要添加后端」。
 *
 * 用法（自动读取 .env.local 里的 ONETHING_API_KEY 和 ONETHING_BACKEND_ID）：
 *   1. 在 .env.local 填 ONETHING_BACKEND_ID=<你的 ComfyUI 实例ID>
 *   2. node scripts/register-comfyone-backend.mjs
 *
 * 注：ONETHING_BACKEND_ID 是「GPU 实例 ID」，不是工作流 ID。
 */
import fs from "node:fs";
import path from "node:path";

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
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
}
loadEnvLocal();

const BASE = (process.env.ONETHING_BASE_URL || "https://pandora-server-cf.onethingai.com").replace(/\/+$/, "");
const KEY = process.env.ONETHING_API_KEY;
const INSTANCE = process.env.ONETHING_BACKEND_ID;
if (!KEY || KEY === "replace_me_locally") {
  console.error("未在 .env.local 找到有效 ONETHING_API_KEY");
  process.exit(1);
}
if (!INSTANCE) {
  console.error("请先在 .env.local 填 ONETHING_BACKEND_ID=<你的 ComfyUI 实例ID>");
  process.exit(1);
}

const headers = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const res = await fetch(`${BASE}/v1/backends`, {
  method: "POST",
  headers,
  body: JSON.stringify({ instance_id: INSTANCE }),
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
  console.error("注册后端失败：", res.status, "code=" + json.code, json.msg);
  process.exit(1);
}
console.log("✅ 后端注册成功");
console.log(JSON.stringify(json.data, null, 2));

// 列出当前后端，确认已就绪
const list = await fetch(`${BASE}/v1/backends`, { headers });
const lj = await list.json().catch(() => null);
console.log("\n当前后端列表：");
console.log(JSON.stringify(lj?.data ?? lj, null, 2));
