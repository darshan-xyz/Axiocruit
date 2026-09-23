// Empirical test: Verify path alias resolution across tsconfig.json and vite.config.ts
import path from 'path';
import { createServer, build } from 'vite';
import ts from 'typescript';

// 1. Vite resolveId check
async function testViteAliases() {
  console.log('--- Testing Vite Path Alias Resolution ---');
  const server = await createServer();
  
  const testCases = [
    { spec: '@core', expectedType: 'file' },
    { spec: '@core/api', expectedType: 'file' },
    { spec: '@core/Layouts', expectedType: 'file' },
    { spec: '@features/recruiter', expectedType: 'file' },
    { spec: '@features/public', expectedType: 'file' },
    { spec: '@features/candidates', expectedType: 'file' },
    { spec: '@features/interviewer', expectedType: 'file' },
    { spec: '@features/interview-room', expectedType: 'file' },
    { spec: '@features/auth', expectedType: 'file' },
    { spec: '@ui', expectedType: 'file' },
    { spec: '@theme', expectedType: 'file' },
    { spec: '@data/sakromeCandidates', expectedType: 'file' },
    // Root alias attempts:
    { spec: '@features', expectedType: 'dir_or_file' },
    { spec: '@data', expectedType: 'dir_or_file' },
  ];

  const results = {};
  for (const tc of testCases) {
    try {
      const resolved = await server.pluginContainer.resolveId(tc.spec, path.resolve('src/core/App.tsx'));
      results[tc.spec] = resolved ? resolved.id : null;
      console.log(`[Vite] ${tc.spec} -> ${results[tc.spec]}`);
    } catch (err) {
      results[tc.spec] = `ERROR: ${err.message}`;
      console.error(`[Vite ERROR] ${tc.spec} -> ${err.message}`);
    }
  }
  await server.close();
  return results;
}

// 2. TypeScript module resolution check
function testTsAliases() {
  console.log('\n--- Testing TypeScript Compiler Path Alias Resolution ---');
  const configFile = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
  const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, process.cwd());
  
  const compilerOptions = parsedConfig.options;
  const containingFile = path.resolve('src/core/App.tsx');

  const moduleSpecs = [
    '@core',
    '@core/api',
    '@features/recruiter',
    '@features/public',
    '@features',
    '@ui',
    '@theme',
    '@data',
    '@data/sakromeCandidates'
  ];

  for (const spec of moduleSpecs) {
    const resolved = ts.resolveModuleName(spec, containingFile, compilerOptions, ts.sys);
    if (resolved.resolvedModule) {
      console.log(`[TypeScript] ${spec} -> ${resolved.resolvedModule.resolvedFileName} (ext: ${resolved.resolvedModule.extension})`);
    } else {
      console.warn(`[TypeScript UNRESOLVED] ${spec} could not be resolved by TypeScript`);
    }
  }
}

async function run() {
  await testViteAliases();
  testTsAliases();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
