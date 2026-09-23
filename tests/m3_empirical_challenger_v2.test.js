import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import vm from 'vm';

console.log('========================================================================');
console.log('  CHALLENGER M3_V2: EMPIRICAL HARNESS FOR WIRING & NULL SAFETY FALLBACKS');
console.log('========================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, name, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ PASS: ${name}`);
  } else {
    failedTests++;
    console.error(`  ✖ FAIL: ${name} - ${details}`);
  }
}

// -----------------------------------------------------------------------------
// SUITE 1: Candidate Table & Drawer Wiring in RankedCandidatesView
// -----------------------------------------------------------------------------
console.log('--- Suite 1: Candidate Table & Drawer Coordinator Wiring ---');

const rankedCandidatesPath = path.resolve('src/features/candidates/RankedCandidatesView.tsx');
assert(fs.existsSync(rankedCandidatesPath), 'RankedCandidatesView.tsx exists in src/features/candidates/');

const rankedCandidatesSrc = fs.readFileSync(rankedCandidatesPath, 'utf8');

// Check imports
assert(rankedCandidatesSrc.includes("import { CandidateTable, CandidateInspectorDrawer } from '@/ui'"),
  'RankedCandidatesView imports CandidateTable and CandidateInspectorDrawer from @/ui');
assert(rankedCandidatesSrc.includes('SAKROME_CANDIDATES'),
  'RankedCandidatesView imports canonical SAKROME_CANDIDATES dataset');
assert(rankedCandidatesSrc.includes('SAKROME_SARAH_MILLER'),
  'RankedCandidatesView imports canonical SAKROME_SARAH_MILLER profile');

// Check wiring of CandidateTable
assert(rankedCandidatesSrc.includes('<CandidateTable'),
  'RankedCandidatesView renders <CandidateTable /> component');
assert(rankedCandidatesSrc.includes('candidates={candidates}'),
  'CandidateTable is wired with candidates state');
assert(rankedCandidatesSrc.includes('selectedCandidateId='),
  'CandidateTable receives selectedCandidateId');
assert(rankedCandidatesSrc.includes('onSelectCandidate='),
  'CandidateTable receives onSelectCandidate callback');
assert(rankedCandidatesSrc.includes('activeCategory={activeCategoryFilter}'),
  'CandidateTable receives activeCategory');
assert(rankedCandidatesSrc.includes('onCategoryChange='),
  'CandidateTable receives onCategoryChange handler');
assert(rankedCandidatesSrc.includes('searchTerm={searchTerm}'),
  'CandidateTable receives searchTerm');
assert(rankedCandidatesSrc.includes('onSearchChange='),
  'CandidateTable receives onSearchChange handler');

// Check wiring of CandidateInspectorDrawer
assert(rankedCandidatesSrc.includes('<CandidateInspectorDrawer'),
  'RankedCandidatesView conditionally renders <CandidateInspectorDrawer />');
assert(rankedCandidatesSrc.includes('candidate={selectedCandidate}'),
  'CandidateInspectorDrawer receives selectedCandidate prop');
assert(rankedCandidatesSrc.includes('onClose={() => setSelectedCandidate(null)}'),
  'CandidateInspectorDrawer receives onClose handler clearing selection');
assert(rankedCandidatesSrc.includes('onSchedule='),
  'CandidateInspectorDrawer receives onSchedule handler');
assert(rankedCandidatesSrc.includes('onStatusUpdate={handleStatusUpdate}'),
  'CandidateInspectorDrawer receives handleStatusUpdate handler');

// -----------------------------------------------------------------------------
// SUITE 2: CandidateInspectorDrawer Note Isolation & Gauge Math
// -----------------------------------------------------------------------------
console.log('\n--- Suite 2: CandidateInspectorDrawer Note Isolation & Calculations ---');

const drawerPath = path.resolve('components/CandidateInspectorDrawer.tsx');
assert(fs.existsSync(drawerPath), 'CandidateInspectorDrawer.tsx exists');
const drawerSrc = fs.readFileSync(drawerPath, 'utf8');

// Note isolation check: reset on candidate ID change
assert(drawerSrc.includes('setNotesList([])'),
  'Drawer resets notesList state when selected candidate changes');
