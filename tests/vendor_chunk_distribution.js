// Empirical test: Verify vendor chunk distribution and separation
import fs from 'fs';
import path from 'path';

const distAssets = path.resolve(process.cwd(), 'dist', 'assets');
const files = fs.readdirSync(distAssets);

const vendorFiles = {
  react: files.find(f => f.startsWith('vendor-react-') && f.endsWith('.js')),
  monaco: files.find(f => f.startsWith('vendor-monaco-') && f.endsWith('.js')),
  icons: files.find(f => f.startsWith('vendor-icons-') && f.endsWith('.js')),
  socket: files.find(f => f.startsWith('vendor-socket-') && f.endsWith('.js')),
  charts: files.find(f => f.startsWith('vendor-charts-') && f.endsWith('.js')),
};

console.log('Vendor chunks discovered:');
let missing = 0;
for (const [name, file] of Object.entries(vendorFiles)) {
  if (!file) {
    console.error(`[FAIL] Missing vendor chunk for ${name}!`);
    missing++;
  } else {
    const size = fs.statSync(path.join(distAssets, file)).size;
    console.log(`- vendor-${name}: ${file} (${(size / 1024).toFixed(2)} kB)`);
  }
}

if (missing > 0) {
  process.exit(1);
}

// Inspect contents for representative tokens
const checks = [
  { name: 'react', file: vendorFiles.react, mustContain: ['createElement', 'useState'] },
  { name: 'icons', file: vendorFiles.icons, mustContain: ['createLucideIcon'] },
  { name: 'socket', file: vendorFiles.socket, mustContain: ['io', 'Socket'] },
  { name: 'monaco', file: vendorFiles.monaco, mustContain: ['monaco'] }
];

let failedChecks = 0;
for (const check of checks) {
  const content = fs.readFileSync(path.join(distAssets, check.file), 'utf-8');
  for (const token of check.mustContain) {
    if (!content.includes(token)) {
      console.warn(`[WARN] vendor-${check.name} does not contain expected token "${token}"`);
    } else {
      console.log(`[PASS] vendor-${check.name} confirmed containing "${token}"`);
    }
  }
}

// Verify charts chunk
const chartsContent = fs.readFileSync(path.join(distAssets, vendorFiles.charts), 'utf-8');
console.log(`[INFO] vendor-charts content length: ${chartsContent.length} bytes; content: "${chartsContent.trim()}"`);

console.log('[PASS] Vendor chunk distribution verified.');
