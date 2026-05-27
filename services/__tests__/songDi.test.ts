import { describe, expect, it } from 'vitest';
import { isSongDiSupported } from '../songDi';

describe('isSongDiSupported', () => {
  it('returns false in happy-dom (no MediaRecorder)', () => {
    expect(isSongDiSupported()).toBe(false);
  });
});
