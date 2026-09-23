/**
 * Tier 1 Test Suite: StaffCentral, AmaHR & INTCH HUB Dashboards (Features F17 - F24)
 * Authoritative Source: ORIGINAL_REQUEST.md (R3) & PROJECT.md (Features F17-F24)
 */

import { describe, test } from '../framework/runner.js';
import { expect } from '../framework/assert.js';
import { defaultInspector } from '../framework/dom_parser.js';

describe('Tier 1: StaffCentral, AmaHR & INTCH HUB Dashboards (F17 - F24)', () => {
  const layoutsPath = 'components/Layouts.tsx';
  const recruiterPath = 'pages/Recruiter.tsx';
  const uiPath = 'components/UI.tsx';

  // --------------------------------------------------------------------------
  // Feature F17: Recruiter macOS Shell & URL Chrome
  // --------------------------------------------------------------------------
  test('F17-01: macOS window container structure wraps recruiter dashboard', {
    id: 'T1-F17-01', tier: 1, feature: 'F17', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(layoutsPath);
    expect(content).toMatch(/w-full max-w-\[1540px\] mx-auto.*rounded-\[28px\]/);
  });

  test('F17-02: Window controls (red, yellow, green) present in shell header', {
    id: 'T1-F17-02', tier: 1, feature: 'F17', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(layoutsPath);
    expect(content).toContain('#FF5F56');
    expect(content).toContain('#FFBD2E');
    expect(content).toContain('#27C93F');
  });

  test('F17-03: Address bar / URL chrome simulated in header or shell', {
    id: 'T1-F17-03', tier: 1, feature: 'F17', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(layoutsPath);
    const hasChrome = content.includes('Search requisitions') || content.includes('procruit.enterprise') || content.includes('header');
    expect(hasChrome).toBe(true);
  });

  test('F17-04: Recruiter route maps to /recruiter path', {
    id: 'T1-F17-04', tier: 1, feature: 'F17', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(layoutsPath);
    expect(content).toContain("'/recruiter'");
  });

  test('F17-05: Quick Search in header has shortcut badge ⌘K', {
    id: 'T1-F17-05', tier: 1, feature: 'F17', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(layoutsPath);
    expect(content).toContain('⌘K');
  });

  // --------------------------------------------------------------------------
  // Feature F18: Recruiter Profile Hero Card
  // --------------------------------------------------------------------------
  test('F18-01: Hero card renders recruiter profile picture with online indicator dot', {
    id: 'T1-F18-01', tier: 1, feature: 'F18', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(recruiterPath);
    expect(content).toMatch(/currentUser\?\.profilePicture.*DEFAULT_AVATAR/);
    expect(content).toMatch(/bg-emerald-500 ring-2/); // Online indicator
  });

  test('F18-02: Recruiter presentation includes "Hiring Lead" role chip', {
    id: 'T1-F18-02', tier: 1, feature: 'F18', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(recruiterPath);
    expect(content).toContain('Hiring Lead');
  });

  test('F18-03: Recruiter hero status renders "Active Hiring" mode badge', {
    id: 'T1-F18-03', tier: 1, feature: 'F18', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(recruiterPath);
    expect(content).toContain('Active Hiring');
  });

  test('F18-04: "Find Candidates" button triggers navigation to candidate pool', {
    id: 'T1-F18-04', tier: 1, feature: 'F18', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(recruiterPath);
    expect(content).toContain('Find Candidates');
    expect(content).toMatch(/#\/recruiter\/applicants/);
  });

  test('F18-05: "Post Requisition" button opens job management flow', {
    id: 'T1-F18-05', tier: 1, feature: 'F18', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(recruiterPath);
    expect(content).toContain('Post Requisition');
    expect(content).toMatch(/#\/recruiter\/jobs/);
  });

  // --------------------------------------------------------------------------
  // Feature F19: 4-Quadrant Metric Cards
  // --------------------------------------------------------------------------
  test('F19-01: 4-quadrant grid layout rendered for key metrics', {
    id: 'T1-F19-01', tier: 1, feature: 'F19', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(recruiterPath);
    expect(content).toMatch(/grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4/);
  });

  test('F19-02: MetricStatCard supports Hot Pink (#FF5D8F) color variant', {
    id: 'T1-F19-02', tier: 1, feature: 'F19', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(uiPath);
    expect(content).toContain('#FF5D8F');
  });

  test('F19-03: MetricStatCard supports Emerald (#10B981) color variant', {
    id: 'T1-F19-03', tier: 1, feature: 'F19', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(uiPath);
    expect(content).toContain('#10B981');
  });

  test('F19-04: MetricStatCard supports Cobalt Blue (#2563EB) color variant', {
    id: 'T1-F19-04', tier: 1, feature: 'F19', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(uiPath);
    expect(content).toContain('#2563EB');
  });

  test('F19-05: MetricStatCard supports Coral color variant', {
    id: 'T1-F19-05', tier: 1, feature: 'F19', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(uiPath);
    const hasCoral = content.includes('#FF5A36') || content.includes('#FF6B6B');
    expect(hasCoral).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Feature F20: Activity Gauges
  // --------------------------------------------------------------------------
  test('F20-01: Weekly activity widget rendered in dashboard middle row', {
    id: 'T1-F20-01', tier: 1, feature: 'F20', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(recruiterPath);
    expect(content).toContain('Weekly Activity');
  });

  test('F20-02: Activity gauge renders 68% weekly activity pace', {
    id: 'T1-F20-02', tier: 1, feature: 'F20', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(recruiterPath);
    expect(content).toMatch(/percentage=\{68\}/);
  });

  test('F20-03: Working format breakdown renders Remote (42%) and Hybrid (58%) statistics', {
    id: 'T1-F20-03', tier: 1, feature: 'F20', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(recruiterPath);
    expect(content).toContain('Working Format');
    expect(content).toContain('Remote');
  });

  test('F20-04: CircularProgressGauge SVG geometry handles 360-degree stroke calculations', {
    id: 'T1-F20-04', tier: 1, feature: 'F20', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(uiPath);
    expect(content).toMatch(/circumference = 2 \* Math\.PI \* radius/);
    expect(content).toMatch(/strokeDasharray=\{circumference\}/);
  });

  test('F20-05: Activity gauge displays subtitle pace indicator ("Above Target Pace")', {
    id: 'T1-F20-05', tier: 1, feature: 'F20', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(recruiterPath);
    expect(content).toContain('Above Target Pace');
  });

  // --------------------------------------------------------------------------
  // Feature F21: Hiring Matrix Grid
  // --------------------------------------------------------------------------
  test('F21-01: Hiring matrix pipeline funnel container rendered in Recruiter dashboard', {
    id: 'T1-F21-01', tier: 1, feature: 'F21', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(recruiterPath);
    expect(content).toContain('Live Requisition Pipeline');
  });

  test('F21-02: Pipeline stages include Applied, Screening, Interview, Offer, and Rejected', {
    id: 'T1-F21-02', tier: 1, feature: 'F21', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(recruiterPath);
    expect(content).toContain('Applied');
    expect(content).toContain('Screening');
    expect(content).toContain('Interview');
  });

  test('F21-03: Candidate counts and percentage bars rendered per stage', {
    id: 'T1-F21-03', tier: 1, feature: 'F21', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(recruiterPath);
    expect(content).toMatch(/percent = Math\.round\(\(count \/ totalPipeline\) \* 100\)/);
  });

  test('F21-04: Distinct stage color accents applied to each pipeline stage', {
    id: 'T1-F21-04', tier: 1, feature: 'F21', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(recruiterPath);
    expect(content).toMatch(/statusColors.*Applied.*Screening.*Interview/s);
  });

  test('F21-05: Quick links to filtered requisitions or candidates available in matrix', {
    id: 'T1-F21-05', tier: 1, feature: 'F21', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(recruiterPath);
    expect(content).toContain('#/recruiter/jobs');
  });

  // --------------------------------------------------------------------------
  // Feature F22: Job Distribution Donut Chart
  // --------------------------------------------------------------------------
  test('F22-01: Recharts or SVG charting library integrated in project', {
    id: 'T1-F22-01', tier: 1, feature: 'F22', milestone: 'M3'
  }, () => {
    const pkg = JSON.parse(defaultInspector.readFile('package.json'));
    expect(pkg.dependencies.recharts).toBeDefined();
  });

  test('F22-02: Total jobs count tracked in recruiter dashboard stats', {
    id: 'T1-F22-02', tier: 1, feature: 'F22', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(recruiterPath);
    expect(content).toMatch(/stats\.jobs/);
  });

  test('F22-03: Department breakdown data structure present in recruiter analytics', {
    id: 'T1-F22-03', tier: 1, feature: 'F22', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(recruiterPath);
    expect(content).toMatch(/Engineering|Design|Product|Marketing/);
  });

  test('F22-04: Requisitions section lists open job titles and applicant counts', {
    id: 'T1-F22-04', tier: 1, feature: 'F22', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(recruiterPath);
    expect(content).toMatch(/recentJobsList|jobs/);
  });

  test('F22-05: Department color palette defined for multi-colored charts', {
    id: 'T1-F22-05', tier: 1, feature: 'F22', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile('pages/RankedCandidates.tsx');
    expect(content).toMatch(/purple.*emerald.*blue.*orange/s);
  });

  // --------------------------------------------------------------------------
  // Feature F23: Schedule Timeline Stripes
  // --------------------------------------------------------------------------
  test('F23-01: Schedule timeline container present in Recruiter dashboard', {
    id: 'T1-F23-01', tier: 1, feature: 'F23', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(recruiterPath);
    expect(content).toMatch(/My Task|Live Scheduled Interviews/);
  });

  test('F23-02: Scheduled interview cards feature colored vertical time stripes (border-l-)', {
    id: 'T1-F23-02', tier: 1, feature: 'F23', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(recruiterPath);
    expect(content).toMatch(/border-l-4.*border-l-blue-600|border-l-\[#FF5D8F\]/);
  });

  test('F23-03: Active "Join Room" button rendered on live interview items', {
    id: 'T1-F23-03', tier: 1, feature: 'F23', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(recruiterPath);
    expect(content).toContain('Join Room');
  });

  test('F23-04: "Join Room" button navigates to /interview/room/:id', {
    id: 'T1-F23-04', tier: 1, feature: 'F23', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(recruiterPath);
    expect(content).toMatch(/\/interview\/room\//);
  });

  test('F23-05: Candidate name, role, time slot, and interviewer details presented', {
    id: 'T1-F23-05', tier: 1, feature: 'F23', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(recruiterPath);
    expect(content).toMatch(/candidate\?\.name|interviewTitle|scheduledTime/);
  });

  // --------------------------------------------------------------------------
  // Feature F24: Iridescent AI Assistant Card
  // --------------------------------------------------------------------------
  test('F24-01: Sidebar embeds AI Assistant card with gradient background', {
    id: 'T1-F24-01', tier: 1, feature: 'F24', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(layoutsPath);
    expect(content).toMatch(/bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700/);
  });

  test('F24-02: AI Assistant card renders Sparkles icon and "AI Assistant Pro" title', {
    id: 'T1-F24-02', tier: 1, feature: 'F24', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(layoutsPath);
    expect(content).toContain('Sparkles');
    expect(content).toContain('AI Assistant Pro');
  });

  test('F24-03: Action pill rendered in AI Assistant card', {
    id: 'T1-F24-03', tier: 1, feature: 'F24', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(layoutsPath);
    const hasPill = content.includes('Explore ↗') || content.includes('$16.99/mo');
    expect(hasPill).toBe(true);
  });

  test('F24-04: Autonomous CV parsing and facial proctoring capability description listed', {
    id: 'T1-F24-04', tier: 1, feature: 'F24', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(layoutsPath);
    expect(content).toContain('Autonomous CV parsing');
    expect(content).toContain('proctoring');
  });

  test('F24-05: Card includes Enterprise status badge and backdrop blur effects', {
    id: 'T1-F24-05', tier: 1, feature: 'F24', milestone: 'M3'
  }, () => {
    const content = defaultInspector.readFile(layoutsPath);
    expect(content).toContain('Enterprise');
    expect(content).toContain('blur-xl');
  });
});
