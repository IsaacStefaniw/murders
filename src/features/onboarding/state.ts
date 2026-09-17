import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { InterviewAnswers } from './script';

/**
 * The interview, held on disk while it is being answered.
 *
 * ── What this used to cost ──────────────────────────────────────────────
 *
 * It was `create()` with no persistence, and the step index lived in a
 * `useState` inside the screen. Setup is around fifty screens. So a phone
 * call, a low-memory kill, a notification tapped in the middle, or simply
 * putting the phone down and coming back tomorrow put a person back at
 * question one with every answer gone.
 *
 * That is the single worst moment in the product to lose somebody, because
 * it is the only moment where they have given a great deal and received
 * nothing yet. Nobody answers fifty questions twice.
 *
 * ── Why this store and not the main one ─────────────────────────────────
 *
 * Its own key, outside `intent-os-store`, so an unfinished draft never
 * reaches backup and restore: a half-answered interview is not something
 * anybody should carry between devices, and the restore path has enough to
 * reason about already.
 *
 * ── Why a draft expires ─────────────────────────────────────────────────
 *
 * The answers include `drinkingBand`, `smokingStatus`, `mind`, `weight`
 * and `sexAtBirth`. A setup somebody abandoned two months ago and never
 * came back to should not leave that sitting on the device indefinitely —
 * it was given for a plan that was never built. After `DRAFT_TTL_DAYS` the
 * draft is dropped on read and the interview starts clean.
 */
interface OnboardingState {
  answers: InterviewAnswers;
  /** Where they had got to. Restored with the answers or it is no use. */
  stepIndex: number;
  /** When the draft was last written, so a stale one can be dropped. */
  savedAt?: string;
  setAnswer: (id: string, value: string | string[] | undefined) => void;
  setStepIndex: (i: number) => void;
  reset: () => void;
}

/** How long an unfinished interview is kept. */
export const DRAFT_TTL_DAYS = 30;

/** True where a draft is too old to offer back. */
export function draftExpired(savedAt: string | undefined, now: Date): boolean {
  if (!savedAt) return false;
  return now.getTime() - new Date(savedAt).getTime() > DRAFT_TTL_DAYS * 86400e3;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      answers: {},
      stepIndex: 0,
      setAnswer: (id, value) =>
        set((s) => ({
          answers: { ...s.answers, [id]: value },
          savedAt: new Date().toISOString(),
        })),
      setStepIndex: (i) => set({ stepIndex: i, savedAt: new Date().toISOString() }),
      reset: () => set({ answers: {}, stepIndex: 0, savedAt: undefined }),
    }),
    {
      name: 'intentnorth.onboarding',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ answers: s.answers, stepIndex: s.stepIndex, savedAt: s.savedAt }),
      onRehydrateStorage: () => (state) => {
        // Dropped here rather than at the call site, so every route into
        // the interview gets the same answer about what is too old.
        if (state && draftExpired(state.savedAt, new Date())) {
          state.answers = {};
          state.stepIndex = 0;
          state.savedAt = undefined;
        }
      },
    },
  ),
);
