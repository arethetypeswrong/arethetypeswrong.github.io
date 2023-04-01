import { writeFile } from "fs/promises";
import createFetch from "fetch-ponyfill";
const { fetch } = createFetch();

if (import.meta.url === "file://" + process.argv[1]) {
  const [, , packageSpec] = process.argv;
  const manifest = await fetchManifest(packageSpec);
  const { name, version } = manifest;
  console.log(`Resolved '${name}@${version}'`);
  const localUrl = await writePackage(manifest);
  console.log(`Wrote '${localUrl}'`);
}

/**
 * @param {string} packageSpec 
 */
async function fetchManifest(packageSpec) {
  const [packageName, version = "latest"] = packageSpec.split("@");
  const manifestUrl = `https://registry.npmjs.org/${packageName}/${version}`;
  return fetch(manifestUrl).then((r) => r.json());
}

/**
 * @param {any} manifest
 */
async function writePackage(manifest) {
  const localUrl = new URL(`../test/fixtures/${manifest.name}@${manifest.version}.tgz`, import.meta.url);
  const tarballUrl = manifest.dist.tarball;
  const packageBuffer = await fetch(tarballUrl).then((r) => r.arrayBuffer());
  await writeFile(localUrl, Buffer.from(packageBuffer));
  return localUrl;
}