assert(drawerSrc.includes('setNewNoteText(\'\')'),
  'Drawer resets newNoteText state when selected candidate changes');
assert(drawerSrc.includes('[candidate?._id, candidate?.candidate?._id]'),
  'Drawer useEffect dependency array tracks candidate IDs to prevent note contamination');

// SVG gauge calculation check
assert(drawerSrc.includes('gaugeRadius = 18') || drawerSrc.includes('2 * Math.PI * gaugeRadius'),
  'Drawer calculates circular SVG progress gauge using circumference 2 * PI * r');
assert(drawerSrc.includes('Math.min(100, Math.max(0, score))'),
  'Drawer clamps gauge score between 0% and 100% to avoid SVG rendering distortion');

// Tab list completeness
['Overview', 'Profile', 'Activity', 'Notes', 'Files'].forEach(tab => {
  assert(drawerSrc.includes(`'${tab}'`), `Drawer sub-navigation includes tab "${tab}"`);
});

// -----------------------------------------------------------------------------
// SUITE 3: CandidateTable Slicing & Resilience to Empty/Null Data
// -----------------------------------------------------------------------------
console.log('\n--- Suite 3: CandidateTable Slicing & Boundary Resilience ---');

const tablePath = path.resolve('components/CandidateTable.tsx');
assert(fs.existsSync(tablePath), 'CandidateTable.tsx exists');
const tableSrc = fs.readFileSync(tablePath, 'utf8');

assert(tableSrc.includes('(candidates || []).map'),
  'CandidateTable safely defaults candidates to empty array before normalization');
assert(tableSrc.includes('filteredList.slice(startIndex, startIndex + pageSize)'),
  'CandidateTable slices paginatedList using pageSize and startIndex');
assert(tableSrc.includes('Math.max(1, prev - 1)'),
  'CandidateTable clamps previous page navigation to at least 1');
assert(tableSrc.includes('Math.min(46, prev + 1)'),
  'CandidateTable clamps next page navigation to at most 46');

// -----------------------------------------------------------------------------
// SUITE 4: WebRTCVideoGrid Null-Pointer Resilience
// -----------------------------------------------------------------------------
console.log('\n--- Suite 4: WebRTCVideoGrid Null-Pointer Resilience ---');

const videoGridPath = path.resolve('src/features/interview-room/WebRTCVideoGrid.tsx');
assert(fs.existsSync(videoGridPath), 'WebRTCVideoGrid.tsx exists');
const videoGridSrc = fs.readFileSync(videoGridPath, 'utf8');

assert(videoGridSrc.includes('remoteStreams?: RemoteStream[]'),
  'WebRTCVideoGridProps declares remoteStreams as optional');
assert(videoGridSrc.includes('remoteStreams = []'),
  'WebRTCVideoGrid destructuring defaults remoteStreams to empty array');
assert(videoGridSrc.includes('(remoteStreams || []).map'),
  'WebRTCVideoGrid guards stream iteration with fallback empty array');
assert(videoGridSrc.includes('remoteStreams.length === 0') || videoGridSrc.includes('(remoteStreams || []).length === 0'),
  'WebRTCVideoGrid checks empty waiting state');

// -----------------------------------------------------------------------------
// SUITE 5: AdmissionRequestsOverlay Null-Pointer Resilience
// -----------------------------------------------------------------------------
console.log('\n--- Suite 5: AdmissionRequestsOverlay Null-Pointer Resilience ---');

const admissionPath = path.resolve('src/features/interview-room/AdmissionRequestsOverlay.tsx');
assert(fs.existsSync(admissionPath), 'AdmissionRequestsOverlay.tsx exists');
const admissionSrc = fs.readFileSync(admissionPath, 'utf8');

assert(admissionSrc.includes('requests?: PeerUser[]'),
  'AdmissionRequestsOverlayProps declares requests as optional');
assert(admissionSrc.includes('requests = []'),
  'AdmissionRequestsOverlay destructuring defaults requests to empty array');
assert(admissionSrc.includes('if (!requests || requests.length === 0) return null;'),
  'AdmissionRequestsOverlay returns null safely if requests is null, undefined, or empty');
