/**
 * Challenger 2 Geometry & Viewport Stress Simulator
 * Mathematically verifies layout boundaries, clipping thresholds, and horizontal overflow across screen widths.
 */

function simulateHeroLayout(viewportWidth) {
  const sectionPadding = 16 * 2; // px-4 = 16px left + 16px right
  const maxContainerWidth = 1152; // max-w-6xl = 72rem = 1152px
  const maxTabletWidth = 896; // max-w-4xl = 56rem = 896px
  
  const availableContainerWidth = Math.min(viewportWidth - sectionPadding, maxContainerWidth);
  const tabletWidth = Math.min(availableContainerWidth, maxTabletWidth);
  const tabletMargin = (availableContainerWidth - tabletWidth) / 2;

  const isMobile = viewportWidth < 640;
  const isTabletSm = viewportWidth >= 640 && viewportWidth < 768;
  const isMdOrAbove = viewportWidth >= 768;

  // Left card offset
  let leftCardOffset = 0;
  let leftCardVisible = false;
  let leftCardWidth = 200;

  if (viewportWidth >= 768) {
    leftCardOffset = 48; // -left-12 = 3rem = 48px
    leftCardVisible = true;
  } else if (viewportWidth >= 640) {
    leftCardOffset = 32; // -left-8 = 2rem = 32px
    leftCardVisible = true;
  }

  // Right card offset
  let rightCardOffset = 0;
  let rightCardVisible = false;
  let rightCardWidth = 215;

  if (viewportWidth >= 768) {
    rightCardOffset = 48; // -right-12 = 48px
    rightCardVisible = true;
  } else if (viewportWidth >= 640) {
    rightCardOffset = 32; // -right-8 = 32px
    rightCardVisible = true;
  }

  // Clearance from section edge (negative means clipped by overflow-hidden)
  const leftClearance = leftCardVisible ? (tabletMargin - leftCardOffset) : 0;
  const rightClearance = rightCardVisible ? (tabletMargin - rightCardOffset) : 0;

  // Horizontal overflow beyond viewport if overflow: visible were used
  const leftOverflow = Math.max(0, -(16 + tabletMargin - leftCardOffset));
  const rightOverflow = Math.max(0, (16 + tabletMargin + tabletWidth + (rightCardVisible ? rightCardOffset + rightCardWidth : 0)) - viewportWidth);

  return {
    viewportWidth,
    isMobile,
    tabletWidth,
    tabletMargin,
    leftCardVisible,
    rightCardVisible,
    leftClearance,
    rightClearance,
    leftClippedPx: leftClearance < 0 ? Math.abs(leftClearance) : 0,
    rightClippedPx: rightClearance < 0 ? Math.abs(rightClearance) : 0,
    overflowPreventedByOverflowHidden: leftClearance < 0 || rightClearance < 0
  };
}

const testViewports = [320, 375, 414, 640, 768, 896, 960, 992, 1024, 1280, 1440, 1920];

console.log('=== Viewport Stress Simulation Results ===\n');
console.log('Viewport | Mobile? | Tablet Width | Side Margin | Cards Visible? | Left Clipped | Right Clipped | Overflow Status');
console.log('---------|---------|--------------|-------------|----------------|--------------|---------------|----------------');

for (const vp of testViewports) {
  const res = simulateHeroLayout(vp);
  console.log(
    `${String(res.viewportWidth).padEnd(8)} | ` +
    `${String(res.isMobile).padEnd(7)} | ` +
    `${String(res.tabletWidth + 'px').padEnd(12)} | ` +
    `${String(res.tabletMargin + 'px').padEnd(11)} | ` +
    `${String(res.leftCardVisible).padEnd(14)} | ` +
    `${String(res.leftClippedPx + 'px').padEnd(12)} | ` +
    `${String(res.rightClippedPx + 'px').padEnd(13)} | ` +
    (res.leftClippedPx > 0 ? `Prevented by overflow-hidden (${res.leftClippedPx}px)` : 'Zero Clipping & Zero Overflow')
  );
}
