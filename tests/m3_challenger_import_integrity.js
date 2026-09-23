import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const ROOT_DIR = path.resolve('.');
const SRC_DIR = path.resolve('src');
const FEATURES_DIR = path.resolve('src/features');
const CORE_DIR = path.resolve('src/core');
const PAGES_DIR = path.resolve('pages');
const COMPONENTS_DIR = path.resolve('components');
const HOOKS_DIR = path.resolve('hooks');
const UTILS_DIR = path.resolve('utils');

console.log('=== CHALLENGER M3: MODULE IMPORT & EXPORT INTEGRITY + CYCLE AUDIT ===\n');

// 1. Collect all TS/TSX files
function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        walk(fullPath, fileList);
      }
    } else if (/\.(ts|tsx|js|jsx)$/.test(file) && !file.endsWith('.d.ts')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const rootFiles = ['types.ts', 'App.tsx', 'index.tsx']
  .map(f => path.resolve(ROOT_DIR, f))
  .filter(f => fs.existsSync(f));

const allFrontendFiles = [
  ...rootFiles,
  ...walk(SRC_DIR),
  ...walk(PAGES_DIR),
  ...walk(COMPONENTS_DIR),
  ...walk(HOOKS_DIR),
  ...walk(UTILS_DIR),
];

const featuresAndCoreFiles = [
  ...walk(FEATURES_DIR),
  ...walk(CORE_DIR),
];

console.log(`Found ${allFrontendFiles.length} total frontend source files.`);
console.log(`Found ${featuresAndCoreFiles.length} files under src/features/ and src/core/.\n`);

// 2. Path resolution helper based on vite.config.ts and tsconfig.json
function resolveModuleSpecifier(specifier, fromFile) {
  // Check known path aliases
  const isAlias = specifier.startsWith('@core') ||
                  specifier.startsWith('@features') ||
                  specifier.startsWith('@ui') ||
                  specifier.startsWith('@data') ||
                  specifier.startsWith('@theme') ||
                  specifier.startsWith('@/');

  // External npm package (including scoped packages like @monaco-editor/react)
  if (!specifier.startsWith('.') && !specifier.startsWith('/') && !isAlias) {
    return { type: 'external', name: specifier };
  }

  let candidatePath = null;
  const fromDir = path.dirname(fromFile);

  if (specifier.startsWith('.')) {
    candidatePath = path.resolve(fromDir, specifier);
  } else if (specifier === '@core') {
    candidatePath = path.resolve(ROOT_DIR, 'src/core');
  } else if (specifier.startsWith('@core/')) {
    candidatePath = path.resolve(ROOT_DIR, 'src/core', specifier.slice(6));
  } else if (specifier === '@features') {
    candidatePath = path.resolve(ROOT_DIR, 'src/features');
  } else if (specifier.startsWith('@features/')) {
    candidatePath = path.resolve(ROOT_DIR, 'src/features', specifier.slice(10));
  } else if (specifier === '@ui') {
    candidatePath = path.resolve(ROOT_DIR, 'src/ui');
  } else if (specifier.startsWith('@ui/')) {
    candidatePath = path.resolve(ROOT_DIR, 'src/ui', specifier.slice(4));
  } else if (specifier === '@data') {
    candidatePath = path.resolve(ROOT_DIR, 'src/data');
  } else if (specifier.startsWith('@data/')) {
    candidatePath = path.resolve(ROOT_DIR, 'src/data', specifier.slice(6));
  } else if (specifier === '@theme') {
    candidatePath = path.resolve(ROOT_DIR, 'src/theme');
  } else if (specifier.startsWith('@theme/')) {
    candidatePath = path.resolve(ROOT_DIR, 'src/theme', specifier.slice(7));
  } else if (specifier.startsWith('@/components/')) {
    candidatePath = path.resolve(ROOT_DIR, 'components', specifier.slice(13));
  } else if (specifier.startsWith('@/pages/')) {
    candidatePath = path.resolve(ROOT_DIR, 'pages', specifier.slice(8));
  } else if (specifier.startsWith('@/utils/')) {
    candidatePath = path.resolve(ROOT_DIR, 'utils', specifier.slice(8));
  } else if (specifier.startsWith('@/hooks/')) {
    candidatePath = path.resolve(ROOT_DIR, 'hooks', specifier.slice(8));
  } else if (specifier === '@/types' || specifier === '@/types.ts') {
    candidatePath = path.resolve(ROOT_DIR, 'types.ts');
  } else if (specifier === '@') {
    candidatePath = path.resolve(ROOT_DIR, 'src');
  } else if (specifier.startsWith('@/')) {
    // Check if in src/ first, then root fallback
    const inSrc = path.resolve(ROOT_DIR, 'src', specifier.slice(2));
    const inRoot = path.resolve(ROOT_DIR, specifier.slice(2));
    candidatePath = inSrc;
  }

  if (!candidatePath) {
    return { type: 'unresolved', specifier, fromFile };
  }

  // Extensions to probe
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];
  for (const ext of extensions) {
    const probe = candidatePath + ext;
    if (fs.existsSync(probe) && fs.statSync(probe).isFile()) {
      return { type: 'resolved', resolvedPath: path.normalize(probe) };
    }
  }

  // Fallback check for @/ in root if src didn't match
  if (specifier.startsWith('@/') && !specifier.startsWith('@/components') && !specifier.startsWith('@/pages')) {
    const rootCandidate = path.resolve(ROOT_DIR, specifier.slice(2));
    for (const ext of extensions) {
      const probe = rootCandidate + ext;
      if (fs.existsSync(probe) && fs.statSync(probe).isFile()) {
        return { type: 'resolved', resolvedPath: path.normalize(probe) };
      }
    }
  }

  return { type: 'missing', specifier, attempted: candidatePath, fromFile };
}

