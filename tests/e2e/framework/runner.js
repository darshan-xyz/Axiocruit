/**
 * Axiocruit E2E Test Suite - Core Test Runner
 * Executes Tier 1-4 tests, provides formatted reporting and clean exit codes
 */

class TestRegistry {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
    this.results = [];
    this.options = {
      tier: null,
      feature: null,
      milestone: null,
      grep: null,
      verbose: false,
      json: false
    };
  }

  setOptions(opts) {
    this.options = { ...this.options, ...opts };
  }

  describe(name, fn) {
    const suite = {
      name,
      tests: [],
      beforeAllHooks: [],
      afterAllHooks: [],
      beforeEachHooks: [],
      afterEachHooks: []
    };
    this.suites.push(suite);
    const prevSuite = this.currentSuite;
    this.currentSuite = suite;
    try {
      fn();
    } finally {
      this.currentSuite = prevSuite;
    }
  }

  test(name, metaOrFn, maybeFn) {
    let meta = {};
    let fn = maybeFn;
    if (typeof metaOrFn === 'function') {
      fn = metaOrFn;
    } else if (typeof metaOrFn === 'object' && metaOrFn !== null) {
      meta = metaOrFn;
    }

    const testItem = {
      name,
      id: meta.id || `T${meta.tier || 1}-${meta.feature || 'GEN'}-${Date.now().toString(36)}`,
      tier: meta.tier || 1,
      feature: meta.feature || null,
      milestone: meta.milestone || null,
      dependencies: meta.dependencies || [],
      fn,
      suiteName: this.currentSuite ? this.currentSuite.name : 'Default'
    };

    if (this.currentSuite) {
      this.currentSuite.tests.push(testItem);
    } else {
      let defaultSuite = this.suites.find(s => s.name === 'Default');
      if (!defaultSuite) {
        defaultSuite = { name: 'Default', tests: [], beforeAllHooks: [], afterAllHooks: [], beforeEachHooks: [], afterEachHooks: [] };
        this.suites.push(defaultSuite);
      }
      defaultSuite.tests.push(testItem);
    }
  }

  beforeAll(fn) {
    if (this.currentSuite) this.currentSuite.beforeAllHooks.push(fn);
  }

  afterAll(fn) {
    if (this.currentSuite) this.currentSuite.afterAllHooks.push(fn);
  }

  beforeEach(fn) {
    if (this.currentSuite) this.currentSuite.beforeEachHooks.push(fn);
  }

  afterEach(fn) {
    if (this.currentSuite) this.currentSuite.afterEachHooks.push(fn);
  }

  shouldRunTest(test) {
    if (this.options.tier && Number(this.options.tier) !== Number(test.tier)) {
      return false;
    }
    if (this.options.feature && String(this.options.feature).toUpperCase() !== String(test.feature).toUpperCase()) {
      return false;
    }
    if (this.options.milestone && String(this.options.milestone).toUpperCase() !== String(test.milestone).toUpperCase()) {
      return false;
    }
    if (this.options.grep) {
      const regex = new RegExp(this.options.grep, 'i');
      if (!regex.test(test.name) && !regex.test(test.suiteName) && !regex.test(test.id)) {
        return false;
      }
    }
    return true;
  }

  async run() {
    const startTime = Date.now();
    this.results = [];

    const colors = {
      reset: '\x1b[0m',
      green: '\x1b[32m',
      red: '\x1b[31m',
      yellow: '\x1b[33m',
      cyan: '\x1b[36m',
      bold: '\x1b[1m',
      dim: '\x1b[2m'
    };

    if (!this.options.json) {
      console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
      console.log(`${colors.bold}${colors.cyan} AXIOCRUIT ENTERPRISE E2E TEST SUITE RUNNER (TIERS 1-4) ${colors.reset}`);
      console.log(`${colors.dim} Filter: Tier=${this.options.tier || 'ALL'}, Feature=${this.options.feature || 'ALL'}, Milestone=${this.options.milestone || 'ALL'}${colors.reset}`);
      console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}\n`);
    }

    for (const suite of this.suites) {
      const testsToRun = suite.tests.filter(t => this.shouldRunTest(t));
      if (testsToRun.length === 0) continue;

      if (!this.options.json) {
        console.log(`\n${colors.bold}${colors.cyan}● Suite: ${suite.name}${colors.reset}`);
      }

      for (const hook of suite.beforeAllHooks) {
        await hook();
      }

      for (const test of testsToRun) {
        for (const hook of suite.beforeEachHooks) {
          await hook();
        }

        const tStart = Date.now();
        let status = 'passed';
        let error = null;

        try {
          if (typeof test.fn === 'function') {
            await test.fn();
          }
        } catch (err) {
          status = 'failed';
          error = err;
        }

        const durationMs = Date.now() - tStart;
        const resultItem = {
          ...test,
          status,
          error: error ? { message: error.message, stack: error.stack } : null,
          durationMs
        };
        this.results.push(resultItem);

        for (const hook of suite.afterEachHooks) {
          try { await hook(); } catch { /* ignore */ }
        }

        if (!this.options.json) {
          if (status === 'passed') {
            console.log(`  ${colors.green}✔ PASS${colors.reset} [${test.id}] ${test.name} ${colors.dim}(${durationMs}ms)${colors.reset}`);
          } else {
            console.log(`  ${colors.red}✖ FAIL${colors.reset} [${test.id}] ${test.name} ${colors.dim}(${durationMs}ms)${colors.reset}`);
            if (this.options.verbose && error) {
              console.log(`    ${colors.red}${error.message}${colors.reset}`);
            }
          }
        }
      }

      for (const hook of suite.afterAllHooks) {
        try { await hook(); } catch { /* ignore */ }
      }
    }

    const totalDuration = Date.now() - startTime;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const total = this.results.length;

    // Feature coverage stats
    const featureCoverage = {};
    for (let f = 1; f <= 25; f++) {
      const fKey = `F${f}`;
      featureCoverage[fKey] = { total: 0, passed: 0, failed: 0 };
    }
    for (const r of this.results) {
      if (r.feature && featureCoverage[r.feature]) {
        featureCoverage[r.feature].total++;
        if (r.status === 'passed') featureCoverage[r.feature].passed++;
        if (r.status === 'failed') featureCoverage[r.feature].failed++;
      }
    }

    // Tier stats
    const tierStats = {
      1: { total: 0, passed: 0, failed: 0 },
      2: { total: 0, passed: 0, failed: 0 },
      3: { total: 0, passed: 0, failed: 0 },
      4: { total: 0, passed: 0, failed: 0 }
    };
    for (const r of this.results) {
      if (tierStats[r.tier]) {
        tierStats[r.tier].total++;
        if (r.status === 'passed') tierStats[r.tier].passed++;
        if (r.status === 'failed') tierStats[r.tier].failed++;
      }
    }

    const summary = {
      total,
      passed,
      failed,
      durationMs: totalDuration,
      passRate: total > 0 ? ((passed / total) * 100).toFixed(1) + '%' : '0%',
      tierStats,
      featureCoverage,
      results: this.results
    };

    if (this.options.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log(`\n${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
      console.log(`${colors.bold} EXECUTION SUMMARY ${colors.reset}`);
      console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
      console.log(`Total Test Cases : ${colors.bold}${total}${colors.reset}`);
      console.log(`Passed           : ${colors.green}${colors.bold}${passed}${colors.reset}`);
      console.log(`Failed           : ${failed > 0 ? colors.red : colors.green}${colors.bold}${failed}${colors.reset}`);
      console.log(`Pass Rate        : ${passed === total ? colors.green : colors.yellow}${colors.bold}${summary.passRate}${colors.reset}`);
      console.log(`Duration         : ${totalDuration} ms\n`);

      console.log(`${colors.bold}Tier Breakdown:${colors.reset}`);
      for (let t = 1; t <= 4; t++) {
        const ts = tierStats[t];
        const statusColor = ts.failed > 0 ? colors.yellow : (ts.total > 0 ? colors.green : colors.dim);
        console.log(`  Tier ${t} (Coverage): ${statusColor}${ts.passed}/${ts.total} passed${colors.reset}`);
      }

      console.log(`\n${colors.bold}Feature Coverage Summary (F1 - F25):${colors.reset}`);
      let coveredFeatures = 0;
      for (let f = 1; f <= 25; f++) {
        const fKey = `F${f}`;
        const fc = featureCoverage[fKey];
        if (fc.total >= 5) coveredFeatures++;
        const badge = fc.total >= 5 ? `${colors.green}[>=5 cases]${colors.reset}` : `${colors.yellow}[${fc.total} cases]${colors.reset}`;
        console.log(`  ${fKey.padEnd(4)}: ${fc.passed}/${fc.total} passed ${badge}`);
      }
      console.log(`\nFeatures with >=5 test cases: ${coveredFeatures}/25`);

      if (failed > 0) {
        console.log(`\n${colors.bold}${colors.red}FAILURES / DEFECTS REQUIRING ATTENTION:${colors.reset}`);
        this.results.filter(r => r.status === 'failed').forEach((r, idx) => {
          console.log(`  ${idx + 1}. [${r.id}] ${r.name}`);
          console.log(`     Error: ${r.error ? r.error.message : 'Unknown failure'}`);
        });
      }
      console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}\n`);
    }

    return summary;
  }
}

export const registry = new TestRegistry();
export const describe = (name, fn) => registry.describe(name, fn);
export const test = (name, metaOrFn, maybeFn) => registry.test(name, metaOrFn, maybeFn);
export const beforeAll = (fn) => registry.beforeAll(fn);
export const afterAll = (fn) => registry.afterAll(fn);
export const beforeEach = (fn) => registry.beforeEach(fn);
export const afterEach = (fn) => registry.afterEach(fn);
