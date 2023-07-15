import { getAllDataAsObject, getVersionsByDate } from "./main.js";

/**
 * @param {import("./main.js").VersionsByDate} versionsByDate
 */
export function getAllPackageNames(versionsByDate) {
  /** @type {Set<string>} */
  const result = new Set();
  for (const versions of Object.values(versionsByDate)) {
    for (const { packageName } of versions) {
      result.add(packageName);
    }
  }
  return result;
}

/**
 * @param {import("./main.js").VersionsByDate} versionsByDate
 */
export function getAllDates(versionsByDate) {
  return Object.keys(versionsByDate).sort();
}

/**
 * @param {string} packageName
 * @param {string} date
 * @param {import("./main.js").VersionsByDate} versionsByDate
 */
export function getVersionAtDate(packageName, date, versionsByDate) {
  const versions = versionsByDate[date];
  if (!versions) {
    throw new Error(`Date ${date} has not been sampled`);
  }
  const pkg = versions.find((version) => version.packageName === packageName);
  return pkg?.packageVersion;
}

/**
 * @param {string} date
 * @param {import("./main.js").VersionsByDate} versionsByDate
 * @param {import("./main.js").AllDataAsObject} data
 */
export function getVersionsAtDateWithTypes(date, versionsByDate, data) {
  return versionsByDate[date].filter((p) => data[`${p.packageName}@${p.packageVersion}`]);
}

/**
 * @typedef {{
 *   packageName: string;
 *   fixedByVersion: string;
 *   fixedByDate: string;
 * }} FixedPackage
 */

/**
 * @param {import("@arethetypeswrong/core").ProblemKind[]} problemKinds
 * @param {import("./main.js").AllDataAsObject} data
 * @param {import("./main.js").VersionsByDate} versionsByDate
 */
export function getFixedPackages(problemKinds, data, versionsByDate) {
  const dates = getAllDates(versionsByDate);
  const latest = dates[dates.length - 1];
  const candidates = Array.from(getAllPackageNames(versionsByDate)).filter((packageName) => {
    const pkg = data[`${packageName}@${getVersionAtDate(packageName, latest, versionsByDate)}`];
    return pkg && !packageHasProblem(pkg, problemKinds);
  });
  /** @type {FixedPackage[]} */
  const result = [];
  for (const packageName of candidates) {
    const fixedIndex = bisect(dates, (date) => {
      const pkg = data[`${packageName}@${getVersionAtDate(packageName, date, versionsByDate)}`];
      return !pkg || !packageHasProblem(pkg, problemKinds);
    });
    if (fixedIndex === 0) {
      continue;
    }
    const fixedDate = dates[fixedIndex];
    const fixedVersion = getVersionAtDate(packageName, fixedDate, versionsByDate);
    result.push({ packageName, fixedByVersion: fixedVersion, fixedByDate: fixedDate });
  }
  return result;
}

/**
 * @param {import("@arethetypeswrong/core").Analysis} analysis
 * @param {import("@arethetypeswrong/core").ProblemKind[]} problemKinds
 */
function packageHasProblem(analysis, problemKinds) {
  return analysis.problems.some((problem) => problemKinds.includes(problem.kind));
}

/**
 * @template T
 * @param {readonly T[]} array
 * @param {(value: T) => boolean} predicate
 * @returns {number} The index of the first element in `array` that satisfies `predicate`.
 */
function bisect(array, predicate) {
  let low = 0;
  let high = array.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (predicate(array[mid])) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }
  return low;
}
