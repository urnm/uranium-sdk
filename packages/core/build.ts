// Build ESM version
// @ts-expect-error
const esmResult = await Bun.build({
  entrypoints: ["./src/index.ts"],
  target: "node",
  packages: "external", // Exclude all dependencies from bundle
  format: "esm",
  outdir: "./dist",
  naming: "[dir]/[name].js",
})

if (!esmResult.success) {
  console.error("ESM build failed")
  process.exit(1)
}

// Build CJS version
// @ts-expect-error
const cjsResult = await Bun.build({
  entrypoints: ["./src/index.ts"],
  target: "node",
  packages: "external", // Exclude all dependencies from bundle
  format: "cjs",
  outdir: "./dist",
  naming: "[dir]/[name].cjs",
})

if (!cjsResult.success) {
  console.error("CJS build failed")
  process.exit(1)
}

console.log("✓ Core package built successfully")
