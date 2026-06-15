// frontend/src/test/EcosystemTree.test.tsx
// Tests for EcosystemTree — verifies correct SVG elements render per stage
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import EcosystemTree from '../components/EcosystemTree';

// Helper to render and return SVG content as a string
function renderTree(stage: number) {
  const { container } = render(<EcosystemTree stage={stage} />);
  return container;
}

describe('EcosystemTree', () => {
  // ── Stage 0: Seed ────────────────────────────────────────────────────────

  it('renders an SVG element for all stages', () => {
    for (let stage = 0; stage <= 5; stage++) {
      const container = renderTree(stage);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
    }
  });

  it('stage 0 (Seed) renders a glow spot but no trunk', () => {
    const container = renderTree(0);
    // Seed stage: should have a circle with the accent glow, no <path> for trunk
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
    // No tall trunk path characteristic of stage 2+
    const paths = container.querySelectorAll('path');
    // Only ground path expected, no branch paths
    const trunkPaths = Array.from(paths).filter(p =>
      p.getAttribute('stroke') === 'url(#trunkGrad)'
    );
    expect(trunkPaths.length).toBe(0);
  });

  // ── Stage 1: Sprout ──────────────────────────────────────────────────────

  it('stage 1 (Sprout) renders a stem and small leaves', () => {
    const container = renderTree(1);
    const paths = container.querySelectorAll('path');
    const trunkPaths = Array.from(paths).filter(p =>
      p.getAttribute('stroke') === 'url(#trunkGrad)'
    );
    expect(trunkPaths.length).toBeGreaterThan(0);
    // Should have leaf paths
    const leafPaths = Array.from(paths).filter(p =>
      p.getAttribute('fill') === 'url(#leafGrad)'
    );
    expect(leafPaths.length).toBeGreaterThan(0);
  });

  // ── Stage 3: Young Tree ──────────────────────────────────────────────────

  it('stage 3 (Young Tree) renders foliage circles', () => {
    const container = renderTree(3);
    const circles = container.querySelectorAll('circle');
    const foliageCircles = Array.from(circles).filter(c =>
      c.getAttribute('fill') === 'url(#leafGrad)'
    );
    expect(foliageCircles.length).toBeGreaterThan(0);
  });

  it('stage 3 renders multiple branches', () => {
    const container = renderTree(3);
    const paths = container.querySelectorAll('path');
    const branchPaths = Array.from(paths).filter(p =>
      p.getAttribute('stroke') === 'url(#trunkGrad)'
    );
    // Stage 3 has trunk + 3 branch paths
    expect(branchPaths.length).toBeGreaterThanOrEqual(3);
  });

  // ── Stage 5: Blooming Ecosystem ──────────────────────────────────────────

  it('stage 5 (Bloom) renders flower circles', () => {
    const container = renderTree(5);
    const circles = container.querySelectorAll('circle');
    const flowerCircles = Array.from(circles).filter(c =>
      c.getAttribute('fill') === 'url(#flowerGrad)'
    );
    expect(flowerCircles.length).toBeGreaterThan(0);
  });

  it('stage 5 renders butterfly paths', () => {
    const container = renderTree(5);
    // Butterflies are rendered as path elements with amber/accent fill
    const paths = container.querySelectorAll('path');
    const butterflyPaths = Array.from(paths).filter(p =>
      p.getAttribute('fill') === '#f59e0b' ||
      p.getAttribute('fill') === 'var(--accent-primary)'
    );
    expect(butterflyPaths.length).toBeGreaterThan(0);
  });

  it('stage 5 renders cloud paths (white fill)', () => {
    const container = renderTree(5);
    const paths = container.querySelectorAll('path');
    const cloudPaths = Array.from(paths).filter(p =>
      p.getAttribute('fill') === 'white'
    );
    expect(cloudPaths.length).toBeGreaterThanOrEqual(2);
  });

  // ── Cumulative Stage Logic ────────────────────────────────────────────────

  it('higher stages include elements from lower stages (cumulative rendering)', () => {
    // Stage 4 should include the trunk from stage 2 (>= 2 condition in JSX)
    const container = renderTree(4);
    const paths = container.querySelectorAll('path');
    const trunkPaths = Array.from(paths).filter(p =>
      p.getAttribute('stroke') === 'url(#trunkGrad)'
    );
    // Stage 4 has thick trunk + complex branch system
    expect(trunkPaths.length).toBeGreaterThanOrEqual(4);
  });

  // ── SVG Structure ────────────────────────────────────────────────────────

  it('renders with the correct viewBox', () => {
    const container = renderTree(0);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 200 200');
  });

  it('renders gradient defs for trunk and leaves', () => {
    const container = renderTree(3);
    expect(container.querySelector('#trunkGrad')).not.toBeNull();
    expect(container.querySelector('#leafGrad')).not.toBeNull();
  });
});