// 3. Parse AST for exports and imports
const fileExportsCache = new Map();
const fileImportsMap = new Map();

function parseFileAST(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    code,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') || filePath.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  const exports = {
    hasDefault: false,
    named: new Set(),
    reExportAll: [], // list of resolved module paths
  };

  const imports = [];

  function visit(node) {
    // Export default
    if (ts.isExportAssignment(node) && !node.isExportEquals) {
      exports.hasDefault = true;
    }

    // Function/Class/Interface/Type/Variable with export modifier
    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
    const isExported = modifiers && modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
    const isDefault = modifiers && modifiers.some(m => m.kind === ts.SyntaxKind.DefaultKeyword);

    if (isDefault) {
      exports.hasDefault = true;
    }

    if (isExported) {
      if (ts.isFunctionDeclaration(node) && node.name) {
        exports.named.add(node.name.text);
      } else if (ts.isClassDeclaration(node) && node.name) {
        exports.named.add(node.name.text);
      } else if (ts.isInterfaceDeclaration(node) && node.name) {
        exports.named.add(node.name.text);
      } else if (ts.isTypeAliasDeclaration(node) && node.name) {
        exports.named.add(node.name.text);
      } else if (ts.isEnumDeclaration(node) && node.name) {
        exports.named.add(node.name.text);
      } else if (ts.isVariableStatement(node)) {
        for (const decl of node.declarationList.declarations) {
          if (ts.isIdentifier(decl.name)) {
            exports.named.add(decl.name.text);
          } else if (ts.isObjectBindingPattern(decl.name) || ts.isArrayBindingPattern(decl.name)) {
            // Binding patterns
            decl.name.elements.forEach(el => {
              if (ts.isBindingElement(el) && ts.isIdentifier(el.name)) {
                exports.named.add(el.name.text);
              }
            });
          }
        }
      }
    }

    // ExportDeclaration: export { a, b as c } from './x'
    if (ts.isExportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier ? node.moduleSpecifier.text : null;
      if (node.exportClause) {
        if (ts.isNamedExports(node.exportClause)) {
          for (const el of node.exportClause.elements) {
            const exportedName = el.name.text;
            exports.named.add(exportedName);
          }
        }
      } else if (moduleSpecifier) {
        // export * from './x'
        const resolved = resolveModuleSpecifier(moduleSpecifier, filePath);
        if (resolved.type === 'resolved') {
          exports.reExportAll.push(resolved.resolvedPath);
        }
      }

      if (moduleSpecifier) {
        imports.push({
          specifier: moduleSpecifier,
          isReExport: true,
          named: node.exportClause && ts.isNamedExports(node.exportClause) 
            ? node.exportClause.elements.map(e => (e.propertyName ? e.propertyName.text : e.name.text))
            : [],
          hasDefault: false,
          nodeLocation: sourceFile.getLineAndCharacterOfPosition(node.getStart()),
        });
      }
    }

    // ImportDeclaration: import Foo, { bar } from './x'
    if (ts.isImportDeclaration(node)) {
      const specifier = node.moduleSpecifier.text;
      const named = [];
      let hasDefault = false;

      if (node.importClause) {
        if (node.importClause.name) {
          hasDefault = true;
        }
        if (node.importClause.namedBindings) {
          if (ts.isNamedImports(node.importClause.namedBindings)) {
            for (const el of node.importClause.namedBindings.elements) {
              named.push(el.propertyName ? el.propertyName.text : el.name.text);
            }
          }
        }
      }

      imports.push({
        specifier,
        isReExport: false,
        named,
        hasDefault,
        nodeLocation: sourceFile.getLineAndCharacterOfPosition(node.getStart()),
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  fileExportsCache.set(filePath, exports);
  fileImportsMap.set(filePath, imports);
  return { exports, imports };
}

// Pre-parse all files to build exports cache
console.log('Parsing AST for all files...');
for (const file of allFrontendFiles) {
  parseFileAST(file);
}

// Function to check if a module exports a given symbol (including recursive export *)
function moduleHasExport(targetPath, symbolName, visited = new Set()) {
  if (visited.has(targetPath)) return false;
  visited.add(targetPath);

  const exp = fileExportsCache.get(targetPath);
  if (!exp) return false;

  if (symbolName === 'default') {
    return exp.hasDefault;
  }

  if (exp.named.has(symbolName)) {
    return true;
  }

  for (const reExportPath of exp.reExportAll) {
    if (moduleHasExport(reExportPath, symbolName, visited)) {
      return true;
    }
  }

  return false;
}

// ==========================================
// TEST 1: MODULE RESOLUTION & EXPORT INTEGRITY
// ==========================================
console.log('\n--- TEST 1: Module Imports & Export Integrity in src/features/ and src/core/ ---');
let resolutionFailures = 0;
let exportIntegrityFailures = 0;
let totalImportsChecked = 0;

for (const file of featuresAndCoreFiles) {
  const imports = fileImportsMap.get(file) || [];
  const relFile = path.relative(ROOT_DIR, file).replace(/\\/g, '/');

  for (const imp of imports) {
    totalImportsChecked++;
    const resolved = resolveModuleSpecifier(imp.specifier, file);

    if (resolved.type === 'missing' || resolved.type === 'unresolved') {
      console.error(`[FAIL] Unresolved import in ${relFile}:${imp.nodeLocation.line + 1}: "${imp.specifier}"`);
      resolutionFailures++;
      continue;
    }

    if (resolved.type === 'resolved') {
      const targetPath = resolved.resolvedPath;

      // Check default import
      if (imp.hasDefault) {
        const hasDef = moduleHasExport(targetPath, 'default');
        if (!hasDef) {
          console.error(`[FAIL] Missing default export in ${path.relative(ROOT_DIR, targetPath).replace(/\\/g, '/')}, imported by ${relFile}:${imp.nodeLocation.line + 1}`);
          exportIntegrityFailures++;
        }
      }

      // Check named imports
      for (const name of imp.named) {
        // Special case: type-only imports might not be in runtime exports if isolated, but ts parser captures interface/type
        const hasNamed = moduleHasExport(targetPath, name);
        if (!hasNamed) {
          console.error(`[FAIL] Missing named export "${name}" in ${path.relative(ROOT_DIR, targetPath).replace(/\\/g, '/')}, imported by ${relFile}:${imp.nodeLocation.line + 1}`);
          exportIntegrityFailures++;
        }
      }
    }
  }
}

console.log(`Total imports/re-exports verified in features & core: ${totalImportsChecked}`);
console.log(`Resolution failures: ${resolutionFailures}`);
console.log(`Export integrity failures: ${exportIntegrityFailures}`);

// ==========================================
// TEST 2: CIRCULAR DEPENDENCY DETECTION (AST GRAPH)
// ==========================================
console.log('\n--- TEST 2: Circular Dependency Check Across Entire Frontend ---');

// Build directed adjacency list
const graph = new Map();
for (const file of allFrontendFiles) {
  const normFile = path.normalize(file);
  if (!graph.has(normFile)) graph.set(normFile, new Set());

  const imports = fileImportsMap.get(normFile) || [];
  for (const imp of imports) {
    const res = resolveModuleSpecifier(imp.specifier, normFile);
    if (res.type === 'resolved') {
      graph.get(normFile).add(path.normalize(res.resolvedPath));
    }
  }
}

// Find cycles using Johnson's / Tarjan's or simple DFS cycle finder
const cycles = [];
const visited = new Set();
const recursionStack = new Set();
const currentPath = [];

function dfsCycle(node) {
  visited.add(node);
  recursionStack.add(node);
  currentPath.push(node);

  const neighbors = graph.get(node) || new Set();
  for (const neighbor of neighbors) {
    if (!visited.has(neighbor)) {
      dfsCycle(neighbor);
    } else if (recursionStack.has(neighbor)) {
      // Cycle detected
      const cycleStartIndex = currentPath.indexOf(neighbor);
      const cycle = [...currentPath.slice(cycleStartIndex), neighbor].map(p => path.relative(ROOT_DIR, p).replace(/\\/g, '/'));
      cycles.push(cycle);
    }
  }

  currentPath.pop();
  recursionStack.delete(node);
}

for (const file of allFrontendFiles) {
  const normFile = path.normalize(file);
  if (!visited.has(normFile)) {
    dfsCycle(normFile);
  }
}

console.log(`Cycles detected: ${cycles.length}`);
if (cycles.length > 0) {
  console.error('Circular dependencies found:');
  for (const c of cycles) {
    console.error(' -> ' + c.join(' -> '));
  }
} else {
  console.log('[PASS] ZERO circular dependencies found across all frontend files.');
}

// Summary
const totalErrors = resolutionFailures + exportIntegrityFailures + cycles.length;
console.log('\n=== AUDIT RESULT ===');
if (totalErrors === 0) {
  console.log('STATUS: PASSED - All imports resolve, all exports match, and 0 circular dependencies exist.');
  process.exit(0);
} else {
  console.error(`STATUS: FAILED - Found ${totalErrors} issue(s).`);
  process.exit(1);
}
