import { describe, expect, it } from 'vitest';
import { EXPORT_FORMAT_VERSION } from '../dataExport';

describe('EXPORT_FORMAT_VERSION', () => {
  it('is dated string, semver-ish', () => {
    expect(EXPORT_FORMAT_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}-v\d+$/);
  });
});
