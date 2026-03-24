#!/usr/bin/env node
/**
 * Post-build step: emit .d.ts.map files alongside tsup's flat .d.ts output.
 *
 * tsup hardcodes declarationMap: false, so we run tsc ourselves (which respects
 * declarationMap: true from tsconfig.base.json) into a temp directory, then copy
 * the .d.ts.map files flat into dist/, fixing the relative `sources` paths.
 *
 * Entry map: the key is the flat dist name, the value is the tsc subdir path.
 */

import { execSync } from "child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const tmpDir = join(root, "dist-dts-tmp");

/** Map from flat dist name → source module path (relative to src/) */
const entries = {
  index: "index",
  types: "types/index",
  map: "map/index",
  filter: "filter/index",
  take: "take/index",
  drop: "drop/index",
  pipe: "pipe/index",
  transduce: "transduce/index",
  into: "into/index",
  sequence: "sequence/index",
};

// Remove stale tsc subdirectory artifacts from dist/ (tsup's clean: true only removes
// files it tracks — prior tsc project-reference runs leave subdirs behind)
const distDir = join(root, "dist");
for (const name of Object.values(entries)) {
  const subdir = join(distDir, name.split("/")[0]);
  rmSync(subdir, { recursive: true, force: true });
}

// Clean tmp dir
rmSync(tmpDir, { recursive: true, force: true });
mkdirSync(tmpDir, { recursive: true });

// Write a temporary tsconfig that emits to tmpDir
const tsconfigPath = join(tmpDir, "tsconfig.json");
const tsconfig = {
  extends: "../tsconfig.base.json",
  compilerOptions: {
    noEmit: false,
    rootDir: "../src",
    outDir: ".",
  },
  include: Object.values(entries).map((e) => `../src/${e}.ts`),
};
writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));

// Run tsc
execSync(`yarn tsc --project ${tsconfigPath}`, { cwd: root, stdio: "inherit" });

// Copy .d.ts.map files to dist/, fixing sources paths
for (const [flatName, srcPath] of Object.entries(entries)) {
  // tsc emits to tmpDir/<srcPath>.d.ts.map
  const srcFile = join(tmpDir, `${srcPath}.d.ts.map`);
  const destFile = join(distDir, `${flatName}.d.ts`);
  const destMapFile = join(distDir, `${flatName}.d.ts.map`);

  // Read and fix the sources path:
  //   tsc emits relative to tmpDir/<srcPath>.d.ts.map
  //   we need relative to dist/<flatName>.d.ts.map
  const raw = readFileSync(srcFile, "utf8");
  const map = JSON.parse(raw);

  // Recompute sources: tsc wrote paths relative to tmpDir/<dir>/
  // e.g. for pipe/index: sources = ["../../src/pipe/index.ts"] (from tmpDir/pipe/index.d.ts.map)
  // we need it relative to dist/ (one level up from dist/): ["../src/pipe/index.ts"]
  // The source files are always at root/src/<srcPath>.ts
  // From dist/<flatName>.d.ts.map, the relative path is ../src/<srcPath>.ts
  map.sources = [`../src/${srcPath}.ts`];

  // Update the `file` field to match the flat .d.ts name
  map.file = `${flatName}.d.ts`;

  writeFileSync(destMapFile, JSON.stringify(map));

  // Add sourceMappingURL comment to the .d.ts file if not already present
  let dts = readFileSync(destFile, "utf8");
  const urlComment = `//# sourceMappingURL=${flatName}.d.ts.map`;
  if (!dts.includes(urlComment)) {
    dts = dts.trimEnd() + "\n" + urlComment + "\n";
    writeFileSync(destFile, dts);
  }

  console.log(`  dist/${flatName}.d.ts.map`);
}

// Clean up
rmSync(tmpDir, { recursive: true, force: true });

console.log("Declaration maps done.");
