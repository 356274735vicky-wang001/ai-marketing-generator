import { z } from "zod";
import type { GenerateTextFields } from "./types";

const hex = z
  .string()
  .trim()
  .regex(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "请输入合法 HEX 颜色，如 #2563EB");

/** 文案 + 颜色字段校验（文件单独校验） */
export const textFieldsSchema = z.object({
  copy750Square: z.string().max(60),
  copy530x706: z.string().max(60),
  copy750x400: z.string().max(60),
  title342x514: z.string().max(40),
  benefit342x514: z.string().max(40),

  buttonText530x706: z.string().max(20),
  buttonText750x400: z.string().max(20),
  buttonText342x514: z.string().max(20),
  tagText342x514: z.string().max(20),

  doodleMode: z.enum(["single", "double"]),
  doodleSingleText: z.string().max(20),
  doodleDoubleLine1: z.string().max(20),
  doodleDoubleLine2: z.string().max(20),

  titleColor: hex,
  subtitleColor: hex,
  buttonBgColor: hex,
  buttonTextColor: hex,
  tagBgColor: hex,
  tagTextColor: hex,
  doodleTextColor: hex,
});

export type TextFields = z.infer<typeof textFieldsSchema>;

/** 默认值：文案取 workflow JSON 中的示例文案；颜色取节点默认色 */
export const DEFAULT_TEXT_FIELDS: GenerateTextFields = {
  copy750Square: "出行抽一抽\n领假日券包",
  copy530x706: "出行抽一抽\n领假日券包",
  copy750x400: "出行抽一抽\n领假日券包",
  title342x514: "主题六个字内",
  benefit342x514: "利益点文案九个字内",

  buttonText530x706: "立即查看",
  buttonText750x400: "立即查看",
  buttonText342x514: "立即抢购",
  tagText342x514: "标签文案区",

  doodleMode: "single",
  doodleSingleText: "加入会员",
  doodleDoubleLine1: "为爱投票",
  doodleDoubleLine2: "领20元津贴",

  titleColor: "#003074",
  subtitleColor: "#FFFFFF",
  buttonBgColor: "#FFE648",
  buttonTextColor: "#003074",
  tagBgColor: "#0055CC",
  tagTextColor: "#FFFFFF",
  doodleTextColor: "#000000",
};

/** 上传图片约束 */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];
