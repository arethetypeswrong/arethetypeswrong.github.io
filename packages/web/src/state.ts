import type { Analysis, ProblemSummary, ResolutionProblem } from "are-the-types-wrong-core";

export interface Checks {
  analysis: Analysis;
  problemSummaries: ProblemSummary[];
  resolutionProblems: ResolutionProblem[];
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
}

const state: State = {
  isLoading: false,
  packageInfo: {},
};

type DeepReadonly<T extends object> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

const subscribers: Set<(state: DeepReadonly<State>) => void> = new Set();

export function subscribe(callback: (state: DeepReadonly<State>) => void): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

export function updateState(updater: (state: State) => void): void {
  updater(state);
  subscribers.forEach((callback) => callback(state));
}

export function getState(): DeepReadonly<State> {
  return state;
}
