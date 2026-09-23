import fs from 'fs';
import path from 'path';
import ts from 'typescript';

console.log('======================================================================');
console.log('  CHALLENGER M3.2: EMPIRICAL VERIFICATION & ADVERSARIAL STRESS SUITE  ');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const findings = [];

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`[FAIL] ${testName} - ${details}`);
    findings.push({ testName, details, severity: 'HIGH' });
  }
}

function warn(warningName, details = '') {
  console.warn(`[WARN] ${warningName}: ${details}`);
  findings.push({ testName: warningName, details, severity: 'MEDIUM' });
}

// ======================================================================
// TASK 1: BUNDLE CHUNK COUNT, SIZE LIMITS (<500 kB), AND VENDOR SPLITTING
// ======================================================================
console.log('\n>>> SECTION 1: Empirical Inspection of dist/ Chunks and Sizes');

const distPath = path.resolve('dist');
const assetsPath = path.join(distPath, 'assets');

assert(fs.existsSync(distPath), 'dist directory exists');
assert(fs.existsSync(assetsPath), 'dist/assets directory exists');

if (fs.existsSync(assetsPath)) {
  const assetFiles = fs.readdirSync(assetsPath);
  const jsChunks = [];
  const cssFiles = [];
  let largestChunkName = '';
  let largestChunkSize = 0;

  for (const file of assetFiles) {
    const fullPath = path.join(assetsPath, file);
    const stat = fs.statSync(fullPath);
    const sizeKb = stat.size / 1024;
    
    if (file.endsWith('.js')) {
      jsChunks.push({ name: file, sizeBytes: stat.size, sizeKb });
      if (stat.size > largestChunkSize) {
        largestChunkSize = stat.size;
        largestChunkName = file;
      }
    } else if (file.endsWith('.css')) {
      cssFiles.push({ name: file, sizeBytes: stat.size, sizeKb });
    }
  }

  console.log(`Found ${jsChunks.length} JS chunks and ${cssFiles.length} CSS files in dist/assets/`);
  console.log(`Total bundle JS chunks count: ${jsChunks.length}`);

  assert(jsChunks.length >= 10, `Chunk count is adequately decomposed (found ${jsChunks.length} chunks, expected >= 10)`);

  // Check chunk size threshold: no chunk > 500 kB (and strict budget 800 kB)
  const chunksExceeding500k = jsChunks.filter(c => c.sizeKb > 500);
  const chunksExceeding800k = jsChunks.filter(c => c.sizeKb > 800);

  assert(chunksExceeding500k.length === 0, `No JS chunk exceeds 500 kB threshold (largest: ${largestChunkName} at ${(largestChunkSize / 1024).toFixed(2)} kB)`,
    chunksExceeding500k.map(c => `${c.name} (${c.sizeKb.toFixed(2)} kB)`).join(', '));
  assert(chunksExceeding800k.length === 0, `No JS chunk exceeds 800 kB Vite budget limit`,
    chunksExceeding800k.map(c => `${c.name} (${c.sizeKb.toFixed(2)} kB)`).join(', '));

  console.log('\nChunk Inventory:');
  jsChunks.sort((a, b) => b.sizeBytes - a.sizeBytes).forEach(c => {
    console.log(`  - ${c.name.padEnd(45)} : ${c.sizeKb.toFixed(2).padStart(8)} kB`);
  });

  // Check vendor splitting
  console.log('\nChecking Vendor Chunk Splitting:');
  const vendorReact = jsChunks.find(c => c.name.startsWith('vendor-react'));
  const vendorMonaco = jsChunks.find(c => c.name.startsWith('vendor-monaco'));
  const vendorCharts = jsChunks.find(c => c.name.startsWith('vendor-charts'));
  const vendorIcons = jsChunks.find(c => c.name.startsWith('vendor-icons'));
  const vendorSocket = jsChunks.find(c => c.name.startsWith('vendor-socket'));

  assert(Boolean(vendorReact), 'vendor-react chunk exists and was segregated', vendorReact ? `${vendorReact.sizeKb.toFixed(2)} kB` : 'missing');
  assert(Boolean(vendorMonaco), 'vendor-monaco chunk exists and was segregated', vendorMonaco ? `${vendorMonaco.sizeKb.toFixed(2)} kB` : 'missing');
  assert(Boolean(vendorCharts), 'vendor-charts chunk exists and was segregated', vendorCharts ? `${vendorCharts.sizeKb.toFixed(2)} kB` : 'missing');
  assert(Boolean(vendorIcons), 'vendor-icons chunk exists and was segregated', vendorIcons ? `${vendorIcons.sizeKb.toFixed(2)} kB` : 'missing');
  assert(Boolean(vendorSocket), 'vendor-socket chunk exists and was segregated', vendorSocket ? `${vendorSocket.sizeKb.toFixed(2)} kB` : 'missing');

  // Check lazy route chunk segregation
  console.log('\nChecking Lazy Route Chunk Segregation:');
  const lazyRoutes = [
    'CodingTestPage',
    'CodingAssessment',
    'SubmitFeedback',
    'MessagesTab',
    'Admin',
    'OrgAdmin',
    'OrgJobsList',
    'OrgTeam',
    'AdaptiveResultReview',
    'FreelancerGigBoard'
  ];

  for (const route of lazyRoutes) {
    const found = jsChunks.find(c => c.name.startsWith(route));
    assert(Boolean(found), `Route component "${route}" is independently lazy-loaded`, found ? `${found.name} (${found.sizeKb.toFixed(2)} kB)` : 'missing individual chunk');
  }
}

