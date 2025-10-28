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

async function main() {
  console.log('\n📦 Package Bundle Sizes\n');
  console.log('═'.repeat(80));

  const packages = [
    { name: '@uranium/sdk', path: 'packages/core/dist' },
    { name: '@uranium/react', path: 'packages/react/dist' },
    { name: '@uranium/types', path: 'packages/types/dist' },
  ];

  for (const pkg of packages) {
    const sizes = await calculatePackageSize(pkg.name, pkg.path);

    console.log(`\n${sizes.name}`);
    console.log('─'.repeat(80));
    console.log(`  ESM:  ${sizes.esm.raw.padEnd(12)} (raw) | ${sizes.esm.gzipped.padEnd(12)} (gzipped)`);
    console.log(`  CJS:  ${sizes.cjs.raw.padEnd(12)} (raw) | ${sizes.cjs.gzipped.padEnd(12)} (gzipped)`);
  }

  console.log('\n' + '═'.repeat(80));
  console.log('\n✨ All package sizes calculated!\n');
}

main().catch(console.error);
