import { describe, it, expect } from 'vitest';
import { buildMoSystemPrompt, detectRegion } from '../moPersona';

describe('detectRegion', () => {
  it('detects Northern destinations', () => {
    expect(detectRegion('Hà Nội')).toBe('north');
    expect(detectRegion('hanoi old quarter')).toBe('north');
    expect(detectRegion('Sapa')).toBe('north');
  });

  it('detects Central destinations', () => {
    expect(detectRegion('Huế')).toBe('central');
    expect(detectRegion('Hội An')).toBe('central');
    expect(detectRegion('Đà Nẵng')).toBe('central');
  });

  it('detects Southern destinations', () => {
    expect(detectRegion('Sài Gòn')).toBe('south');
    expect(detectRegion('Đà Lạt')).toBe('south');
    expect(detectRegion('TPHCM')).toBe('south');
  });

  it('detects Mekong destinations', () => {
    expect(detectRegion('Cần Thơ')).toBe('mekong');
    expect(detectRegion('Miền Tây')).toBe('mekong');
  });

  it('returns null for unknown / international destinations', () => {
    expect(detectRegion('Paris')).toBeNull();
    expect(detectRegion('')).toBeNull();
    expect(detectRegion(null)).toBeNull();
    expect(detectRegion(undefined)).toBeNull();
  });
});

describe('buildMoSystemPrompt', () => {
  it('always includes Mơ persona core', () => {
    const prompt = buildMoSystemPrompt();
    expect(prompt).toContain('Bạn là Mơ');
    expect(prompt).toContain('cà phê sữa đá');
  });

  it('injects dialect hint when region is central', () => {
    const prompt = buildMoSystemPrompt({ region: 'central' });
    expect(prompt).toContain('mệ');
    expect(prompt).toContain('rứa');
  });

  it('injects dialect hint when region is mekong', () => {
    const prompt = buildMoSystemPrompt({ region: 'mekong' });
    expect(prompt).toContain('mèn đét');
  });

  it('mentions the destination when provided', () => {
    const prompt = buildMoSystemPrompt({ destination: 'Đà Lạt' });
    expect(prompt).toContain('Đà Lạt');
  });

  it('does not include any dialect hint when region is null', () => {
    const prompt = buildMoSystemPrompt({ region: null });
    expect(prompt).not.toContain('mệ');
    expect(prompt).not.toContain('mèn đét');
  });

  it('always reminds the model to return valid JSON when schema-shaped', () => {
    const prompt = buildMoSystemPrompt();
    expect(prompt).toContain('JSON');
  });
});