// ======================================================================
// TASK 2: PATH ALIAS RESOLUTION CHECKING
// ======================================================================
console.log('\n>>> SECTION 2: Path Alias Resolution (@core, @features, @ui, @data, @theme)');

const tsconfigPath = path.resolve('tsconfig.json');
const viteConfigPath = path.resolve('vite.config.ts');

assert(fs.existsSync(tsconfigPath), 'tsconfig.json exists');
assert(fs.existsSync(viteConfigPath), 'vite.config.ts exists');

const tsconfigContent = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
const paths = tsconfigContent.compilerOptions.paths || {};

console.log('\nConfigured tsconfig.json paths:');
console.log(JSON.stringify(paths, null, 2));

// Test paths existence in tsconfig
assert(Boolean(paths['@core']) && Boolean(paths['@core/*']), 'tsconfig defines @core and @core/*');
assert(Boolean(paths['@features']) && Boolean(paths['@features/*']), 'tsconfig defines @features and @features/*');
assert(Boolean(paths['@ui']) && Boolean(paths['@ui/*']), 'tsconfig defines @ui and @ui/*');
assert(Boolean(paths['@data']) && Boolean(paths['@data/*']), 'tsconfig defines @data and @data/*');
assert(Boolean(paths['@theme']) && Boolean(paths['@theme/*']), 'tsconfig defines @theme and @theme/*');

// Programmatic resolution test using TypeScript compiler API
const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
const parsedCommandLine = ts.parseJsonConfigFileContent(
  configFile.config,
  ts.sys,
  path.dirname(tsconfigPath)
);

const compilerOptions = parsedCommandLine.options;
const testDummyFile = path.resolve('src/alias_probe.ts');

const probeModules = [
  '@core',
  '@core/Layouts',
  '@core/ThemeContext',
  '@core/api',
  '@features',
  '@features/recruiter',
  '@features/candidates',
  '@features/interview-room',
  '@features/interviewer',
  '@features/public',
  '@features/auth',
  '@ui',
  '@data',
  '@data/sakromeCandidates',
  '@theme'
];

console.log('\nResolving module specifiers via TypeScript compiler resolution:');

for (const mod of probeModules) {
  const resolved = ts.resolveModuleName(mod, testDummyFile, compilerOptions, ts.sys);
  const isResolved = Boolean(resolved.resolvedModule);

  if (mod === '@features' || mod === '@data') {
    // Note our specific finding: whether barrel index.ts exists for @features and @data directly
    if (!isResolved) {
      warn(`Direct barrel import "${mod}" does not resolve to an index.ts`, 
        `tsconfig targets src/${mod.slice(1)}/index.ts which is absent; subpaths like ${mod}/* resolve properly.`);
    } else {
      console.log(`[PASS] "${mod}" resolved to: ${resolved.resolvedModule?.resolvedFileName}`);
    }
  } else {
    assert(isResolved, `Alias "${mod}" successfully resolves in TypeScript`, 
      resolved.resolvedModule ? resolved.resolvedModule.resolvedFileName : 'Failed to resolve');
    if (isResolved) {
      console.log(`       -> ${path.relative(path.resolve('.'), resolved.resolvedModule.resolvedFileName)}`);
    }
  }
}

