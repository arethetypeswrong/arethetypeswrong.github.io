import type { RenderOptions } from "./render/index.js";

type Profile = Pick<Required<RenderOptions>, "ignoreResolutions">;

export const profiles = {
  strict: {
    ignoreResolutions: [],
  },
  node16: {
    ignoreResolutions: ["node10"],
  },
  "esm-only": {
    ignoreResolutions: ["node10", "node16-cjs"],
  },
  "node16-only": {
    ignoreResolutions: ["node10", "bundler"],
  },
} satisfies Record<string, Profile>;

/**
 * Merges the profile with the provided options
 *
 * @param profileKey - name of the profile to apply
 * @param opts - options to apply the profile to
 */
export function applyProfile(profileKey: keyof typeof profiles, opts: RenderOptions): void {
  const profile = profiles[profileKey];
  opts.ignoreResolutions = (opts.ignoreResolutions ?? []).concat(profile.ignoreResolutions);
}
