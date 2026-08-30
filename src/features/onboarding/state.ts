import { create } from 'zustand';

import type { InterviewAnswers } from './script';

/** Transient interview state — lives only until onboarding completes. */
interface OnboardingState {
  answers: InterviewAnswers;
  setAnswer: (id: string, value: string | string[] | undefined) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  answers: {},
  setAnswer: (id, value) => set((s) => ({ answers: { ...s.answers, [id]: value } })),
  reset: () => set({ answers: {} }),
}));
