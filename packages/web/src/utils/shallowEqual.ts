export function shallowEqual(a: any, b: any) {
  if (a === b) {
    return true;
  }
  if (typeof a !== "object" || typeof b !== "object") {
    return false;
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  if (aKeys.some((key) => a[key] !== b[key])) {
    return false;
  }
  return true;
}
