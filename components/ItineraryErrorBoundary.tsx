import { Component } from 'react';
import type { ReactNode } from 'react';
import { ITINERARY_LS_KEY } from '../constants';
import { IconWarning } from './icons';

interface Props {
  children: ReactNode;
  /** Called when the user chooses to recover (start a new trip). */
  onRecover: () => void;
}

interface State {
  hasError: boolean;
}

/**
 * Isolates a render crash in the itinerary result view. A malformed itinerary that slips past
 * `parseItinerary` (or any downstream render error) would otherwise blank the whole app — and because
 * the itinerary is cached in localStorage, it would re-crash on every reload. On catch we purge the
 * cached itinerary so the next load is clean, and show a recoverable Vietnamese error UI.
 */
export class ItineraryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[MoodTrip] Itinerary render crashed; purging cached itinerary.', error);
    try {
      localStorage.removeItem(ITINERARY_LS_KEY);
    } catch {
      void 0;
    }
  }

  private handleRecover = () => {
    this.setState({ hasError: false });
    this.props.onRecover();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center p-8 flex flex-col items-center justify-center min-h-[60vh]">
          <IconWarning className="w-16 h-16 mb-6 text-amber-400" />
          <h2 className="text-2xl font-bold mb-3 text-white">Lịch trình này bị lỗi hiển thị</h2>
          <p className="max-w-md mb-8 text-slate-400">
            Đã có sự cố khi hiển thị lịch trình. Chúng tôi đã xóa bản lưu bị lỗi. Hãy thử tạo lại một hành trình mới nhé.
          </p>
          <button
            onClick={this.handleRecover}
            className="min-h-[44px] px-8 py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-500/30 transition-colors"
          >
            Tạo lại hành trình
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
