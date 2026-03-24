import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    types: "src/types/index.ts",
    map: "src/map/index.ts",
    filter: "src/filter/index.ts",
    take: "src/take/index.ts",
    drop: "src/drop/index.ts",
    pipe: "src/pipe/index.ts",
    transduce: "src/transduce/index.ts",
    into: "src/into/index.ts",
    sequence: "src/sequence/index.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  onSuccess: "yarn emitTypes",
});
