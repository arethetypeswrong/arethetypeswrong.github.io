import type { Exports } from "cjs-module-lexer";
import { init, parse as cjsParse } from "cjs-module-lexer";

await init();

export function getCjsModuleBindings(sourceText: string): Exports {
  return cjsParse(sourceText);
}
