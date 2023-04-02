import type { Analysis, ProblemSummary, Problem } from "@arethetypeswrong/core";
import { gunzip, gzip } from "fflate";
import { produce } from "immer";

export interface Checks {
  analysis: Analysis;
  problemSummaries?: ProblemSummary[];
  problems?: Problem[];
}

export interface State {
  isLoading: boolean;
  message?: {
    isError: boolean;
    text: string;
  };
  packageInfo: PackageInfoState;
  checks?: Checks;
}

export interface ParsedPackageSpec {
  packageName: string;
  version: string | undefined;
}

export interface PackageInfoState {
  parsed?: ParsedPackageSpec;
  info?: PackageInfo;
}

export interface PackageInfo {
  size: number | undefined;
  version: string;
}

let state: State = {
  isLoading: false,
  packageInfo: {},
};

type DeepReadonly<T extends object> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

const subscribers: Set<(state: DeepReadonly<State>) => void> = new Set();

export function subscribe(callback: (prevState: DeepReadonly<State>) => void): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

export function updateState(updater: (draftState: State) => void): void {
  const prevState = state;
  state = produce(state, updater);
  subscribers.forEach((callback) => callback(prevState));
}

export function getState(): DeepReadonly<State> {
  return state;
}

export function setState(newState: State): void {
  const prevState = state;
  state = newState;
  subscribers.forEach((callback) => callback(prevState));
}

export async function serializeState(state = getState()): Promise<string> {
  const json = JSON.stringify([state.packageInfo, state.checks], (key, value) => {
    if (key === "exports" || key === "trace") return undefined;
    return value;
  });

  return new Promise((resolve, reject) => {
    gzip(new TextEncoder().encode(json), (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(btoa(String.fromCharCode(...data)));
      }
    });
  });
}

export async function deserializeState(serializedState: string): Promise<State> {
  const json = new TextDecoder().decode(
    await new Promise((resolve, reject) =>
      gunzip(
        Uint8Array.from(
          atob(serializedState)
            .split("")
            .map((c) => c.charCodeAt(0))
        ),
        (error, data) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        }
      )
    )
  );

  const [packageInfo, checks] = JSON.parse(json) as [PackageInfoState, Checks];

  return {
    isLoading: false,
    packageInfo,
    checks,
  };
}