assert(admissionSrc.includes('(requests || []).map'),
  'AdmissionRequestsOverlay guards mapping over requests');

// -----------------------------------------------------------------------------
// SUITE 6: ApplicantReviewModal Deep Null-Safety
// -----------------------------------------------------------------------------
console.log('\n--- Suite 6: ApplicantReviewModal Deep Null-Safety ---');

const modalPath = path.resolve('components/ApplicantReviewModal.tsx');
assert(fs.existsSync(modalPath), 'ApplicantReviewModal.tsx exists');
const modalSrc = fs.readFileSync(modalPath, 'utf8');

assert(modalSrc.includes('if (!application) return null;'),
  'ApplicantReviewModal early returns null if application is null or undefined');
assert(modalSrc.includes('app?.candidate?.profile || {}'),
  'ApplicantReviewModal uses safe navigation to access candidate profile');
assert(modalSrc.includes("app?.candidate?.name || 'Unknown Candidate'"),
  'ApplicantReviewModal provides fallback name when candidate name is absent');
assert(modalSrc.includes('data.skills?.map'),
  'ApplicantReviewModal uses optional chaining on skills array');
assert(modalSrc.includes('data.experience?.map'),
  'ApplicantReviewModal uses optional chaining on experience array');
assert(modalSrc.includes('data.education?.map'),
  'ApplicantReviewModal uses optional chaining on education array');
assert(modalSrc.includes('application?.status || \'Applied\''),
  'ApplicantReviewModal safely defaults application status to Applied');
assert(modalSrc.includes('onStatusUpdate(application?._id,'),
  'ApplicantReviewModal uses optional chaining on application._id for status updates');

// -----------------------------------------------------------------------------
// SUITE 7: In-Memory Transpilation & Execution of Normalization Logic
// -----------------------------------------------------------------------------
console.log('\n--- Suite 7: Dynamic In-Memory Evaluation of Candidate Logic ---');

const sakromeTsCode = fs.readFileSync(path.resolve('utils/sakromeCandidates.ts'), 'utf8');
const transpileResult = ts.transpileModule(sakromeTsCode, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  }
});

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
    return {};
  },
  console,
};
vm.createContext(moduleSandbox);
vm.runInContext(transpileResult.outputText, moduleSandbox);
const {
  normalizeToSakromeCandidate,
  getDepartmentMeta,
  getStageMeta,
  SAKROME_SARAH_MILLER
} = moduleSandbox.exports;

// Test null/undefined resilience
const nullNorm = normalizeToSakromeCandidate(null);
assert(nullNorm !== null && nullNorm._id === SAKROME_SARAH_MILLER._id,
  'normalizeToSakromeCandidate(null) falls back to Sarah Miller default');

const undefNorm = normalizeToSakromeCandidate(undefined);
assert(undefNorm !== null && undefNorm._id === SAKROME_SARAH_MILLER._id,
  'normalizeToSakromeCandidate(undefined) falls back to Sarah Miller default');

const emptyNorm = normalizeToSakromeCandidate({});
assert(emptyNorm.candidate && Array.isArray(emptyNorm.candidate.skills),
  'normalizeToSakromeCandidate({}) provides empty skills array');
assert(emptyNorm.candidate && Array.isArray(emptyNorm.candidate.notes),
  'normalizeToSakromeCandidate({}) provides empty notes array');

// Department fallback test
assert(getDepartmentMeta(null).name === 'Engineering',
  'getDepartmentMeta(null) defaults to Engineering');
assert(getDepartmentMeta(undefined).name === 'Engineering',
  'getDepartmentMeta(undefined) defaults to Engineering');
assert(getDepartmentMeta('Product Manager').name === 'Product',
  'getDepartmentMeta("Product Manager") returns Product');

// Stage fallback test
assert(getStageMeta(null).label === 'New',
  'getStageMeta(null) defaults to New');
assert(getStageMeta('Interview').label === 'Interview',
  'getStageMeta("Interview") returns Interview');

console.log('\n========================================================================');
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED:      ${passedTests}`);
console.log(`FAILED:      ${failedTests}`);
console.log(`PASS RATE:   ${((passedTests / totalTests) * 100).toFixed(1)}%`);
console.log('========================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
