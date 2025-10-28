import { existsSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

interface PackageSize {
  name: string;
  esm: {
    raw: string;
    gzipped: string;
  };
  cjs: {
    raw: string;
    gzipped: string;
  };
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

async function getFileSize(filePath: string): Promise<{ raw: number; gzipped: number }> {
  if (!existsSync(filePath)) {
    return { raw: 0, gzipped: 0 };
  }

  const file = Bun.file(filePath);
  const content = await file.text();
  const raw = statSync(filePath).size;
  const gzipped = gzipSync(content).length;

  return { raw, gzipped };
}

async function calculatePackageSize(packageName: string, distPath: string): Promise<PackageSize> {
  const esmPath = join(distPath, 'index.js');
  const cjsPath = join(distPath, 'index.cjs');

  const esm = await getFileSize(esmPath);
  const cjs = await getFileSize(cjsPath);

  return {
    name: packageName,
    esm: {
      raw: formatBytes(esm.raw),
      gzipped: formatBytes(esm.gzipped),
    },
    cjs: {
      raw: formatBytes(cjs.raw),
      gzipped: formatBytes(cjs.gzipped),
    },
  };
}

function formatSizeLine(sizes: PackageSize): string {
  return `📦 **Size:** ESM: ${sizes.esm.raw} (gzipped: ${sizes.esm.gzipped}), CJS: ${sizes.cjs.raw} (gzipped: ${sizes.cjs.gzipped})`;
}

async function main() {
  console.log('\n📦 Calculating bundle sizes...\n');

  // Calculate sizes for all packages
  const packages = [
    { name: '@uranium/sdk', path: 'packages/core/dist', linePattern: /@uranium\/sdk sizes/ },
    { name: '@uranium/react', path: 'packages/react/dist', linePattern: /@uranium\/react sizes/ },
    { name: '@uranium/types', path: 'packages/types/dist', linePattern: /@uranium\/types sizes/ },
  ];

  const sizes: PackageSize[] = [];
  for (const pkg of packages) {
    const size = await calculatePackageSize(pkg.name, pkg.path);
    sizes.push(size);
    console.log(`  ${size.name}: ESM ${size.esm.raw} (${size.esm.gzipped}), CJS ${size.cjs.raw} (${size.cjs.gzipped})`);
  }

  // Read README.md
  const readmePath = 'README.md';
  const readmeFile = Bun.file(readmePath);
  const readmeContent = await readmeFile.text();

  // Build new size strings
  const sizeStrings = sizes.map(formatSizeLine);

  // Find and replace size strings in README
  // Pattern: 📦 **Size:** ESM: X KB (gzipped: Y KB), CJS: Z KB (gzipped: W KB)
  // Also matches without emoji for backwards compatibility
  const sizePattern = /(?:📦\s*)?\*\*Size:\*\* ESM: [\d.]+ KB \(gzipped: [\d.]+ KB\), CJS: [\d.]+ KB \(gzipped: [\d.]+ KB\)/gu;

  // Extract all current size lines from README
  const currentSizes = readmeContent.match(sizePattern) || [];

  if (currentSizes.length !== 3) {
    console.error(`\n❌ Error: Expected to find exactly 3 size lines in README, found ${currentSizes.length}`);
    process.exit(1);
  }

  // Check if sizes actually changed
  let hasChanges = false;
  const changes: string[] = [];

  for (let i = 0; i < 3; i++) {
    if (currentSizes[i] !== sizeStrings[i]) {
      hasChanges = true;
      changes.push(`  ${sizes[i].name}: ${currentSizes[i]} → ${sizeStrings[i]}`);
    }
  }

  if (!hasChanges) {
    console.log('\n✅ Bundle sizes are up to date. No changes needed.\n');
    return;
  }

  // Replace sizes in order (they appear in the README in the same order as our packages array)
  let newReadmeContent = readmeContent;
  let replacementCount = 0;

  newReadmeContent = newReadmeContent.replace(sizePattern, () => {
    const replacement = sizeStrings[replacementCount];
    replacementCount++;
    return replacement;
  });

  // Verify we made exactly 3 replacements
  if (replacementCount !== 3) {
    console.error(`\n❌ Error: Expected to replace exactly 3 size lines, replaced ${replacementCount}`);
    process.exit(1);
  }

  // Write updated README
  await Bun.write(readmePath, newReadmeContent);

  console.log('\n✅ Bundle sizes updated in README.md:');
  for (const change of changes) {
    console.log(change);
  }
  console.log('');
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