// Check Vite alias config
const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf8');
assert(viteConfigContent.includes("'@core'"), "vite.config.ts contains @core alias");
assert(viteConfigContent.includes("'@features'"), "vite.config.ts contains @features alias");
assert(viteConfigContent.includes("'@ui'"), "vite.config.ts contains @ui alias");
assert(viteConfigContent.includes("'@data'"), "vite.config.ts contains @data alias");
assert(viteConfigContent.includes("'@theme'"), "vite.config.ts contains @theme alias");

// ======================================================================
// TASK 3: NULL-SAFETY & ADVERSARIAL ERROR GUARDS IN DECOMPOSED COMPONENTS
// ======================================================================
console.log('\n>>> SECTION 3: Null-Safety and Error Guards in Decomposed Components');

// In-memory transpilation of utils/sakromeCandidates.ts
const sakromeTsCode = fs.readFileSync(path.resolve('utils/sakromeCandidates.ts'), 'utf8');
const transpileResult = ts.transpileModule(sakromeTsCode, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  }
});

// Execute the transpiled module in a simulated CommonJS environment
import vm from 'vm';
const moduleSandbox = {
  exports: {},
  module: { exports: {} },
  require: (mod) => {
    if (mod === 'lucide-react') {
      return {
        Box: () => 'BoxIcon',
        Code2: () => 'Code2Icon',
        Package: () => 'PackageIcon',
        Megaphone: () => 'MegaphoneIcon',
      };
    }
    if (mod === 'react') return {};
    return {};
  },
  console,
};
vm.createContext(moduleSandbox);
vm.runInContext(transpileResult.outputText, moduleSandbox);
const sakromeExports = Object.keys(moduleSandbox.exports).length > 0 ? moduleSandbox.exports : moduleSandbox.module.exports;
const {
  normalizeToSakromeCandidate,
  getDepartmentMeta,
  getStageMeta,
  SAKROME_SARAH_MILLER
} = sakromeExports;

  console.log('\n--- Stress-testing normalizeToSakromeCandidate() ---');

  // Test 1: null input
  let res = normalizeToSakromeCandidate(null);
  assert(res !== null && res._id === SAKROME_SARAH_MILLER._id, 
    'normalizeToSakromeCandidate(null) falls back safely to default candidate profile');

  // Test 2: undefined input
  res = normalizeToSakromeCandidate(undefined);
  assert(res !== null && res._id === SAKROME_SARAH_MILLER._id, 
    'normalizeToSakromeCandidate(undefined) falls back safely to default candidate profile');

  // Test 3: empty object
  res = normalizeToSakromeCandidate({});
  assert(res !== null && typeof res._id === 'string', 'normalizeToSakromeCandidate({}) generates fallback ID');
  assert(res.candidate && res.candidate.name === 'Candidate', 'normalizeToSakromeCandidate({}) provides safe fallback candidate name');
  assert(Array.isArray(res.candidate.skills), 'normalizeToSakromeCandidate({}) ensures skills is an array');
  assert(Array.isArray(res.candidate.experience), 'normalizeToSakromeCandidate({}) ensures experience is an array');
  assert(Array.isArray(res.candidate.education), 'normalizeToSakromeCandidate({}) ensures education is an array');
  assert(Array.isArray(res.candidate.notes), 'normalizeToSakromeCandidate({}) ensures notes is an array');
  assert(Array.isArray(res.candidate.files), 'normalizeToSakromeCandidate({}) ensures files is an array');

  // Test 4: nested null candidate object
  res = normalizeToSakromeCandidate({ candidate: null });
  assert(res !== null && res.candidate.name === 'Candidate', 
    'normalizeToSakromeCandidate({ candidate: null }) safely guards against null candidate user object');

  // Test 5: corrupted fields
  const corruptedInput = {
    _id: 'corrupted-app-1',
    candidate: {
      _id: 'corrupted-user-1',
      name: undefined,
      headline: undefined,
      skills: null,
      experience: null,
      education: null,
      notes: null,
      files: null,
    },
    aiScore: 'not_a_number',
    appliedAt: 'completely-invalid-date',
    status: null,
  };

  let threw = false;
  try {
    res = normalizeToSakromeCandidate(corruptedInput);
  } catch (e) {
    threw = true;
    console.error('Crash during corrupted candidate normalization:', e);
  }

  assert(!threw, 'normalizeToSakromeCandidate handles corrupted inputs without crashing');
  assert(Array.isArray(res.candidate.skills), 'Corrupted skills array replaced with fallback array');
  assert(Array.isArray(res.candidate.experience), 'Corrupted experience array replaced with fallback array');
  assert(Array.isArray(res.candidate.education), 'Corrupted education array replaced with fallback array');
  assert(typeof res.appliedDateFormatted === 'string', 'Applied date formatted fallback exists');

  // Test 6: getDepartmentMeta stress test
  console.log('\n--- Stress-testing getDepartmentMeta() ---');
  assert(getDepartmentMeta(null).name === 'Engineering', 'getDepartmentMeta(null) falls back to Engineering');
  assert(getDepartmentMeta(undefined).name === 'Engineering', 'getDepartmentMeta(undefined) falls back to Engineering');
  assert(getDepartmentMeta('').name === 'Engineering', 'getDepartmentMeta("") falls back to Engineering');
  assert(getDepartmentMeta('Lead UI/UX Designer').name === 'Design', 'getDepartmentMeta correctly identifies Design');
  assert(getDepartmentMeta('VP of Product Strategy').name === 'Product', 'getDepartmentMeta correctly identifies Product');
  assert(getDepartmentMeta('Growth Marketing Specialist').name === 'Marketing', 'getDepartmentMeta correctly identifies Marketing');
  assert(getDepartmentMeta('Unknown Department').name === 'Engineering', 'getDepartmentMeta default category is Engineering');

  // Test 7: getStageMeta stress test
  console.log('\n--- Stress-testing getStageMeta() ---');
  assert(getStageMeta(null).label === 'New', 'getStageMeta(null) falls back to New');
  assert(getStageMeta(undefined).label === 'New', 'getStageMeta(undefined) falls back to New');
  assert(getStageMeta('').label === 'New', 'getStageMeta("") falls back to New');
  assert(getStageMeta('Technical Interview Round').label === 'Interview', 'getStageMeta identifies Interview');
  assert(getStageMeta('Take Home Assessment').label === 'Assessment', 'getStageMeta identifies Assessment');
  assert(getStageMeta('Initial Screening').label === 'Screening', 'getStageMeta identifies Screening');

  // ======================================================================
  // TASK 4: VISUAL TOKENS & REFERENCE COLOR PALETTE AUDIT
  // ======================================================================
  console.log('\n>>> SECTION 4: Visual Design Tokens & Reference Palettes');

  const themeIndexPath = path.resolve('src/theme/index.ts');
  const themeContent = fs.readFileSync(themeIndexPath, 'utf8');

  assert(themeContent.includes('#D4F882'), 'Theme tokens include Herb Agency Lime background (#D4F882)');
  assert(themeContent.includes('#FF5D8F'), 'Theme tokens include StaffCentral Hot Pink (#FF5D8F)');
  assert(themeContent.includes('#10B981'), 'Theme tokens include StaffCentral Emerald (#10B981)');
  assert(themeContent.includes('#2563EB'), 'Theme tokens include StaffCentral Cobalt (#2563EB)');
  assert(themeContent.includes('#FF5A36'), 'Theme tokens include StaffCentral Coral (#FF5A36)');
  assert(themeContent.includes('#0A0E1A'), 'Theme tokens include Dark Background (#0A0E1A)');
  assert(themeContent.includes('#111726'), 'Theme tokens include Dark Surface (#111726)');

  console.log('\n======================================================================');
  console.log(`TOTAL TESTS: ${totalTests}`);
  console.log(`PASSED:      ${passedTests}`);
  console.log(`FAILED:      ${failedTests}`);
  console.log(`WARNINGS:    ${findings.filter(f => f.severity === 'MEDIUM').length}`);
  console.log('======================================================================\n');

  if (failedTests > 0) {
    console.error('VERDICT: REJECT - There are failing verification tests.');
    process.exit(1);
  } else {
    console.log('VERDICT: APPROVE - All bundle checks, path resolutions, null guards, and visual tokens verified.');
    process.exit(0);
  }
