import { describe, expect, it } from 'vitest';
import { mapGenerationError } from '../errorCopy';
import { GenerationError } from '../geminiService';

describe('mapGenerationError — US-013 user-facing error mapping', () => {
  it('maps a user cancel to a silent return-to-form', () => {
    const m = mapGenerationError(new GenerationError('CANCELLED'));
    expect(m.cancelled).toBe(true);
    expect(m.message).toBeNull();
    expect(m.view).toBe('form');
  });

  it('shows a Vietnamese auth message and returns to the form', () => {
    const m = mapGenerationError(new GenerationError('API_KEY_INVALID'));
    expect(m.view).toBe('form');
    expect(m.message).toMatch(/hệ thống AI/i);
  });

  it('honors retryAfterSeconds in the rate-limit message (seconds)', () => {
    const m = mapGenerationError(new GenerationError('RATE_LIMIT_EXCEEDED', 45));
    expect(m.message).toContain('45 giây');
    expect(m.view).toBe('form');
  });

  it('renders minutes when retryAfterSeconds is large', () => {
    const m = mapGenerationError(new GenerationError('RATE_LIMIT_EXCEEDED', 600));
    expect(m.message).toContain('10 phút');
  });

  it('falls back to "ngày mai" when no retry interval is provided', () => {
    const m = mapGenerationError(new GenerationError('RATE_LIMIT_EXCEEDED'));
    expect(m.message).toContain('ngày mai');
  });

  it('routes timeout back to the form', () => {
    const m = mapGenerationError(new GenerationError('TIMEOUT'));
    expect(m.view).toBe('form');
    expect(m.message).toMatch(/quá nhiều thời gian/i);
  });

  it('routes invalid/empty responses to the error view', () => {
    expect(mapGenerationError(new GenerationError('INVALID_RESPONSE')).view).toBe('error');
    expect(mapGenerationError(new GenerationError('EMPTY_RESPONSE')).view).toBe('error');
  });

  it('never leaks raw technical strings for unknown errors', () => {
    const m = mapGenerationError(new Error('Proxy error: 500 Internal Server Error'));
    expect(m.message).not.toContain('Proxy error');
    expect(m.message).not.toContain('500');
    expect(m.message).toMatch(/lỗi xảy ra/i);
    expect(m.view).toBe('error');
  });
});
