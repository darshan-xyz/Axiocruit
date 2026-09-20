/**
 * Tier 1 Test Suite: Herb Agency Landing Page Fidelity (Features F1 - F6)
 * Authoritative Source: ORIGINAL_REQUEST.md (R1) & PROJECT.md (Features F1-F6)
 */

import { describe, test } from '../framework/runner.js';
import { expect } from '../framework/assert.js';
import { defaultInspector } from '../framework/dom_parser.js';

describe('Tier 1: Herb Agency Landing Page Fidelity (F1 - F6)', () => {
  const publicPath = 'pages/Public.tsx';
  const layoutsPath = 'components/Layouts.tsx';

  // --------------------------------------------------------------------------
  // Feature F1: Herb Agency Lime Canvas
  // --------------------------------------------------------------------------
  test('F1-01: Hero canvas background color uses light lime #D4F882', {
    id: 'T1-F1-01', tier: 1, feature: 'F1', milestone: 'M1'
  }, () => {
    const hasLimeBg = defaultInspector.hasPattern(publicPath, /bg-\[#D4F882\]/);
    expect(hasLimeBg).toBe(true);
  });

  test('F1-02: Editorial headline typography is uppercase font-black with tracking-tight', {
    id: 'T1-F1-02', tier: 1, feature: 'F1', milestone: 'M1'
  }, () => {
    const headlineLines = defaultInspector.findMatchingLines(publicPath, /THE ONLY (?:RECRUITMENT|CANNABIS)/);
    expect(headlineLines.length).toBeGreaterThan(0);
    const content = defaultInspector.readFile(publicPath);
    expect(content).toMatch(/font-black tracking-tight/);
    expect(content).toMatch(/uppercase/);
  });

  test('F1-03: Rounded white pill badge [TALENT / MARKETING] rendered with border', {
    id: 'T1-F1-03', tier: 1, feature: 'F1', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(publicPath);
    const hasPill = content.includes('TALENT') || content.includes('MARKETING');
    expect(hasPill).toBe(true);
    expect(content).toMatch(/bg-white text-\[#111111\][^>]*rounded-2xl|rounded-3xl/);
  });

  test('F1-04: Rounded white pill badge [HUB] rendered with border', {
    id: 'T1-F1-04', tier: 1, feature: 'F1', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(publicPath);
    expect(content).toContain('HUB');
    expect(content).toMatch(/bg-white text-\[#111111\][^>]*rounded-2xl|rounded-3xl/);
  });

  test('F1-05: Headline verbatim text matches "THE ONLY ... HUB YOU\'LL EVER NEED"', {
    id: 'T1-F1-05', tier: 1, feature: 'F1', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(publicPath);
    expect(content).toMatch(/THE ONLY (?:RECRUITMENT|CANNABIS)/);
    expect(content).toContain("HUB");
    expect(content).toContain("YOU'LL EVER NEED");
  });

  // --------------------------------------------------------------------------
  // Feature F2: Herb Agency Pill CTAs
  // --------------------------------------------------------------------------
  test('F2-01: White pill CTA "Get Started ↗" rendered with crisp rounded-full geometry', {
    id: 'T1-F2-01', tier: 1, feature: 'F2', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(publicPath);
    expect(content).toMatch(/bg-white text-\[#111111\][^>]*rounded-full/);
    expect(content).toContain('Get Started');
  });

  test('F2-02: "Get Started ↗" navigates to /signup', {
    id: 'T1-F2-02', tier: 1, feature: 'F2', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(publicPath);
    expect(content).toMatch(/navigate\(['"`]\/signup['"`]\)/);
  });

  test('F2-03: Black pill CTA "Learn More ↗" rendered with #111111 styling and rounded-full', {
    id: 'T1-F2-03', tier: 1, feature: 'F2', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(publicPath);
    expect(content).toMatch(/bg-\[#111111\] text-white[^>]*rounded-full/);
    expect(content).toContain('Learn More');
  });

  test('F2-04: "Learn More ↗" scrolls smoothly to #features section', {
    id: 'T1-F2-04', tier: 1, feature: 'F2', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(publicPath);
    expect(content).toMatch(/getElementById\(['"`]features['"`]\)/);
    expect(content).toMatch(/scrollIntoView\(\s*{\s*behavior:\s*['"`]smooth['"`]/);
  });

  test('F2-05: Pill CTAs include ArrowUpRight icon with hover translation animation', {
    id: 'T1-F2-05', tier: 1, feature: 'F2', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(publicPath);
    expect(content).toContain('ArrowUpRight');
    expect(content).toMatch(/group-hover:translate-x-0.5 group-hover:-translate-y-0.5/);
  });

  // --------------------------------------------------------------------------
  // Feature F3: Perspective Tablet Mockup
  // --------------------------------------------------------------------------
  test('F3-01: 3D perspective viewport container rendered with [perspective:]', {
    id: 'T1-F3-01', tier: 1, feature: 'F3', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(publicPath);
    expect(content).toMatch(/\[perspective:(?:1200|1400)px\]/);
  });

  test('F3-02: Tablet mockup container features perspective hardware depth and framing', {
    id: 'T1-F3-02', tier: 1, feature: 'F3', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(publicPath);
    expect(content).toMatch(/max-w-5xl.*perspective|max-w-4xl.*perspective/);
  });

  test('F3-03: Tablet container preserves 3D rendering context or depth shadow', {
    id: 'T1-F3-03', tier: 1, feature: 'F3', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(publicPath);
    expect(content).toMatch(/shadow-2xl/);
  });

  test('F3-04: Realistic depth shadow rendered underneath tablet', {
    id: 'T1-F3-04', tier: 1, feature: 'F3', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(publicPath);
    expect(content).toMatch(/bg-\[#111111\]\/25 blur-(?:2|3)xl rounded-full/);
  });

  test('F3-05: Tablet hardware bezel rendered with rounded corners and camera dot', {
    id: 'T1-F3-05', tier: 1, feature: 'F3', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(publicPath);
    expect(content).toMatch(/rounded-\[(?:36|40|48)px\]/);
    expect(content).toMatch(/rounded-full bg-slate-(?:700|800)/); // Camera dot
  });

  // --------------------------------------------------------------------------
  // Feature F4: Floating 3D Metric Cards
  // --------------------------------------------------------------------------
  test('F4-01: Card 1 renders verbatim label "Total Income" and value "$234.98K"', {
    id: 'T1-F4-01', tier: 1, feature: 'F4', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(publicPath);
    expect(content).toContain('Total Income');
    expect(content).toContain('$234.98K');
  });

  test('F4-02: Card 1 contains positive delta pill ↑ 234.45%', {
    id: 'T1-F4-02', tier: 1, feature: 'F4', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(publicPath);
    expect(content).toMatch(/↑.*234\.45%/);
  });

  test('F4-03: Card 2 (Top Pill) renders verbatim capsule "↑ 347.23%" with emerald indicator', {
    id: 'T1-F4-03', tier: 1, feature: 'F4', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(publicPath);
    expect(content).toContain('347.23%');
    expect(content).toMatch(/bg-emerald-100 text-emerald-700/);
  });

  test('F4-04: Card 3 renders verbatim label "Resolved Identities" and value "3,639"', {
    id: 'T1-F4-04', tier: 1, feature: 'F4', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(publicPath);
    expect(content).toContain('Resolved Identities');
    expect(content).toContain('3,639');
  });

  test('F4-05: Card 3 renders stacked avatar cluster with "12k+" badge chip', {
    id: 'T1-F4-05', tier: 1, feature: 'F4', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(publicPath);
    expect(content).toContain('12k+');
    expect(content).toMatch(/-space-x-/); // Avatar stack
  });

  test('F4-06: Metric cards apply floating elevations over tablet edges', {
    id: 'T1-F4-06', tier: 1, feature: 'F4', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(publicPath);
    expect(content).toMatch(/absolute -left-.*Total Income/s);
    expect(content).toMatch(/absolute -right-.*Resolved Identities/s);
  });

  // --------------------------------------------------------------------------
  // Feature F5: Segmented Pill Toggle
  // --------------------------------------------------------------------------
  test('F5-01: Segmented container renders rounded pill shape with border', {
    id: 'T1-F5-01', tier: 1, feature: 'F5', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(publicPath);
    expect(content).toMatch(/p-1\.5 rounded-full border/);
  });

  test('F5-02: Segment option 1 renders verbatim label "Marketing"', {
    id: 'T1-F5-02', tier: 1, feature: 'F5', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(publicPath);
    expect(content).toContain('Marketing');
    expect(content).toMatch(/onClick=\{.*setActiveSegment\(['"`]marketing['"`]\)/);
  });

  test('F5-03: Segment option 2 renders verbatim label "Website design"', {
    id: 'T1-F5-03', tier: 1, feature: 'F5', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(publicPath);
    expect(content).toContain('Website design');
    expect(content).toMatch(/onClick=\{.*setActiveSegment\(['"`]website_design['"`]\)/);
  });

  test('F5-04: Active segment applies distinct styling toggle', {
    id: 'T1-F5-04', tier: 1, feature: 'F5', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(publicPath);
    expect(content).toMatch(/activeSegment === ['"`]marketing['"`]/);
    expect(content).toMatch(/activeSegment === ['"`]website_design['"`]/);
  });

  test('F5-05: Interactive state switching updates segment state between marketing and website_design', {
    id: 'T1-F5-05', tier: 1, feature: 'F5', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(publicPath);
    expect(content).toContain("setActiveSegment('marketing')");
    expect(content).toContain("setActiveSegment('website_design')");
  });

  // --------------------------------------------------------------------------
  // Feature F6: Public Navbar Integration
  // --------------------------------------------------------------------------
  test('F6-01: Public floating island header rendered over hero canvas', {
    id: 'T1-F6-01', tier: 1, feature: 'F6', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(layoutsPath);
    expect(content).toMatch(/<header className=\{`sticky top-0 z-40/);
    expect(content).toMatch(/max-w-6xl mx-auto rounded-full/);
  });

  test('F6-02: Header seamlessly adopts #D4F882 backdrop without dark seam on homepage', {
    id: 'T1-F6-02', tier: 1, feature: 'F6', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(layoutsPath);
    expect(content).toMatch(/isHomePage[^?]*\?[^:]*bg-\[#D4F882\]/);
  });

  test('F6-03: Navbar contains brand logo "PROCRUIT" linking to root', {
    id: 'T1-F6-03', tier: 1, feature: 'F6', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(layoutsPath);
    expect(content).toContain('BrandLogo');
    expect(content.includes('AXIOCRUIT') || content.includes('PROCRUIT')).toBe(true);
    expect(content).toMatch(/navigate\(['"`]\/['"`]\)/);
  });

  test('F6-04: Navbar embeds core navigation links', {
    id: 'T1-F6-04', tier: 1, feature: 'F6', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(layoutsPath);
    expect(content).toContain('Platform');
    expect(content).toContain('AI Proctoring');
    expect(content).toContain('ATS Engine');
    expect(content).toContain('Pricing');
  });

  test('F6-05: Navbar provides ThemeToggle and CTAs for Sign In and Get Started', {
    id: 'T1-F6-05', tier: 1, feature: 'F6', milestone: 'M1'
  }, () => {
    const content = defaultInspector.readFile(layoutsPath);
    expect(content).toContain('ThemeToggle');
    expect(content).toContain('Sign In');
    expect(content).toContain('Get Started');
  });
});
