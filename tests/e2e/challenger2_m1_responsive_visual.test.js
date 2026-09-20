/**
 * Challenger 2 Empirical Test Suite: Milestone 1 Responsive & Visual Regression
 * Validates Features F1-F6, Viewport Breakpoints, CTAs, Theme Toggling, and 3D Transforms.
 */

import { expect } from './framework/assert.js';
import { SourceInspector } from './framework/dom_parser.js';

const inspector = new SourceInspector('d:/projects/Procruit-main');

console.log('=== Starting Challenger 2: Milestone 1 Verification ===\n');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    failCount++;
  }
}

// --------------------------------------------------------------------------
// Suite 1: Responsive Breakpoints & 3D Transform Behavior
// --------------------------------------------------------------------------
console.log('--- Suite 1: Viewport Scaling & 3D Transforms ---');

test('Public.tsx applies overflow-x-hidden to prevent global horizontal scrollbars', () => {
  const content = inspector.readFile('pages/Public.tsx');
  expect(content).toContain('overflow-x-hidden');
  expect(content).toContain('min-h-[100dvh]');
});

test('Hero section uses overflow-hidden to constrain transformed mockups', () => {
  const content = inspector.readFile('pages/Public.tsx');
  expect(content).toContain('overflow-hidden border-b border-[#111111]/10');
});

test('Tablet mockup disables 3D rotation on mobile (<640px) using sm: prefix', () => {
  const content = inspector.readFile('pages/Public.tsx');
  // Must use sm:[transform:rotateX(13deg)...] so mobile is flat 2D
  expect(content).toMatch(/sm:\[transform:rotateX\(13deg\)_rotateY\(-5deg\)_rotateZ\(1deg\)\]/);
  expect(content).toContain('[transform-style:preserve-3d]');
});

test('Floating metric card 1 (Left: Total Income) is hidden on mobile (<640px)', () => {
  const content = inspector.readFile('pages/Public.tsx');
  expect(content).toMatch(/hidden sm:block \[transform:translateZ\(50px\)\]/);
  expect(content).toContain('Total Income');
  expect(content).toContain('$234.98K');
});

test('Floating metric card 2 (Top Pill: ↑ 347.23%) is hidden on mobile & sm (<768px)', () => {
  const content = inspector.readFile('pages/Public.tsx');
  expect(content).toMatch(/hidden md:block \[transform:translateZ\(65px\)\]/);
  expect(content).toContain('347.23%');
});

test('Floating metric card 3 (Right: Resolved Identities) is hidden on mobile (<640px)', () => {
  const content = inspector.readFile('pages/Public.tsx');
  expect(content).toMatch(/hidden sm:block \[transform:translateZ\(55px\)\]/);
  expect(content).toContain('Resolved Identities');
  expect(content).toContain('3,639');
});

test('Hero headline scales responsively across mobile, sm, md, lg', () => {
  const content = inspector.readFile('pages/Public.tsx');
  expect(content).toContain('text-4xl sm:text-6xl md:text-7xl lg:text-[80px]');
});

// --------------------------------------------------------------------------
// Suite 2: Navigation CTAs & Route Targets
// --------------------------------------------------------------------------
console.log('\n--- Suite 2: Navigation CTAs & Link Destinations ---');

test('Hero primary CTA navigates directly to /signup', () => {
  const content = inspector.readFile('pages/Public.tsx');
  expect(content).toContain("navigate('/signup')");
  expect(content).toContain('Get Started');
});

test('Hero secondary CTA smoothly scrolls to #features without hash conflict', () => {
  const content = inspector.readFile('pages/Public.tsx');
  expect(content).toContain("document.getElementById('features')");
  expect(content).toContain("scrollIntoView({ behavior: 'smooth' })");
  expect(content).toContain('Learn More');
});

test('Target section #features exists in Public.tsx DOM', () => {
  const content = inspector.readFile('pages/Public.tsx');
  expect(content).toContain('<section id="features"');
});

test('Navbar Get Started CTA navigates to /signup', () => {
  const content = inspector.readFile('components/Layouts.tsx');
  expect(content).toContain("navigate('/signup')");
});

test('Navbar Sign In CTA navigates to /login', () => {
  const content = inspector.readFile('components/Layouts.tsx');
  expect(content).toContain("navigate('/login')");
});

// --------------------------------------------------------------------------
// Suite 3: Theme Switching Behavior (Route / vs Protected Routes)
// --------------------------------------------------------------------------
console.log('\n--- Suite 3: Theme Switching Behavior ---');

test('ThemeContext provides isDark, toggleTheme, and persists to localStorage', () => {
  const content = inspector.readFile('components/ThemeContext.tsx');
  expect(content).toContain("localStorage.getItem('theme')");
  expect(content).toContain("localStorage.setItem('theme'");
  expect(content).toContain("root.classList.add('dark')");
  expect(content).toContain("root.classList.remove('dark')");
});

test('PublicLayout seamlessly matches Hero #D4F882 on route / when un-scrolled', () => {
  const content = inspector.readFile('components/Layouts.tsx');
  expect(content).toContain("isHomePage ? 'bg-[#D4F882]'");
  expect(content).toContain("isHomePage && !isScrolled");
});

test('PublicLayout header applies backdrop-blur when scrolled', () => {
  const content = inspector.readFile('components/Layouts.tsx');
  expect(content).toMatch(/isScrolled\s+\?\s*\(isDark\s*\?\s*'bg-\[#0A0E1A\]\/90 backdrop-blur-md/);
});

test('DashboardLayout provides full dark / light theme switching for protected routes', () => {
  const content = inspector.readFile('components/Layouts.tsx');
  expect(content).toContain("isDark ? 'bg-[#0A0E1A] text-slate-100' : 'bg-[#EBF1F6] text-slate-900'");
  expect(content).toContain("dark:bg-[#111726]");
});

// --------------------------------------------------------------------------
// Suite 4: Herb Agency Spec Compliance & Color Tokens
// --------------------------------------------------------------------------
console.log('\n--- Suite 4: Herb Agency Color Tokens & Interactive Toggle ---');

test('Public.tsx contains exact Herb Agency #D4F882 color token', () => {
  const tokens = inspector.extractColorTokens('pages/Public.tsx');
  expect(tokens).toContain('#D4F882');
});

test('Segmented pill toggle supports verbatim Marketing and Website design states', () => {
  const content = inspector.readFile('pages/Public.tsx');
  expect(content).toContain("activeSegment === 'marketing'");
  expect(content).toContain("activeSegment === 'website_design'");
  expect(content).toContain("setActiveSegment('marketing')");
  expect(content).toContain("setActiveSegment('website_design')");
});

test('Segmented pill toggle dynamically renders distinct datasets for both tabs', () => {
  const content = inspector.readFile('pages/Public.tsx');
  // Marketing dataset
  expect(content).toContain('Marketing Acquisition');
  expect(content).toContain('Resolved Candidates');
  expect(content).toContain('Inbound Reach');
  // Website design dataset
  expect(content).toContain('Website Design & UI/UX');
  expect(content).toContain('Design Submissions');
  expect(content).toContain('Figma & UI Audits');
});

console.log(`\n=== Verification Summary: ${passCount} Passed, ${failCount} Failed ===`);
if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
