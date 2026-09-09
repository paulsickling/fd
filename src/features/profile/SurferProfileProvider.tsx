import { useCallback, useMemo, useState, type ReactNode } from 'react';
import type { SurferProfile } from '@/domain/types';
import { SurferProfileContext } from './surferProfileContext';
import { loadProfile, saveProfile } from './surferProfileStore';

export function SurferProfileProvider({ children }: { children: ReactNode }) {
  // Read once on mount rather than on every render; a blocked store yields null.
  const [profile, setProfileState] = useState<SurferProfile | null>(() => loadProfile());

  const setProfile = useCallback((next: SurferProfile) => {
    setProfileState(next);
    saveProfile(next);
  }, []);

  const clearProfile = useCallback(() => {
    setProfileState(null);
    saveProfile(null);
  }, []);

  const value = useMemo(
    () => ({ profile, setProfile, clearProfile }),
    [profile, setProfile, clearProfile],
  );

  return <SurferProfileContext value={value}>{children}</SurferProfileContext>;
}
