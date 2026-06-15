import { GenerationError, GENERATION_CANCELLED } from './geminiService';

export interface MappedGenerationError {
  /** User-facing Vietnamese message. `null` = show nothing (e.g. user cancelled). */
  message: string | null;
  /** Where to send the user after the error. */
  view: 'form' | 'error';
  /** True when the user cancelled — caller should quietly return to the form. */
  cancelled: boolean;
}

function retryWhen(seconds?: number): string {
  if (!seconds || seconds <= 0) return 'vào ngày mai';
  if (seconds < 90) return `sau ${Math.ceil(seconds)} giây`;
  if (seconds < 3600) return `sau ${Math.ceil(seconds / 60)} phút`;
  return 'vào ngày mai';
}

/**
 * Maps any error thrown by `generateItinerary` to friendly Vietnamese copy and a target view.
 * Raw technical/English strings never reach the UI — anything unrecognized becomes a generic message.
 */
export function mapGenerationError(err: unknown): MappedGenerationError {
  const code = err instanceof GenerationError ? err.code : (err as { message?: string })?.message ?? 'UNKNOWN';
  const retryAfterSeconds = err instanceof GenerationError ? err.retryAfterSeconds : undefined;

  switch (code) {
    case GENERATION_CANCELLED:
      return { message: null, view: 'form', cancelled: true };
    case 'API_KEY_INVALID':
      return { message: 'Lỗi xác thực với hệ thống AI. Vui lòng thử lại sau.', view: 'form', cancelled: false };
    case 'RATE_LIMIT_EXCEEDED':
      return {
        message: `Bạn đã đạt giới hạn tạo lịch trình. Vui lòng thử lại ${retryWhen(retryAfterSeconds)}.`,
        view: 'form',
        cancelled: false,
      };
    case 'BUDGET_EXCEEDED':
      return {
        message: 'Hệ thống AI đang nghỉ để cân bằng tài nguyên. Vui lòng quay lại vào ngày mai nhé.',
        view: 'form',
        cancelled: false,
      };
    case 'TIMEOUT':
      return { message: 'Tạo lịch trình mất quá nhiều thời gian. Vui lòng thử lại.', view: 'form', cancelled: false };
    case 'INVALID_RESPONSE':
      return { message: 'Định dạng phản hồi từ AI không hợp lệ. Vui lòng thử lại.', view: 'error', cancelled: false };
    case 'EMPTY_RESPONSE':
      return { message: 'AI trả về phản hồi rỗng. Vui lòng thử lại sau.', view: 'error', cancelled: false };
    default:
      return { message: 'Đã có lỗi xảy ra không mong muốn. Vui lòng thử lại.', view: 'error', cancelled: false };
  }
}
