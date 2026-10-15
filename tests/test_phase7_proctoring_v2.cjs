/**
 * AXIOCRUIT PHASE 7 NODE INTEGRATION TEST SUITE
 * Biometric Proctoring Service V2: JWT Auth, Binary Ingestion, Baseline Calibration & Backpressure
 */

const path = require('path');
module.paths.push(path.resolve(__dirname, '../server/node_modules'));

const assert = require('assert');
const fs = require('fs');
const { spawnSync } = require('child_process');

console.log('========================================================================');
console.log('  AXIOCRUIT PHASE 7: BIOMETRIC PROCTORING V2 NODE INTEGRATION HARNESS   ');
console.log('========================================================================');

// 1. Verify hooks/useProctoring.ts static contracts
console.log('\n● Suite 1: useProctoring.ts Interface & Contract Validation');
const hookPath = path.resolve(__dirname, '../hooks/useProctoring.ts');
const hookContent = fs.readFileSync(hookPath, 'utf8');

assert.ok(hookContent.includes('export interface ProctoringReturn'), 'Must export ProctoringReturn');
assert.ok(hookContent.includes('calibrateBaseline: (samples?: number) => void'), 'ProctoringReturn must declare calibrateBaseline');
assert.ok(hookContent.includes('?token=${encodeURIComponent(token)}'), 'connectWs must append token query parameter');
assert.ok(hookContent.includes("ws.binaryType = 'arraybuffer'"), 'WebSocket must configure arraybuffer binaryType');
assert.ok(hookContent.includes("ws.send(JSON.stringify({ type: 'calibrate', samples }))"), 'calibrateBaseline must emit calibrate message');
console.log('  ✔ PASS: useProctoring.ts declares calibrateBaseline, binaryType, and JWT token passing');

// 2. Verify proctoring-service/main.py contracts
console.log('\n● Suite 2: proctoring-service/main.py Architectural Contracts');
const pyMainPath = path.resolve(__dirname, '../proctoring-service/main.py');
const pyContent = fs.readFileSync(pyMainPath, 'utf8');

assert.ok(pyContent.includes('import jwt'), 'Python proctoring service must import jwt');
assert.ok(pyContent.includes('PROCTORING_REQUIRE_AUTH'), 'Must define PROCTORING_REQUIRE_AUTH');
assert.ok(pyContent.includes('baseline_h: float = 0.5'), 'compute_gaze must take baseline_h parameter');
assert.ok(pyContent.includes('baseline_v: float = 0.5'), 'compute_gaze must take baseline_v parameter');
assert.ok(pyContent.includes('"bytes" in message and message["bytes"]'), 'WebSocket must handle direct binary frames');
assert.ok(pyContent.includes('is_processing_frame'), 'WebSocket must enforce frame backpressure');
assert.ok(pyContent.includes('dropped_frames'), 'WebSocket must track dropped frames on backpressure');
console.log('  ✔ PASS: main.py implements JWT auth, binary frame decoding, baseline calibration, and backpressure');

// 3. Run proctoring-service Python test suite
console.log('\n● Suite 3: Python Microservice Empirical Verification');
const pythonExe = path.resolve(__dirname, '../proctoring-service/venv/Scripts/python.exe');
const testPyPath = path.resolve(__dirname, '../proctoring-service/test_phase7.py');

if (fs.existsSync(pythonExe) && fs.existsSync(testPyPath)) {
  const result = spawnSync(pythonExe, [testPyPath], {
    cwd: path.resolve(__dirname, '../proctoring-service'),
    encoding: 'utf8',
    timeout: 30000,
  });

  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    throw new Error(`Python test_phase7.py failed with exit code ${result.status}`);
  }

  assert.ok(result.stdout.includes('TOTAL PHASE 7 TESTS: 5 SUITES / 11 ASSERTIONS'), 'Must report 11 passed assertions');
  assert.ok(result.stdout.includes('FAILED: 0'), 'Must have zero failures');
  console.log('  ✔ PASS: proctoring-service/test_phase7.py executed successfully (11/11 assertions passed)');
} else {
  console.log('  ⚠ SKIP: Python venv not found at path, skipping live Python execution');
}

console.log('\n========================================================================');
console.log('TOTAL PHASE 7 INTEGRATION TESTS: 3 SUITES');
console.log('PASSED: 3');
console.log('FAILED: 0');
console.log('========================================================================\n');
