import type { ParsedPackageSpec } from "@arethetypeswrong/core";
import type { PackageInfo } from "../state";

export async function fetchPackageInfo({ packageName, version }: ParsedPackageSpec): Promise<PackageInfo> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}/${version || "latest"}`);
    if (!response.ok) {
      throw new Error("Failed to get package info");
    }
    const data = await response.json();
    return {
      size: data.dist.unpackedSize,
      version: data.version,
    };
  } catch (error) {
    throw new Error("Failed to get package info");
  }
}
