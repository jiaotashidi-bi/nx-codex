import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import ncc from "@vercel/ncc";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const outputRoot = process.argv[2];

if (!outputRoot || !path.isAbsolute(outputRoot)) {
  throw new Error("build.mjs requires an absolute temporary output directory.");
}

async function bundle(entry, outputDirectory) {
  const target = path.join(outputRoot, outputDirectory);
  const result = await ncc(path.join(projectRoot, entry), {
    cache: false,
    minify: false,
    sourceMap: false,
    sourceMapRegister: false,
    quiet: true,
  });

  await mkdir(target, { recursive: true });
  await writeFile(path.join(target, "index.mjs"), result.code, "utf8");

  for (const [assetName, asset] of Object.entries(result.assets)) {
    if (assetName.endsWith(".map")) {
      continue;
    }
    const assetPath = path.resolve(target, assetName);
    if (!assetPath.startsWith(`${path.resolve(target)}${path.sep}`)) {
      throw new Error(`Refusing unsafe bundle asset path: ${assetName}`);
    }
    await mkdir(path.dirname(assetPath), { recursive: true });
    await writeFile(assetPath, asset.source, {
      mode: asset.permissions,
    });
  }
}

await Promise.all([
  bundle("src/index.ts", "mcp"),
  bundle("src/mock-bridge-cli.ts", "mock-bridge"),
]);
