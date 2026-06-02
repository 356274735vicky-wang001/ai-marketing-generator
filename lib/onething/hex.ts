/** 归一化 HEX 颜色，兼容工作流中 "ffffff" 与 "#000000" 两种写法 */
export function normalizeHexForComfy(hex: string, withHash = false): string {
  const clean = hex.replace(/#/g, "").trim();
  return withHash ? `#${clean}` : clean;
}

/** 是否是合法 3/6 位 HEX（可带 #） */
export function isValidHex(hex: string): boolean {
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex.trim());
}

/**
 * 写入颜色时保留目标位原有的 # 风格：
 * 原值带 # → 输出带 #；原值不带 # → 输出不带 #。
 */
export function applyHexPreservingStyle(original: unknown, next: string): string {
  const keepHash = typeof original === "string" && original.trim().startsWith("#");
  return normalizeHexForComfy(next, keepHash);
}
