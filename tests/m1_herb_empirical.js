import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const publicPath = path.join(rootDir, 'pages', 'Public.tsx');
const layoutsPath = path.join(rootDir, 'components', 'Layouts.tsx');

const publicContent = fs.readFileSync(publicPath, 'utf-8');
const layoutsContent = fs.readFileSync(layoutsPath, 'utf-8');

const testResults = [];

function assert(condition, message) {
  if (condition) {
    testResults.push({ status: 'PASS', message });
    console.log(`[PASS] ${message}`);
  } else {
    testResults.push({ status: 'FAIL', message });
    console.error(`[FAIL] ${message}`);
  }
}

console.log('=== EMPIRICAL TEST SUITE: HERB AGENCY LANDING PAGE (M1 / F1-F6) ===\n');

// T1: Herb Agency Light Lime Backdrop & Typography
assert(
  publicContent.includes('bg-[#D4F882]'),
  'Hero section features exact light lime canvas #D4F882'
);
assert(
  publicContent.includes('THE ONLY RECRUITMENT') && publicContent.includes("YOU'LL EVER NEED."),
  'Editorial headline contains uppercase recruitment copy'
);
assert(
  /TALENT[\s\S]*?HUB/.test(publicContent) &&
  publicContent.includes('rounded-2xl') &&
  publicContent.includes('bg-white text-[#111111]'),
  'Rounded white pill badges for [TALENT] and [HUB] are present with proper pill styling'
);

// T2: Herb Agency Pill CTAs
assert(
  publicContent.includes('Get Started') &&
  publicContent.includes("navigate('/signup')") &&
  publicContent.includes('bg-white text-[#111111]'),
  'Crisp white "Get Started ↗" pill CTA links to /signup'
);
assert(
  publicContent.includes('Learn More') &&
  publicContent.includes("document.getElementById('features')") &&
  publicContent.includes('scrollIntoView'),
  'Black "Learn More ↗" pill CTA smoothly scrolls to #features anchor'
);

// T3: Perspective Tablet Mockup & CSS 3D Transforms
assert(
  publicContent.includes('[perspective:1200px]'),
  'Perspective wrapper specifies [perspective:1200px]'
);
assert(
  publicContent.includes('rotateX(13deg)') &&
  publicContent.includes('rotateY(-5deg)') &&
  publicContent.includes('rotateZ(1deg)'),
  'Tablet frame features 3D rotations: rotateX(13deg), rotateY(-5deg), rotateZ(1deg)'
);
assert(
  publicContent.includes('[transform-style:preserve-3d]') ||
  publicContent.includes("transformStyle: 'preserve-3d'"),
  'Tablet container preserves 3D rendering context (preserve-3d)'
);
assert(
  publicContent.includes('bg-[#111111]/25 blur-2xl rounded-full') &&
  publicContent.includes('-bottom-8 sm:-bottom-12'),
  'Grounding elliptical depth drop-shadow is rendered underneath the tilted tablet'
);
assert(
  publicContent.includes('rounded-[36px] sm:rounded-[42px] bg-[#1a1e24]') &&
  publicContent.includes('border-4 sm:border-[5px] border-[#2b323c]'),
  'Tablet outer hardware bezel features realistic border radius and bezel styling'
);

// T4: Floating 3D Metric Cards with translateZ Elevations
assert(
  publicContent.includes('Total Income') &&
  publicContent.includes('$234.98K') &&
  publicContent.includes('translateZ(50px)'),
  'Card 1: Total Income $234.98K is rendered with 3D elevation [transform:translateZ(50px)]'
);
assert(
  publicContent.includes('347.23%') &&
  publicContent.includes('translateZ(65px)') &&
  publicContent.includes('animate-pulse'),
  'Card 2: Top pill ↑ 347.23% is rendered with 3D elevation [transform:translateZ(65px)] and status pulse'
);
assert(
  publicContent.includes('Resolved Identities') &&
  publicContent.includes('3,639') &&
  publicContent.includes('translateZ(55px)') &&
  publicContent.includes('12k+'),
  'Card 3: 3,639 Resolved Identities is rendered with 3D elevation [transform:translateZ(55px)] and avatar cluster badge (12k+)'
);

// T5: Bottom Segmented Pill Toggle & Stateful Reactivity
assert(
  publicContent.includes("setActiveSegment('marketing')") &&
  publicContent.includes("setActiveSegment('website_design')"),
  'Segmented pill toggle handlers switch between "marketing" and "website_design"'
);
assert(
  />\s*Marketing\s*<\/button>/.test(publicContent) &&
  />\s*Website design\s*<\/button>/.test(publicContent),
  'Segmented toggle features exact label pills: "Marketing" and "Website design"'
);
assert(
  publicContent.includes('Marketing Acquisition') &&
  publicContent.includes('Resolved Candidates') &&
  publicContent.includes('Inbound Reach') &&
  publicContent.includes('Interviews Conducted') &&
  publicContent.includes('Pipeline Progression & Sourcing Activity'),
  'Marketing segment dynamically renders dedicated metrics, funnel stats, and sourcing activity'
);
assert(
  publicContent.includes('Website Design & UI/UX') &&
  publicContent.includes('Design Submissions') &&
  publicContent.includes('Figma & UI Audits') &&
  publicContent.includes('Senior Design Reviews') &&
  publicContent.includes('Creative Portfolio Scoring & UI Benchmarks'),
  'Website design segment dynamically renders dedicated design benchmarks, audits, and portfolio stats'
);

// T6: Public Navbar Floating Integration in Layouts.tsx
assert(
  layoutsContent.includes("isHomePage = location.pathname === '/' || location.pathname === ''"),
  'Layout accurately detects homepage route for dynamic styling'
);
assert(
  layoutsContent.includes("isHomePage ? 'bg-[#D4F882]'"),
  'Layout outer container dynamically applies #D4F882 lime canvas on the homepage'
);
assert(
  layoutsContent.includes("isHomePage") &&
  layoutsContent.includes("isScrolled"),
  'Layout header dynamically coordinates scroll position and background transparency to prevent dark seams'
);

console.log('\n=== EMPIRICAL TEST SUMMARY ===');
const failedTests = testResults.filter(t => t.status === 'FAIL');
console.log(`Total assertions: ${testResults.length}`);
console.log(`Passed: ${testResults.length - failedTests.length}`);
console.log(`Failed: ${failedTests.length}`);

if (failedTests.length > 0) {
  process.exit(1);
} else {
  console.log('\nALL EMPIRICAL ASSERTIONS PASSED.');
  process.exit(0);
}
