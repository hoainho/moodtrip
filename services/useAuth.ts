import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getCurrentSnapshot, subscribeAuth } from './authSession';

export interface UseAuthResult {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth(): UseAuthResult {
  const [snap, setSnap] = useState(() => getCurrentSnapshot());
  useEffect(() => subscribeAuth(setSnap), []);
  return snap;
}
