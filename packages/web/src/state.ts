// TODO: auto import did this wrong
import type { Analysis, ProblemSummary } from "are-the-types-wrong-core";

export interface Checks {
  analysis: Analysis;
  problems: ProblemSummary[];
}

export interface State {
  packageInfo: PackageInfoState;
  checks?: AsyncFailable<Checks>;
}

export interface ParsedPackageSpec {
  packageName: string;
  version: string | undefined;
}

export interface PackageInfoState {
  parsed?: SyncFailable<ParsedPackageSpec>;
  info?: AsyncFailable<PackageInfo>;
}

export interface PackageInfo {
  size: number | undefined;
}

export type SyncFailable<T> =
  | { status: "success"; data: T; error?: undefined }
  | { status: "error"; data?: undefined; error: string };

export type AsyncFailable<T> =
  | { status: "loading"; data?: undefined; error?: undefined }
  | { status: "success"; data: T; error?: undefined }
  | { status: "error"; data?: undefined; error: string };

type KeyofDeep<T> = T extends object
  ? { [K in string & keyof T]: K | `${K}.${KeyofDeep<T[K]>}` }[string & keyof T]
  : never;

type IndexDeep<T, Path extends KeyofDeep<T>> = T extends null | undefined
  ? undefined
  : Path extends keyof T
  ? T[Path]
  : Path extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends KeyofDeep<T[K]>
      ? IndexDeep<T[K], Rest>
      : never
    : never
  : never;

export type StatePath = KeyofDeep<State>;

export const state: State = {
  packageInfo: {},
};

const subscribers: Partial<Record<StatePath, ((actionPath: StatePath) => void)[]>> = {};

export function subscribe(path: StatePath, callback: (actionPath: StatePath) => void): () => void {
  const callbacks = subscribers[path] || [];
  callbacks.push(callback);
  subscribers[path] = callbacks;
  return () => {
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  };
}

export function computed<Path extends StatePath, Selected>(
  path: Path,
  selector: (state: IndexDeep<State, Path>) => Selected,
  callback: (selected: Selected) => void
): () => void {
  let previousSelected = selector(get(path));
  const unsubscribe = subscribe(path, () => {
    const selected = selector(get(path));
    if (selected !== previousSelected) {
      callback(selector(get(path)));
      previousSelected = selected;
    }
  });
  callback(selector(get(path)));
  return unsubscribe;
}

function createAction<T extends unknown[]>(path: StatePath, updater: (...args: T) => void) {
  return (...args: T) => {
    updater(...args);
    const parentPaths = path.split(".").reduce((acc: StatePath[], key) => {
      const last = acc[acc.length - 1];
      acc.push((last ? `${last}.${key}` : key) as StatePath);
      return acc;
    }, []);
    for (const parentPath of parentPaths) {
      subscribers[parentPath]?.forEach((callback) => callback(parentPath));
    }
    for (const subscriberPath in subscribers) {
      if (subscriberPath.startsWith(path) && subscriberPath[path.length] === ".") {
        subscribers[subscriberPath as StatePath]?.forEach((callback) => callback(path));
      }
    }
  };
}

export const actions = {
  setParsedPackageSpec: createAction("packageInfo.parsed", (parsed: SyncFailable<ParsedPackageSpec> | undefined) => {
    state.packageInfo.parsed = parsed;
  }),
  setPackageInfo: createAction("packageInfo.info", (info: AsyncFailable<PackageInfo> | undefined) => {
    state.packageInfo.info = info;
  }),
  setChecks: createAction("checks", (checks: AsyncFailable<Checks>) => {
    state.checks = checks;
  }),
};

export function get<Path extends StatePath>(path: Path): IndexDeep<State, Path> {
  return path.split(".").reduce((acc: any, key) => acc?.[key], state) as IndexDeep<State, Path>;
}
