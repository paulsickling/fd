import { createContext, useContext } from 'react';
import type { SurferProfile } from '@/domain/types';

export interface SurferProfileState {
  /** null means the viewer has not set one — every screen must still work. */
  readonly profile: SurferProfile | null;
  readonly setProfile: (profile: SurferProfile) => void;
  readonly clearProfile: () => void;
}

export const SurferProfileContext = createContext<SurferProfileState | null>(null);

export function useSurferProfile(): SurferProfileState {
  const state = useContext(SurferProfileContext);
  if (!state) {
    throw new Error('useSurferProfile must be used within a SurferProfileProvider');
  }
  return state;
}
