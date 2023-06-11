import type { CheckResult, ParsedPackageSpec } from "@arethetypeswrong/core";
import { produce } from "immer";

export interface State {
  isLoading: boolean;
  message?: {
    isError: boolean;
    text: string;
  };
  packageInfo: PackageInfoState;
  analysis?: CheckResult;
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
