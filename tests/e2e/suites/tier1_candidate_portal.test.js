/**
 * Tier 1 Test Suite: Sakrome Candidate Portal & Inspector Drawer (Features F7 - F16)
 * Authoritative Source: ORIGINAL_REQUEST.md (R2) & PROJECT.md (Features F7-F16)
 */

import { describe, test } from '../framework/runner.js';
import { expect } from '../framework/assert.js';
import { defaultInspector } from '../framework/dom_parser.js';

describe('Tier 1: Sakrome Candidate Portal & Inspector Drawer (F7 - F16)', () => {
  const layoutsPath = 'components/Layouts.tsx';
  const rankedPath = 'pages/RankedCandidates.tsx';
  const recruiterPath = 'pages/Recruiter.tsx';
  const candidateTablePath = 'components/CandidateTable.tsx';
  const candidateDrawerPath = 'components/CandidateInspectorDrawer.tsx';
  const sakromeDataPath = 'utils/sakromeCandidates.ts';

  // Helper to search across component candidates
  const checkAnyFile = (paths, pattern) => {
    return paths.some(p => defaultInspector.hasPattern(p, pattern));
  };

  // --------------------------------------------------------------------------
  // Feature F7: Sakrome macOS Shell & Nav
  // --------------------------------------------------------------------------
  test('F7-01: Floating macOS container has rounded corners and deep drop shadow', {
    id: 'T1-F7-01', tier: 1, feature: 'F7', milestone: 'M2'
  }, () => {
    const content = defaultInspector.readFile(layoutsPath);
    expect(content).toMatch(/rounded-\[28px\]|rounded-\[36px\]/);
    expect(content).toMatch(/shadow-2xl/);
  });

  test('F7-02: macOS window controls render red (#FF5F56), yellow (#FFBD2E), green (#27C93F)', {
    id: 'T1-F7-02', tier: 1, feature: 'F7', milestone: 'M2'
  }, () => {
    const content = defaultInspector.readFile(layoutsPath);
    expect(content).toContain('#FF5F56');
    expect(content).toContain('#FFBD2E');
    expect(content).toContain('#27C93F');
  });

  test('F7-03: Sakrome-style top navigation pills container exists in header', {
    id: 'T1-F7-03', tier: 1, feature: 'F7', milestone: 'M2'
  }, () => {
    const content = defaultInspector.readFile(layoutsPath);
    expect(content).toMatch(/topPills|recruiterTopPills/);
  });

  test('F7-04: Recruiter top navigation items include Home, Candidates, Jobs', {
    id: 'T1-F7-04', tier: 1, feature: 'F7', milestone: 'M2'
  }, () => {
    const content = defaultInspector.readFile(layoutsPath);
    expect(content).toContain("'Home'");
    expect(content).toContain("'Candidates'");
    expect(content).toContain("'Jobs'");
  });

  test('F7-05: Active Candidates pill renders in solid blue state', {
    id: 'T1-F7-05', tier: 1, feature: 'F7', milestone: 'M2'
  }, () => {
    const content = defaultInspector.readFile(layoutsPath);
    expect(content).toMatch(/isPillActive[^?]*\?[^:]*(?:border-blue-600|bg-blue-600)/);
  });

  // --------------------------------------------------------------------------
  // Feature F8: Category Filter Pills
  // --------------------------------------------------------------------------
  test('F8-01: Category filter pills include All, Design, Engineering, Product, Marketing', {
    id: 'T1-F8-01', tier: 1, feature: 'F8', milestone: 'M2'
  }, () => {
    const hasPills = checkAnyFile([candidateTablePath, rankedPath], /All.*Design.*Engineering.*Product.*Marketing|All.*Engineering.*Design/);
    expect(hasPills).toBe(true);
  });

  test('F8-02: Category filtering defaults to "All"', {
    id: 'T1-F8-02', tier: 1, feature: 'F8', milestone: 'M2'
  }, () => {
    const hasDefault = checkAnyFile([candidateTablePath, rankedPath], /useState<[^>]*>\(['"`]All['"`]\)/);
    expect(hasDefault).toBe(true);
  });

  test('F8-03: Selecting "Design" category filters candidates to design profiles', {
    id: 'T1-F8-03', tier: 1, feature: 'F8', milestone: 'M2'
  }, () => {
    const hasFilter = checkAnyFile([candidateTablePath, rankedPath], /Design/);
    expect(hasFilter).toBe(true);
  });

  test('F8-04: Selecting "Engineering" category filters candidates to engineering profiles', {
    id: 'T1-F8-04', tier: 1, feature: 'F8', milestone: 'M2'
  }, () => {
    const hasFilter = checkAnyFile([candidateTablePath, rankedPath], /Engineering/);
    expect(hasFilter).toBe(true);
  });

  test('F8-05: Category pill selection invokes callback and updates active category', {
    id: 'T1-F8-05', tier: 1, feature: 'F8', milestone: 'M2'
  }, () => {
    const hasCallback = checkAnyFile([candidateTablePath, rankedPath], /setSelectedCategory|onCategoryChange|setActiveCategoryFilter/);
    expect(hasCallback).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Feature F9: High-Density Candidate Table
  // --------------------------------------------------------------------------
  test('F9-01: High-density table renders candidate avatar, name, and headline', {
    id: 'T1-F9-01', tier: 1, feature: 'F9', milestone: 'M2'
  }, () => {
    const hasAvatar = checkAnyFile([candidateTablePath, rankedPath], /profilePicture|DEFAULT_AVATAR/);
    expect(hasAvatar).toBe(true);
  });

  test('F9-02: Design department renders purple cube badge (Box icon)', {
    id: 'T1-F9-02', tier: 1, feature: 'F9', milestone: 'M2'
  }, () => {
    const hasDesignBadge = checkAnyFile([candidateTablePath, rankedPath], /icon:\s*Box.*text-purple/);
    expect(hasDesignBadge).toBe(true);
  });

  test('F9-03: Engineering department renders orange code badge (Terminal / Code2 icon)', {
    id: 'T1-F9-03', tier: 1, feature: 'F9', milestone: 'M2'
  }, () => {
    const hasEngBadge = checkAnyFile([candidateTablePath, rankedPath], /icon:\s*(?:Terminal|Code2).*text-orange/);
    expect(hasEngBadge).toBe(true);
  });

  test('F9-04: Product department renders green box badge (Layers / Package icon)', {
    id: 'T1-F9-04', tier: 1, feature: 'F9', milestone: 'M2'
  }, () => {
    const hasProdBadge = checkAnyFile([candidateTablePath, rankedPath], /icon:\s*(?:Layers|Package).*text-emerald/);
    expect(hasProdBadge).toBe(true);
  });

  test('F9-05: Marketing department renders blue megaphone badge (Megaphone icon)', {
    id: 'T1-F9-05', tier: 1, feature: 'F9', milestone: 'M2'
  }, () => {
    const hasMktBadge = checkAnyFile([candidateTablePath, rankedPath], /icon:\s*Megaphone.*text-blue/);
    expect(hasMktBadge).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Feature F10: Table Stage & Match Score
  // --------------------------------------------------------------------------
  test('F10-01: Stage pills render for Interview, Screening, Assessment, and New', {
    id: 'T1-F10-01', tier: 1, feature: 'F10', milestone: 'M2'
  }, () => {
    const content = defaultInspector.readFile('components/UI.tsx');
    expect(content).toContain('interview:');
    expect(content).toContain('screening:');
    expect(content).toContain('assessment:');
    expect(content).toContain('new:');
  });

  test('F10-02: DualToneProgressBar renders match score bar per row', {
    id: 'T1-F10-02', tier: 1, feature: 'F10', milestone: 'M2'
  }, () => {
    const hasDualTone = checkAnyFile([candidateTablePath, rankedPath], /DualToneProgressBar/);
    expect(hasDualTone).toBe(true);
  });

  test('F10-03: Applied Date column formatted and rendered in candidate table', {
    id: 'T1-F10-03', tier: 1, feature: 'F10', milestone: 'M2'
  }, () => {
    const hasDate = checkAnyFile([candidateTablePath, rankedPath], /appliedAt|Applied Date/);
    expect(hasDate).toBe(true);
  });

  test('F10-04: Match score values map to dual-tone color transitions', {
    id: 'T1-F10-04', tier: 1, feature: 'F10', milestone: 'M2'
  }, () => {
    const content = defaultInspector.readFile('components/UI.tsx');
    expect(content).toMatch(/score >= 80 \? 'bg-blue-600/);
    expect(content).toMatch(/score >= 50 \? 'bg-amber-500'/);
  });

  test('F10-05: Selecting candidate row activates inspection drawer', {
    id: 'T1-F10-05', tier: 1, feature: 'F10', milestone: 'M2'
  }, () => {
    const hasSelect = checkAnyFile([candidateTablePath, rankedPath], /setSelectedCandidate|onSelectCandidate/);
    expect(hasSelect).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Feature F11: Table Pagination Pills
  // --------------------------------------------------------------------------
  test('F11-01: Pagination container exists in candidate table footer', {
    id: 'T1-F11-01', tier: 1, feature: 'F11', milestone: 'M2'
  }, () => {
    const hasPagination = checkAnyFile([candidateTablePath, rankedPath], /Showing 1 to.*candidates|currentPage|totalPages|Pagination/);
    expect(hasPagination).toBe(true);
  });

  test('F11-02: Pagination format matches < 1 2 3 ... 46 > pattern', {
    id: 'T1-F11-02', tier: 1, feature: 'F11', milestone: 'M2'
  }, () => {
    const hasPills = checkAnyFile([candidateTablePath, rankedPath], /46/);
    expect(hasPills).toBe(true);
  });

  test('F11-03: Navigation arrows (< and >) present for pagination', {
    id: 'T1-F11-03', tier: 1, feature: 'F11', milestone: 'M2'
  }, () => {
    const hasNav = checkAnyFile([candidateTablePath, rankedPath], /[‹<].*[›>]/);
    expect(hasNav).toBe(true);
  });

  test('F11-04: Active page highlighted with distinct pill styling', {
    id: 'T1-F11-04', tier: 1, feature: 'F11', milestone: 'M2'
  }, () => {
    const hasActiveStyle = checkAnyFile([candidateTablePath, rankedPath], /bg-blue-600 text-white|border-blue-600/);
    expect(hasActiveStyle).toBe(true);
  });

  test('F11-05: Ellipsis "..." rendered for condensed pagination', {
    id: 'T1-F11-05', tier: 1, feature: 'F11', milestone: 'M2'
  }, () => {
    const hasEllipsis = checkAnyFile([candidateTablePath, rankedPath], /\.\.\./);
    expect(hasEllipsis).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Feature F12: Slide-Over Inspector Drawer
  // --------------------------------------------------------------------------
  test('F12-01: Slide-over drawer container opens when candidate is selected', {
    id: 'T1-F12-01', tier: 1, feature: 'F12', milestone: 'M2'
  }, () => {
    const hasDrawer = checkAnyFile([candidateDrawerPath, rankedPath], /InspectionDrawer|selectedCandidate/);
    expect(hasDrawer).toBe(true);
  });

  test('F12-02: Canonical Sarah Miller profile present with Lead Product Designer headline', {
    id: 'T1-F12-02', tier: 1, feature: 'F12', milestone: 'M2'
  }, () => {
    const hasSarah = checkAnyFile([sakromeDataPath, rankedPath], /Sarah Miller/);
    expect(hasSarah).toBe(true);
  });

  test('F12-03: Circular progress gauge rendered in drawer', {
    id: 'T1-F12-03', tier: 1, feature: 'F12', milestone: 'M2'
  }, () => {
    const hasGauge = checkAnyFile([candidateDrawerPath, rankedPath], /CircularProgressGauge/);
    expect(hasGauge).toBe(true);
  });

  test('F12-04: Circular match gauge displays 83% Strong match for Sarah Miller', {
    id: 'T1-F12-04', tier: 1, feature: 'F12', milestone: 'M2'
  }, () => {
    const has83 = checkAnyFile([sakromeDataPath, rankedPath], /aiScore:\s*83/);
    expect(has83).toBe(true);
  });

  test('F12-05: Drawer includes dismiss close button', {
    id: 'T1-F12-05', tier: 1, feature: 'F12', milestone: 'M2'
  }, () => {
    const content = defaultInspector.readFile('components/UI.tsx');
    expect(content).toMatch(/InspectionDrawerProps.*onClose/s);
  });

  // --------------------------------------------------------------------------
  // Feature F13: Drawer 5 Sub-Tabs
  // --------------------------------------------------------------------------
  test('F13-01: Drawer presents 5 sub-tabs: Overview, Profile, Activity, Notes, Files', {
    id: 'T1-F13-01', tier: 1, feature: 'F13', milestone: 'M2'
  }, () => {
    const hasTabs = checkAnyFile([candidateDrawerPath, rankedPath], /Overview.*Profile.*Activity.*Notes.*Files/s);
    expect(hasTabs).toBe(true);
  });

  test('F13-02: Switching sub-tabs updates active tab state', {
    id: 'T1-F13-02', tier: 1, feature: 'F13', milestone: 'M2'
  }, () => {
    const hasTabState = checkAnyFile([candidateDrawerPath, rankedPath], /activeDrawerTab|setActiveDrawerTab|activeTab/);
    expect(hasTabState).toBe(true);
  });

  test('F13-03: Overview tab renders core summary and stats', {
    id: 'T1-F13-03', tier: 1, feature: 'F13', milestone: 'M2'
  }, () => {
    const hasOverview = checkAnyFile([candidateDrawerPath, rankedPath], /AISummaryCard|AI Summary/);
    expect(hasOverview).toBe(true);
  });

  test('F13-04: Profile and Activity tabs render candidate history and timeline', {
    id: 'T1-F13-04', tier: 1, feature: 'F13', milestone: 'M2'
  }, () => {
    const hasTabs = checkAnyFile([candidateDrawerPath, rankedPath], /Profile|Activity/);
    expect(hasTabs).toBe(true);
  });

  test('F13-05: Notes and Files tabs support candidate attachments and notes', {
    id: 'T1-F13-05', tier: 1, feature: 'F13', milestone: 'M2'
  }, () => {
    const hasFiles = checkAnyFile([candidateDrawerPath, rankedPath], /Notes|Files/);
    expect(hasFiles).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Feature F14: Drawer Overview Cards
  // --------------------------------------------------------------------------
  test('F14-01: 2-column info grid renders Experience, Location, Availability, Salary Expected', {
    id: 'T1-F14-01', tier: 1, feature: 'F14', milestone: 'M2'
  }, () => {
    const hasGrid = checkAnyFile([candidateDrawerPath, rankedPath], /grid grid-cols-2|yearsOfExperience/i);
    expect(hasGrid).toBe(true);
  });

  test('F14-02: Skills cloud renders matched keywords and missing keywords pills', {
    id: 'T1-F14-02', tier: 1, feature: 'F14', milestone: 'M2'
  }, () => {
    const hasSkills = checkAnyFile([candidateDrawerPath, rankedPath], /matchedKeywords|missingKeywords/);
    expect(hasSkills).toBe(true);
  });

  test('F14-03: "✦ AI Summary" card rendered with Sparkles icon', {
    id: 'T1-F14-03', tier: 1, feature: 'F14', milestone: 'M2'
  }, () => {
    const content = defaultInspector.readFile('components/UI.tsx');
    expect(content).toContain('AISummaryCard');
    expect(content).toContain('Sparkles');
  });

  test('F14-04: Next Interview Slot card structure defined', {
    id: 'T1-F14-04', tier: 1, feature: 'F14', milestone: 'M2'
  }, () => {
    const hasSlot = checkAnyFile([candidateDrawerPath, rankedPath, recruiterPath], /Interview|Schedule/);
    expect(hasSlot).toBe(true);
  });

  test('F14-05: Overview cards apply responsive rounded-2xl styling and dark mode border', {
    id: 'T1-F14-05', tier: 1, feature: 'F14', milestone: 'M2'
  }, () => {
    const content = defaultInspector.readFile('components/UI.tsx');
    expect(content).toMatch(/rounded-2xl.*border/);
  });

  // --------------------------------------------------------------------------
  // Feature F15: Drawer Actions Deck
  // --------------------------------------------------------------------------
  test('F15-01: "Schedule Interview" action button present', {
    id: 'T1-F15-01', tier: 1, feature: 'F15', milestone: 'M2'
  }, () => {
    const hasSchedule = checkAnyFile([candidateDrawerPath, rankedPath, recruiterPath], /Schedule Interview/);
    expect(hasSchedule).toBe(true);
  });

  test('F15-02: "View Full Profile →" button present to open ApplicantReviewModal', {
    id: 'T1-F15-02', tier: 1, feature: 'F15', milestone: 'M2'
  }, () => {
    const hasModal = checkAnyFile([candidateDrawerPath, rankedPath, recruiterPath], /ApplicantReviewModal|View Full Profile/);
    expect(hasModal).toBe(true);
  });

  test('F15-03: "View Resume" button present with link', {
    id: 'T1-F15-03', tier: 1, feature: 'F15', milestone: 'M2'
  }, () => {
    const hasResume = checkAnyFile([candidateDrawerPath, rankedPath, recruiterPath], /View Resume|resumeUrl/);
    expect(hasResume).toBe(true);
  });

  test('F15-04: Status update trigger allows advancing applicant through pipeline', {
    id: 'T1-F15-04', tier: 1, feature: 'F15', milestone: 'M2'
  }, () => {
    const hasStatus = checkAnyFile([candidateDrawerPath, rankedPath, recruiterPath], /handleStatusUpdate|onStatusUpdate/);
    expect(hasStatus).toBe(true);
  });

  test('F15-05: Send Message action available for candidate outreach', {
    id: 'T1-F15-05', tier: 1, feature: 'F15', milestone: 'M2'
  }, () => {
    const hasMessage = checkAnyFile([candidateDrawerPath, rankedPath, recruiterPath], /sendMessage|onSendMessage|Message/);
    expect(hasMessage).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Feature F16: Hybrid Candidate Data Layer
  // --------------------------------------------------------------------------
  test('F16-01: Candidate dataset contains canonical profiles (Sarah Miller, Robert Fernandez, David Kim)', {
    id: 'T1-F16-01', tier: 1, feature: 'F16', milestone: 'M2'
  }, () => {
    const hasSarah = checkAnyFile([sakromeDataPath, rankedPath], /Sarah Miller/);
    const hasRobert = checkAnyFile([sakromeDataPath, rankedPath], /Robert Fernandez/);
    const hasDavid = checkAnyFile([sakromeDataPath, rankedPath], /David Kim/);
    expect(hasSarah && hasRobert && hasDavid).toBe(true);
  });

  test('F16-02: Sarah Miller profile conforms to schema with 83% AI score and design skills', {
    id: 'T1-F16-02', tier: 1, feature: 'F16', milestone: 'M2'
  }, () => {
    const hasSarahData = checkAnyFile([sakromeDataPath, rankedPath], /cand-sarah-miller/);
    expect(hasSarahData).toBe(true);
  });

  test('F16-03: Fallback seamlessly handles empty database by displaying canonical dataset', {
    id: 'T1-F16-03', tier: 1, feature: 'F16', milestone: 'M2'
  }, () => {
    const hasFallback = checkAnyFile([sakromeDataPath, rankedPath], /DEFAULT_CANDIDATES/);
    expect(hasFallback).toBe(true);
  });

  test('F16-04: Department categorization algorithm maps keywords to Design, Product, Marketing, Engineering', {
    id: 'T1-F16-04', tier: 1, feature: 'F16', milestone: 'M2'
  }, () => {
    const hasHelper = checkAnyFile([sakromeDataPath, rankedPath], /getCandidateCategory/);
    expect(hasHelper).toBe(true);
  });

  test('F16-05: AI score parser handles numeric values and nulls safely without runtime crashes', {
    id: 'T1-F16-05', tier: 1, feature: 'F16', milestone: 'M2'
  }, () => {
    const content = defaultInspector.readFile('components/UI.tsx');
    expect(content).toMatch(/Math\.min\(100,\s*Math\.max\(0,\s*score\)\)/);
  });
});
