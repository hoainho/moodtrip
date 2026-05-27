import { describe, expect, it } from 'vitest';
import { buildDoodleSvg } from '../moNotebook';

describe('buildDoodleSvg', () => {
  it('returns an SVG document', () => {
    const svg = buildDoodleSvg('cafe');
    expect(svg).toMatch(/^<svg /);
    expect(svg).toContain('</svg>');
  });

  it('uses preset path for nón lá seed', () => {
    const svg = buildDoodleSvg('nón lá');
    expect(svg).toContain('Q90 5 140');
  });

  it('uses preset for biển seed', () => {
    const svg = buildDoodleSvg('biển');
    expect(svg).toContain('Q40 50');
  });

  it('falls back to text for unknown seed', () => {
    const svg = buildDoodleSvg('hoa-sen-tím');
    expect(svg).toContain('~ hoa-sen-tím ~');
  });

  it('escapes XML special chars in fallback', () => {
    const svg = buildDoodleSvg('<script>');
    expect(svg).toContain('&lt;script&gt;');
  });
});
