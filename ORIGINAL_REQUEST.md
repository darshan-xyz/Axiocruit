# Original User Request

## 2026-09-14T11:54:10Z

Execute a comprehensive Enterprise UI/UX renovation for Procruit across the Landing Page, Recruiter Hub, and Candidate/Interviewer portals to achieve exact pixel-level fidelity to the 5 attached reference designs (Herb Agency, Sakrome, INTCH HUB, AmaHR, StaffCentral) with zero regressions to existing backend APIs and microservices.

Working directory: d:/projects/Procruit-main
Integrity mode: development

## Requirements

### R1. Herb Agency Landing Page Fidelity (media_1789385406639.png)
Implement the public landing page with exact visual fidelity to the Herb Agency reference:
- Light lime backdrop (`#D4F882`) with uppercase typography and rounded white pill badges (`[HUB]`, `[TALENT]`).
- Crisp white `Get Started ↗` and black `Learn More ↗` pill CTAs.
- Perspective tablet mockup featuring floating 3D metric cards (`Total Income $234.98K`, `3,639 Resolved Identities`, `↑ 347.23%`).
- Bottom segmented pill toggle (`Marketing` / `Website design`).

### R2. Sakrome Candidate Portal & Inspector Drawer (media_1789384948280.png)
Implement the high-density candidate workflow matching the Sakrome design:
- Floating macOS card container with top pill navigation (`Home`, `Candidates` active in blue, `Jobs`, `Analytics`, `Menu ∨`).
- Category filtering pills (`All`, `Design`, `Engineering`, `Product`, `Marketing`).
- Candidate table with department badges (Design purple cube, Engineering orange code, Product green box, Marketing blue megaphone), stage pills (`Interview`, `Screening`, `Assessment`, `New`), dual-tone match score bar, and applied dates.
- Slide-over inspector drawer with circular match gauge (`83% Strong match`), sub-navigation tabs (`Overview`, `Profile`, `Activity`, `Notes`, `Files`), 2-column info grid, skills cloud, `✦ AI Summary` card, next interview slot, and action buttons (`Schedule Interview`, `View Full Profile →`).
- Table footer with pagination pills (`< 1 2 3 ... 46 >`).

### R3. StaffCentral, AmaHR & INTCH HUB Dashboards (media_1789384951050.png, media_1789384953561.png, media_1789384957547.png)
Implement the multi-theme recruiter and portal dashboard layout:
- Floating macOS application shell with window controls (red, yellow, green) and URL chrome.
- Recruiter profile hero card (Kevin Nunez / Russel Sims) with status indicators and action buttons.
- 4-quadrant colored metric stat cards (Hot Pink `#FF5D8F`, Emerald `#10B981`, Cobalt `#2563EB`, Coral `#FF5A36`).
- Activity gauges: semi-circular dashed activity arc (`68% Weekly activity`) and concentric working format rings (`60% Office`, `30% Hybrid`, `10% Remote`).
- Hiring matrix grid with colored candidate count blocks per stage (`New Applied`, `Screening`, `Interview`, `Test`, `Hired`).
- Multi-colored donut chart for job distribution (133 Total Jobs).
- Schedule timeline with colored vertical time stripes and "Join Room" actions.
- Iridescent gradient AI Assistant card (`$16.99/mo →`).

### R4. Architectural & Functional Integrity
Preserve 100% of all existing business logic:
- Maintain all REST API endpoints (`/jobs`, `/applications`, `/interviews`, `/auth`, etc.).
- Preserve WebRTC peer-to-peer video streaming, MediaPipe AI proctoring, and Monaco live coding IDE.
- Zero TypeScript errors (`npx tsc --noEmit`) and successful production build (`npm run build`).

## Acceptance Criteria

### Visual & Component Matching
- [ ] Landing page matches Herb Agency lime canvas, pill badges, and tablet mockup with floating 3D metric cards.
- [ ] Candidates view matches Sakrome high-density table, department icons, stage pills, dual-tone bars, and Sarah Miller slide-over drawer with circular gauge.
- [ ] Dashboard includes StaffCentral/AmaHR 4-quadrant colored cards, activity arc/rings, hiring matrix, and timeline schedule with colored stripes.
- [ ] Responsive layout across mobile, tablet, and desktop breakpoints, with full dark mode support.

### Verification & Stability
- [ ] `npx tsc --noEmit` exits with code 0.
- [ ] `npm run build` generates production bundle without build errors.
- [ ] Node backend (`http://localhost:5001/api/ready`) reports status `ready`.
- [ ] Vite frontend (`http://localhost:3000`) serves HTTP 200 without runtime console exceptions.
