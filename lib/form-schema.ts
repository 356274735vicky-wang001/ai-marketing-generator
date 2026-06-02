import { z } from "zod";
import type { GenerateTextFields } from "./types";

const hex = z
  .string()
  .trim()
  .regex(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "请输入合法 HEX 颜色，如 #2563EB");

/** 文案 + 颜色字段校验（文件单独校验）。颜色按图归属，逐一作用于对应节点。 */
export const textFieldsSchema = z.object({
  // 营销图1（750×750）
  copy750Square: z.string().max(60),
  color750Square: hex,
  // 营销图2（530×706）
  copy530x706: z.string().max(60),
  buttonText530x706: z.string().max(20),
  button530BgColor: hex,
  button530TextColor: hex,
  // 营销图3（750×400）
  copy750x400: z.string().max(60),
  buttonText750x400: z.string().max(20),
  button750BgColor: hex,
  button750TextColor: hex,
  // 营销图5（342×514）
  title342x514: z.string().max(40),
  benefit342x514: z.string().max(40),
  tagText342x514: z.string().max(20),
  tag342BgColor: hex,
  tag342TextColor: hex,
  buttonText342x514: z.string().max(20),
  button342BgColor: hex,
  // Doodle
  doodleMode: z.enum(["single", "double"]),
  doodleSingleText: z.string().max(20),
  doodleDoubleLine1: z.string().max(20),
  doodleDoubleLine2: z.string().max(20),
  doodleTextColor: hex,
});

export type TextFields = z.infer<typeof textFieldsSchema>;

/** 默认值：文案取 workflow JSON 示例文案；颜色取各节点默认色 */
export const DEFAULT_TEXT_FIELDS: GenerateTextFields = {
  copy750Square: "出行抽一抽\n领假日券包",
  color750Square: "#003074",

  copy530x706: "出行抽一抽\n领假日券包",
  buttonText530x706: "立即查看",
  button530BgColor: "#FFE648",
  button530TextColor: "#003074",

  copy750x400: "出行抽一抽\n领假日券包",
  buttonText750x400: "立即查看",
  button750BgColor: "#FFE648",
  button750TextColor: "#003074",

  title342x514: "主题六个字内",
  benefit342x514: "利益点文案九个字内",
  tagText342x514: "标签文案区",
  tag342BgColor: "#0055CC",
  tag342TextColor: "#FFFFFF",
  buttonText342x514: "立即抢购",
  button342BgColor: "#FFFFFF",

  doodleMode: "single",
  doodleSingleText: "加入会员",
  doodleDoubleLine1: "为爱投票",
  doodleDoubleLine2: "领20元津贴",
  doodleTextColor: "#000000",
};

/** 上传图片约束 */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];
