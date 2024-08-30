import type { problemFlags } from "../problemUtils.ts";

export type Format = "auto" | "table" | "table-flipped" | "ascii" | "json";
export interface RenderOptions {
  ignoreRules?: (typeof problemFlags)[keyof typeof problemFlags][];
  format?: Format;
  color?: boolean;
  summary?: boolean;
  emoji?: boolean;
}

export * from "./typed.ts";
export * from "./untyped.ts";
