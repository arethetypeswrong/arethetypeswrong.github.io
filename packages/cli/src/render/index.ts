import type { problemFlags, resolutionKinds } from "../problemUtils.js";

export type Format = "auto" | "table" | "table-flipped" | "ascii" | "json";
export interface RenderOptions {
  ignoreRules?: (typeof problemFlags)[keyof typeof problemFlags][];
  ignoreResolutions?: (keyof typeof resolutionKinds)[];
  format?: Format;
  color?: boolean;
  summary?: boolean;
  emoji?: boolean;
}

export * from "./typed.js";
export * from "./untyped.js";
