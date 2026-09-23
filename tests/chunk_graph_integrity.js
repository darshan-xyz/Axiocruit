// Empirical test: Verify bundle chunk dependency graph integrity
import fs from 'fs';
import path from 'path';

const distAssets = path.resolve(process.cwd(), 'dist', 'assets');
if (!fs.existsSync(distAssets)) {
  console.error('dist/assets does not exist. Run npm run build first.');
  process.exit(1);
}

const files = new Set(fs.readdirSync(distAssets));
const jsFiles = [...files].filter(f => f.endsWith('.js'));

let brokenImports = 0;
let totalImportReferences = 0;

for (const jsFile of jsFiles) {
  const code = fs.readFileSync(path.join(distAssets, jsFile), 'utf-8');
  
  // Static imports: from "./foo.js" or import "./foo.js"
  const staticRegex = /(?:from\s*|import\s*)['"](\.\/[^'"]+)['"]/g;
  let match;
  while ((match = staticRegex.exec(code)) !== null) {
    totalImportReferences++;
    const target = match[1].replace('./', '');
    if (!files.has(target)) {
      console.error(`[FAIL] Broken static import in ${jsFile} -> ${target}`);
      brokenImports++;
    }
  }

  // Dynamic imports: import("./foo.js")
  const dynamicRegex = /import\s*\(\s*['"](\.\/[^'"]+)['"]\s*\)/g;
  while ((match = dynamicRegex.exec(code)) !== null) {
    totalImportReferences++;
    const target = match[1].replace('./', '');
    if (!files.has(target)) {
      console.error(`[FAIL] Broken dynamic import in ${jsFile} -> ${target}`);
      brokenImports++;
    }
  }
}

console.log(`Verified ${totalImportReferences} import references across ${jsFiles.length} chunks.`);
if (brokenImports === 0) {
  console.log('[PASS] All chunk imports resolve to valid dist/assets files.');
  process.exit(0);
} else {
  console.error(`[FAIL] Found ${brokenImports} broken import references!`);
  process.exit(1);
}
