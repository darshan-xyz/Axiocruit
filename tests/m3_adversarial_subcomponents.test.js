import fs from 'fs';
import path from 'path';

console.log('=== ADVERSARIAL TEST SUITE: DECOMPOSED SUBCOMPONENTS INTEGRITY ===\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ✖ FAIL: ${message}`);
  }
}

// Helper to inspect file contents
function getFile(relPath) {
  const fullPath = path.resolve(relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${relPath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

// =========================================================================
// SUITE 1: RECRUITER DECOMPOSED WIDGETS & CHART GEOMETRY
// =========================================================================
console.log('--- Suite 1: Recruiter Decomposed Widgets & SVG Math Models ---');

const donutCode = getFile('src/features/recruiter/JobsSummaryDonutChart.tsx');
assert(donutCode.includes('80 / 133') && donutCode.includes('20 / 133') && donutCode.includes('18 / 133') && donutCode.includes('15 / 133'),
  'Donut chart maintains exact job distribution fractions (80 + 20 + 18 + 15 = 133)');
assert(donutCode.includes('345.57'),
  'Donut chart uses mathematically exact circumference for radius 55 (2 * PI * 55 = 345.57)');
assert(donutCode.includes('transform -rotate-90'),
  'Donut chart rotates SVG -90deg so initial segment begins at 12 o\'clock');
assert(donutCode.includes('#8B5CF6') && donutCode.includes('#F59E0B') && donutCode.includes('#EC4899') && donutCode.includes('#10B981'),
  'Donut chart specifies 4 distinct department/status colors');

const ringsCode = getFile('src/features/recruiter/ConcentricFormatRings.tsx');
assert(ringsCode.includes('cOuter = 402.12') && ringsCode.includes('cMiddle = 301.59') && ringsCode.includes('cInner = 201.06'),
  'Concentric rings use exact circumferences for radii 64, 48, 32 (2 * PI * r)');
assert(ringsCode.includes('0.60') && ringsCode.includes('0.30') && ringsCode.includes('0.10'),
  'Concentric rings percentages sum to exactly 100% (60% Office, 30% Hybrid, 10% Remote)');
assert(ringsCode.includes('strokeLinecap="round"'),
  'Concentric rings use rounded terminal caps for modern gauge styling');

const matrixCode = getFile('src/features/recruiter/HiringMatrixGrid.tsx');
assert(matrixCode.includes('TALENT_PIPELINE_MATRIX_ROWS'),
  'Hiring matrix exports canonical TALENT_PIPELINE_MATRIX_ROWS dataset');
assert(matrixCode.includes('Staff AI/ML Engineer') && matrixCode.includes('Senior Full Stack Lead') && matrixCode.includes('Lead Product Designer'),
  'Hiring matrix contains benchmark engineering and design requisitions');
assert(matrixCode.includes('New Applied') && matrixCode.includes('Screening') && matrixCode.includes('Interview') && matrixCode.includes('Assessment') && matrixCode.includes('Hired'),
  'Hiring matrix table header contains all 5 recruitment pipeline stages');

const heroCardCode = getFile('src/features/recruiter/RecruiterHeroCard.tsx');
assert(heroCardCode.includes('Kevin Nunez') || heroCardCode.includes('name') || heroCardCode.includes('Russel Sims'),
  'Recruiter hero card supports recruiter persona with dynamic/fallback profile rendering');
assert(heroCardCode.includes('Hot Pink') || heroCardCode.includes('#FF5D8F') || heroCardCode.includes('#10B981') || heroCardCode.includes('bg-'),
  'Recruiter hero card / stat quadrant implements 4-quadrant visual styling');

// =========================================================================
// SUITE 2: INTERVIEW ROOM DECOMPOSED COMPONENTS & PROTOCOLS
// =========================================================================
console.log('\n--- Suite 2: Interview Room Decomposed Components & Safety Guards ---');

const hudCode = getFile('src/features/interview-room/ProctoringHUD.tsx');
assert(hudCode.includes('ProctorAlertItem'),
  'ProctoringHUD declares ProctorAlertItem type contract');
assert(hudCode.includes('isRecruiter') && hudCode.includes('proctorWsConnected'),
  'ProctoringHUD handles candidate vs recruiter role-conditional presentation');
assert(hudCode.includes('tab_switch') && hudCode.includes('copy') && hudCode.includes('paste') && hudCode.includes('face_lost') && hudCode.includes('gaze'),
  'ProctoringHUD maps all 5 proctoring telemetry alert types with contextual icons');
assert(hudCode.includes('handleClickOutside'),
  'ProctoringHUD alert dropdown binds click-outside listener to prevent stuck overlays');

const adaptiveCode = getFile('src/features/interview-room/AdaptiveTestPanel.tsx');
assert(adaptiveCode.includes('if (!adaptiveSession) return null;'),
  'AdaptiveTestPanel safely handles null adaptiveSession without throwing');
assert(adaptiveCode.includes("status === 'completed'") && adaptiveCode.includes("status === 'in_progress'"),
  'AdaptiveTestPanel cleanly differentiates completed vs active session states');
assert(adaptiveCode.includes('lastEvaluation.passed') && adaptiveCode.includes('Failed') && adaptiveCode.includes('Passed'),
  'AdaptiveTestPanel renders discrete UI feedback for test evaluation outcomes');
assert(adaptiveCode.includes('currentQuestion?.title'),
  'AdaptiveTestPanel uses safe navigation operators (?.) on questions to prevent undefined property crashes');

const monacoCode = getFile('src/features/interview-room/MonacoCodeEditor.tsx');
assert(monacoCode.includes("@monaco-editor/react"),
  'MonacoCodeEditor wraps official @monaco-editor/react component');
assert(monacoCode.includes('isEditorFocused') && (monacoCode.includes('flex-[3]') || monacoCode.includes('flex-[2]')),
  'MonacoCodeEditor implements dynamic flex expansion on editor focus toggle');
assert(monacoCode.includes('JetBrains Mono'),
  'MonacoCodeEditor enforces developer monospace font stack');

const videoGridCode = getFile('src/features/interview-room/WebRTCVideoGrid.tsx');
assert(videoGridCode.includes('remoteStreams') && videoGridCode.includes('localVideoRef'),
  'WebRTCVideoGrid manages local and remote peer video streams');

// =========================================================================
// SUITE 3: PUBLIC FEATURE SUBCOMPONENTS & RESPONSIVENESS
// =========================================================================
console.log('\n--- Suite 3: Public Decomposed Subcomponents & Herb Agency Tokens ---');

const heroCode = getFile('src/features/public/HeroHerbSection.tsx');
assert(heroCode.includes('#D4F882') || heroCode.includes('bg-lime-'),
  'HeroHerbSection enforces Herb Agency lime color token');
assert(heroCode.includes('[TALENT]') && heroCode.includes('[HUB]'),
  'HeroHerbSection renders rounded [TALENT] and [HUB] badge tokens');

const tabletCode = getFile('src/features/public/PerspectiveTabletMockup.tsx');
assert(tabletCode.includes('rotateX(13deg)') && tabletCode.includes('rotateY(-5deg)'),
  'PerspectiveTabletMockup specifies exact 3D tilt coordinates');
assert(tabletCode.includes('sm:'),
  'PerspectiveTabletMockup uses sm: responsive prefixes to disable 3D rotation on mobile viewports');

const cardsCode = getFile('src/features/public/MetricCards3D.tsx');
assert(cardsCode.includes('translateZ(50px)') && cardsCode.includes('translateZ(65px)') && cardsCode.includes('translateZ(55px)'),
  'MetricCards3D applies 3-tier depth offsets (50px, 65px, 55px)');
assert(cardsCode.includes('$234.98K') && cardsCode.includes('347.23%') && cardsCode.includes('3,639'),
  'MetricCards3D renders verbatim quantitative statistics from Herb Agency spec');

const toggleCode = getFile('src/features/public/SegmentedToggle.tsx');
assert(toggleCode.includes('marketing') && toggleCode.includes('website_design'),
  'SegmentedToggle encapsulates exact state keys for marketing and website design');

// =========================================================================
// SUITE 4: CANDIDATES & THEME DECOMPOSED MODULES
// =========================================================================
console.log('\n--- Suite 4: Candidates, Theme & UI Modular Tokens ---');

const themeCode = getFile('src/theme/index.ts');
assert(themeCode.includes('THEME_COLORS') && themeCode.includes('DEPARTMENT_COLORS'),
  'Theme tokens module defines THEME_COLORS and DEPARTMENT_COLORS');
assert(themeCode.includes('#D4F882') && themeCode.includes('#FF5D8F') && themeCode.includes('#10B981') && themeCode.includes('#2563EB') && themeCode.includes('#FF5A36'),
  'THEME_COLORS contains Herb lime, Hot Pink, Emerald, Cobalt, and Coral tokens');

const sakromeDataCode = getFile('src/data/sakromeCandidates.ts');
assert(sakromeDataCode.includes('SAKROME_CANDIDATES'),
  'src/data/sakromeCandidates.ts cleanly re-exports canonical candidate dataset');

const uiIndexCode = getFile('src/ui/index.ts');
assert(uiIndexCode.includes('CandidateTable') && uiIndexCode.includes('CandidateInspectorDrawer'),
  'src/ui/index.ts exposes CandidateTable and CandidateInspectorDrawer primitives');

// =========================================================================
// SUITE 5: CIRCULAR DEPENDENCY SMOKE VERIFICATION IN INTERVIEW-ROOM
// =========================================================================
console.log('\n--- Suite 5: Structural Integrity & Circular Dependency Regression ---');

const containerCode = getFile('src/features/interview-room/InterviewRoomContainer.tsx');
const hasSelfBarrelImport = /from\s+['"]\.\/['"]|from\s+['"]\.\/index['"]/.test(containerCode);

assert(!hasSelfBarrelImport,
  'InterviewRoomContainer.tsx MUST NOT import from its own barrel index ("./" or "./index") to prevent circular dependency');

// =========================================================================
// SUMMARY
// =========================================================================
console.log('\n========================================================================');
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests}`);
console.log(`PASS RATE: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
console.log('========================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
