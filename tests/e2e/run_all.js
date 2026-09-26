#!/usr/bin/env node

/**
 * Axiocruit Enterprise E2E Test Suite Runner
 * Executes Tier 1-4 tests covering Features F1 - F25
 * Usage:
 *   node tests/e2e/run_all.js [options]
 * Options:
 *   --tier <1|2|3|4>        Run only tests in specified tier
 *   --feature <F1..F25>     Run only tests for specific feature
 *   --milestone <M1..M4>    Run only tests for specific milestone
 *   --grep <pattern>        Filter tests by name or ID regex
 *   --verbose               Show detailed failure traces and logs
 *   --json                  Output machine-readable JSON results
 *   --report <filepath>     Write JSON summary report to file
 */

import fs from 'fs';
import { registry } from './framework/runner.js';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  tier: null,
  feature: null,
  milestone: null,
  grep: null,
  verbose: false,
  json: false,
  report: null
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--tier' && args[i + 1]) {
    options.tier = args[++i];
  } else if (arg === '--feature' && args[i + 1]) {
    options.feature = args[++i];
  } else if (arg === '--milestone' && args[i + 1]) {
    options.milestone = args[++i];
  } else if (arg === '--grep' && args[i + 1]) {
    options.grep = args[++i];
  } else if (arg === '--verbose') {
    options.verbose = true;
  } else if (arg === '--json') {
    options.json = true;
  } else if (arg === '--report' && args[i + 1]) {
    options.report = args[++i];
  }
}

registry.setOptions(options);

async function main() {
  // Load all test suites dynamically
  await import('./suites/tier1_landing_page.test.js');
  await import('./suites/tier1_candidate_portal.test.js');
  await import('./suites/tier1_dashboards.test.js');
  await import('./suites/tier1_microservices.test.js');
  await import('./suites/tier2_boundary_corner.test.js');
  await import('./suites/tier3_cross_feature.test.js');
  await import('./suites/tier4_real_world.test.js');

  const summary = await registry.run();

  if (options.report) {
    fs.writeFileSync(options.report, JSON.stringify(summary, null, 2), 'utf-8');
    if (!options.json) {
      console.log(`Report written to ${options.report}`);
    }
  }

  // Clean exit code
  if (summary.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Test Runner Execution Error:', err);
  process.exit(1);
});
